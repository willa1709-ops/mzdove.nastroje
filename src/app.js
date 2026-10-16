import{calculateRegular,calculateSicknessPeriods,calculateDpp}from"./dovolena/calculations.js";import{LEGISLATION}from"./legislation/parameters.js";
const $=id=>document.getElementById(id),v=id=>$(id).value,n=id=>Number(v(id)),fmt=(x,d=4)=>new Intl.NumberFormat("cs-CZ",{maximumFractionDigits:d}).format(x);let mode="new";
function syncYear(){let y=n("year"),verified=LEGISLATION[y];$("law-status").textContent=verified?"Pravidla ověřena: "+verified.verifiedOn:"Rok legislativně neověřen";if(document.querySelector('input[name="leave-joined"]:checked').value==="no")$("leave-start").value=y+"-01-01";}
function joined(){let no=document.querySelector('input[name="leave-joined"]:checked').value==="no";$("leave-start").disabled=no;$("leave-start").value=no?n("year")+"-01-01":"";render();}
function calculate(){let year=n("year");if(!Number.isInteger(year)||year<2024||year>2100)throw Error("Neplatný rok.");if(mode==="new"){if(!v("new-start"))return null;return calculateRegular({year,start:v("new-start"),end:year+"-12-31",weeklyHours:n("new-hours"),leaveWeeks:n("new-weeks")});}if(mode==="leave"){if(!v("leave-start")||!v("leave-end"))return null;return calculateRegular({year,start:v("leave-start"),end:v("leave-end"),weeklyHours:n("leave-hours"),leaveWeeks:n("leave-weeks")});}if(mode==="sick"){
const entries=[...document.querySelectorAll(".sick-period-row")].map((r,i)=>({label:i+1,from:r.querySelector(".sick-from").value,to:r.querySelector(".sick-to").value}));
const incomplete=entries.find(r=>(r.from&&!r.to)||(!r.from&&r.to));
if(incomplete)throw Error("U období "+incomplete.label+" doplňte datum od i do.");
const sicknessPeriods=entries.filter(r=>r.from&&r.to);
if(!sicknessPeriods.length)return null;
return calculateSicknessPeriods({year,start:v("sick-start"),end:v("sick-end"),sicknessPeriods,weeklyHours:n("sick-hours"),leaveWeeks:n("sick-weeks"),workAccident:$("sick-accident").checked});
}if(!v("dpp-start")||!v("dpp-end")||v("dpp-hours")==="")return null;return calculateDpp({year,start:v("dpp-start"),end:v("dpp-end"),creditedHours:n("dpp-hours"),leaveWeeks:n("dpp-weeks")});}
const row=(a,b)=>'<tr><td>'+a+'</td><td>'+b+'</td></tr>', esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function render(){syncYear();let r;try{r=calculate();}catch(e){$("result").innerHTML='<div class="warning" role="alert">'+esc(e.message)+'</div>';return;}if(!r){$("result").innerHTML='<div class="empty-state"><h2>Výsledek výpočtu</h2><p>Vyplňte vstupní údaje a zobrazíme počet týdnů, hodiny a postup výpočtu.</p></div>';return;}
let html='<p class="eyebrow">VÝSLEDEK VÝPOČTU</p><div class="results-grid"><div class="result-number"><strong>'+fmt(r.leaveWeeks,6)+'</strong><span>týdne dovolené</span></div><div class="result-number"><strong>'+fmt(r.hours)+' h</strong><span>hodin dovolené</span></div></div><h3>Postup výpočtu</h3><table class="calc-table">'+row("Celé započtené týdenní doby",r.fullMultiples+" z 52")+row("Týdenní pracovní doba",fmt(r.weeklyHours)+" h")+row("Výměra dovolené",fmt(r.annualLeaveWeeks)+" týdny")+'</table><h3>Nárok v týdnech</h3><div class="equation">'+(r.qualifies?r.fullMultiples+" / 52 × "+fmt(r.annualLeaveWeeks)+" = "+fmt(r.leaveWeeks,6)+" týdne":"Nárok = 0 týdnů")+'</div><h3>Nárok v hodinách</h3><div class="equation">'+(r.qualifies?r.fullMultiples+" / 52 × "+fmt(r.weeklyHours)+" × "+fmt(r.annualLeaveWeeks)+" = "+fmt(r.rawHours,6)+" h → "+fmt(r.hours)+" h":"Nárok = 0 h")+'</div>';
if(mode==="sick"){
html+='<h3>Období nemoci – dny a týdny</h3><div class="sickness-table-scroll"><table class="sickness-table"><thead><tr><th>Období</th><th>Kalendářní dny</th><th>Pracovní dny</th><th>Týdny nemoci</th></tr></thead><tbody>';
html+=r.periodDetails.map(p=>'<tr><td><strong>'+p.label+'.</strong> '+esc(p.from)+' – '+esc(p.to)+'</td><td>'+p.calendarDays+'</td><td>'+p.workingDays+'</td><td>'+fmt(p.weeks,2)+'</td></tr>').join("");
html+='<tr class="sum-row"><th>Součet období</th><td>'+r.summedCalendarDays+'</td><td>'+r.summedWorkingDays+'</td><td>'+fmt(r.summedWeeks,2)+'</td></tr>';
if(r.overlaps)html+='<tr class="unique-row"><th>Pro výpočet bez překryvů</th><td>'+r.uniqueCalendarDays+'</td><td>'+r.uniqueWorkingDays+'</td><td>'+fmt(r.uniqueWeeks,2)+'</td></tr>';
html+='</tbody></table></div>';
html+='<p class="note">Kalendářní dny jsou včetně obou dat; pracovní dny jsou v tomto modelu pondělí až pátek (bez odečtení svátků), týdny nemoci = pracovní dny / 5.</p>';
if(r.periodDetails.some(p=>p.clipped))html+='<p class="warning">Některá období přesahují zaměstnání nebo vybraný rok. Pro uvedené počty se používá pouze jejich část ve výpočtovém období.</p>';
if(r.overlaps)html+='<p class="warning">Část období se překrývá. Součet řádků uvádíme pro kontrolu, do výpočtu nároku vstupuje pouze počet dnů bez duplicit.</p>';
html+='<h3>Výpočet nároku podle § 216</h3><table class="calc-table">'+row("Mimo nemoc",fmt(r.outsideMultiples,2)+" týdenních dob")+row("Nemoc celkem",fmt(r.absentMultiples,2)+" týdenních dob")+row("Uznaná nemoc",fmt(r.recognizedMultiples,2)+" týdenních dob")+row("Neuznaná nemoc",fmt(r.notRecognizedMultiples,2)+" týdenních dob")+row("12 týdenních dob mimo nemoc",r.outsideCondition?"Splněno":"Nesplněno")+row("Nárok bez nemoci",fmt(r.baseline.leaveWeeks,6)+" týdne / "+r.baseline.hours+" h")+'</table><p class="summary">Snížení nároku: '+fmt(r.differenceWeeks,6)+' týdne / '+r.differenceHours+' h</p>';
}
if(mode==="dpp")html+='<h3>Podmínky DPP</h3><table class="calc-table">'+row("Trvání v roce",r.contractDays+" dnů")+row("28 dnů",r.eligibleDays?"Splněno":"Nesplněno")+row("80 hodin",r.eligibleHours?"Splněno":"Nesplněno")+'</table>';
if(!r.qualifies)html+='<p class="warning">Nebyly splněny všechny podmínky pro vznik nároku.</p>';if(!LEGISLATION[n("year")])html+='<p class="warning">Pro tento rok nebyly parametry ověřeny; použit model roku 2026.</p>';
html+='<p class="note">Orientační výpočet: pravidelná pracovní doba po–pá. Skutečný rozvrh směn, další překážky a změny úvazku mohou výsledek změnit.</p>';$("result").innerHTML=html;}
const sickList=$("sick-period-list");
function renumberSickRows(){
[...sickList.children].forEach((row,i)=>{
row.querySelector(".period-number").textContent=i+1;
row.querySelector(".sick-from").setAttribute("aria-label","Období "+(i+1)+" nemoc od");
row.querySelector(".sick-to").setAttribute("aria-label","Období "+(i+1)+" nemoc do");
row.querySelector(".remove-sick-period").hidden=i<3;
});
}
function addSickRow(){
const row=document.createElement("div");
row.className="sick-period-row";
row.innerHTML='<div class="sick-period-head"><strong>Období <span class="period-number"></span></strong><button type="button" class="remove-sick-period secondary-button">Odebrat</button></div><div class="input-grid"><label class="field"><span>Nemoc od</span><input type="date" class="sick-from" /></label><label class="field"><span>Nemoc do</span><input type="date" class="sick-to" /></label></div>';
sickList.append(row);renumberSickRows();
}
for(let i=0;i<3;i++)addSickRow();
$("sick-add").addEventListener("click",()=>{addSickRow();render();});
sickList.addEventListener("input",render);
sickList.addEventListener("click",event=>{
if(!event.target.closest(".remove-sick-period"))return;
if(sickList.children.length>3){event.target.closest(".sick-period-row").remove();renumberSickRows();render();}
});
document.querySelectorAll(".tab").forEach(tab=>tab.addEventListener("click",()=>{mode=tab.dataset.mode;document.querySelectorAll(".tab").forEach(t=>{t.classList.toggle("is-active",t===tab);t.setAttribute("aria-selected",String(t===tab));});document.querySelectorAll(".form-content").forEach(f=>f.hidden=f.dataset.form!==mode);render();}));
document.querySelectorAll("input").forEach(input=>!input.closest("#sick-period-list")&&input.addEventListener(input.name==="leave-joined"?"change":"input",input.name==="leave-joined"?joined:render));joined();render();
