import{paramsFor}from"../legislation/parameters.js";
const iso=y=>y+"-01-01",end=y=>y+"-12-31";
function checkDate(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s||""))throw Error("Neplatné datum.");const d=new Date(s+"T12:00:00Z");if(isNaN(d)||d.toISOString().slice(0,10)!==s)throw Error("Neplatné datum.");return d;}
export function calendarDays(a,b){let x=checkDate(a),y=checkDate(b);return a>b?0:Math.round((y-x)/86400000)+1;}
export function weekdays(a,b){if(a>b)return 0;let n=0;for(let t=+checkDate(a),e=+checkDate(b);t<=e;t+=86400000){let d=new Date(t).getUTCDay();if(d&&d<6)n++}return n;}
function validate(y,h,w){if(!Number.isInteger(y)||y<2024||y>2100)throw Error("Neplatný rok.");if(!(h>0&&h<=80))throw Error("Úvazek musí být 0 až 80 hodin.");if(!(w>=4&&w<=20))throw Error("Výměra musí být 4 až 20 týdnů.");}
function period(a,b,y){checkDate(a);checkDate(b);if(a>b)throw Error("Začátek je později než konec.");let start=a>iso(y)?a:iso(y),finish=b<end(y)?b:end(y);if(start>finish)throw Error("Období nepatří do zvoleného roku.");return{start,end:finish};}
function entitlement(m,h,w,y,eligible=true){let ok=eligible&&m>=4,raw=ok?m*h*w/52:0;return{fullMultiples:m,denominator:52,weeklyHours:h,annualLeaveWeeks:w,leaveWeeks:ok?m*w/52:0,rawHours:raw,hours:ok?Math.ceil(raw-1e-9):0,qualifies:ok};}
export function calculateRegular({start,end,year=2026,weeklyHours=40,leaveWeeks=4}){validate(year,weeklyHours,leaveWeeks);let p=period(start,end,year),plannedWeekdays=weekdays(p.start,p.end),creditedHours=plannedWeekdays*weeklyHours/5;return{...entitlement(Math.floor(creditedHours/weeklyHours+1e-9),weeklyHours,leaveWeeks,year),plannedWeekdays,creditedHours,period:p,model:"Rovnoměrné směny po–pá"};}
export function calculateSicknessPeriods({year=2026,start="",end="",sicknessPeriods=[],weeklyHours=40,leaveWeeks=4,workAccident=false}){
validate(year,weeklyHours,leaveWeeks);
const p=period(start||iso(year),end||endYear(year),year);
if(!Array.isArray(sicknessPeriods)||!sicknessPeriods.length)throw Error("Zadejte alespoň jedno období nemoci.");
const periodDetails=sicknessPeriods.map((v,i)=>{
if(!v||!v.from||!v.to)throw Error("U období "+(i+1)+" vyplňte obě data.");
checkDate(v.from);checkDate(v.to);if(v.from>v.to)throw Error("Obrácené období nemoci "+(i+1)+".");
const a=v.from>p.start?v.from:p.start,b=v.to<p.end?v.to:p.end,hasDays=a<=b;
const calendar=hasDays?calendarDays(a,b):0,working=hasDays?weekdays(a,b):0;
return{label:v.label??i+1,from:v.from,to:v.to,countedFrom:hasDays?a:null,countedTo:hasDays?b:null,clipped:!hasDays||a!==v.from||b!==v.to,calendarDays:calendar,workingDays:working,weeks:working/5};
});
const summedCalendarDays=periodDetails.reduce((n,v)=>n+v.calendarDays,0),summedWorkingDays=periodDetails.reduce((n,v)=>n+v.workingDays,0);
const spans=periodDetails.filter(v=>v.countedFrom).map(v=>({from:v.countedFrom,to:v.countedTo})).sort((a,b)=>a.from.localeCompare(b.from));
const merged=[];for(const span of spans){const last=merged[merged.length-1];if(last&&span.from<=last.to){if(span.to>last.to)last.to=span.to;}else merged.push({...span});}
const uniqueCalendarDays=merged.reduce((n,v)=>n+calendarDays(v.from,v.to),0),uniqueWorkingDays=merged.reduce((n,v)=>n+weekdays(v.from,v.to),0);
const totalDays=weekdays(p.start,p.end),absentHours=uniqueWorkingDays*weeklyHours/5,outsideHours=(totalDays-uniqueWorkingDays)*weeklyHours/5,cfg=paramsFor(year);
const outsideCondition=outsideHours>=cfg.sicknessOutsideMinimumMultiples*weeklyHours;
const recognizedHours=workAccident?absentHours:outsideCondition?Math.min(absentHours,cfg.sicknessCreditMaxWeeklyMultiples*weeklyHours):0;
const creditedHours=outsideHours+recognizedHours,m=Math.floor(creditedHours/weeklyHours+1e-9),base=calculateRegular({start:p.start,end:p.end,year,weeklyHours,leaveWeeks}),r=entitlement(m,weeklyHours,leaveWeeks,year);
return{...r,period:p,periodDetails,summedCalendarDays,summedWorkingDays,summedWeeks:summedWorkingDays/5,uniqueCalendarDays,uniqueWorkingDays,uniqueWeeks:uniqueWorkingDays/5,overlaps:summedCalendarDays>uniqueCalendarDays,totalDays,absentDays:uniqueWorkingDays,absentHours,absentMultiples:absentHours/weeklyHours,outsideHours,outsideMultiples:outsideHours/weeklyHours,outsideCondition,recognizedHours,recognizedMultiples:recognizedHours/weeklyHours,notRecognizedHours:absentHours-recognizedHours,notRecognizedMultiples:(absentHours-recognizedHours)/weeklyHours,creditedHours,differenceHours:Math.max(0,base.hours-r.hours),differenceWeeks:Math.max(0,base.leaveWeeks-r.leaveWeeks),baseline:base,workAccident};
}
export function calculateSickness({sicknessFrom,sicknessTo,...options}){return calculateSicknessPeriods({...options,sicknessPeriods:[{from:sicknessFrom,to:sicknessTo}]});}

function endYear(y){return y+"-12-31"}
export function calculateDpp({year=2026,start,end,creditedHours,leaveWeeks=4}){validate(year,20,leaveWeeks);if(!Number.isFinite(creditedHours)||creditedHours<0)throw Error("Neplatné hodiny.");let p=period(start,end,year),contractDays=calendarDays(p.start,p.end),eligibleDays=contractDays>=28,eligibleHours=creditedHours>=80,m=Math.floor(creditedHours/20+1e-9);return{...entitlement(m,20,leaveWeeks,year,eligibleDays&&eligibleHours),contractDays,eligibleDays,eligibleHours,creditedHours,period:p};}
