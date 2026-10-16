import test from "node:test";import assert from "node:assert/strict";import{calculateRegular,calculateSickness,calculateSicknessPeriods,calculateDpp,weekdays}from"../src/dovolena/calculations.js";
test("Celý rok: 52 týdenních dob, 160 h",()=>{let r=calculateRegular({start:"2026-01-01",end:"2026-12-31"});assert.equal(r.fullMultiples,52);assert.equal(r.hours,160)});
test("Poměrný nárok od nástupu",()=>{let r=calculateRegular({start:"2026-07-01",end:"2026-12-31"});assert(r.hours>0&&r.hours<160)});
test("Krátký pracovní poměr nevytváří nárok",()=>assert.equal(calculateRegular({start:"2026-10-01",end:"2026-10-12"}).hours,0));
test("Dlouhodobá nemoc sníží nárok",()=>{let r=calculateSickness({sicknessFrom:"2026-03-01",sicknessTo:"2026-11-30"});assert(r.differenceHours>0)});
test("Omezení uznané nemoci na 20 násobků TPD",()=>{let r=calculateSickness({sicknessFrom:"2026-04-01",sicknessTo:"2026-12-31"});assert(r.recognizedMultiples<=20)});
test("Pracovní úraz: nemoc bez stropu",()=>{let r=calculateSickness({sicknessFrom:"2026-01-01",sicknessTo:"2026-12-31",workAccident:true});assert.equal(r.hours,160)});
test("Volitelný nástup a konec u nemoci",()=>{let r=calculateSickness({sicknessFrom:"2026-08-01",sicknessTo:"2026-08-31"});assert.equal(r.period.start,"2026-01-01")});
test("DPP 215 h = 16 h",()=>{let r=calculateDpp({start:"2026-01-01",end:"2026-12-31",creditedHours:215});assert.equal(r.hours,16)});
test("DPP pod 28 dny = 0",()=>{let r=calculateDpp({start:"2026-01-01",end:"2026-01-20",creditedHours:100});assert.equal(r.hours,0)});
test("DPP pod 80 h = 0",()=>{let r=calculateDpp({start:"2026-01-01",end:"2026-02-28",creditedHours:79});assert.equal(r.hours,0)});
test("Obrácené datum je chyba",()=>assert.throws(()=>calculateRegular({start:"2026-10-05",end:"2026-09-01"})));
test("Pracovní dny",()=>assert.equal(weekdays("2026-10-05","2026-10-09"),5));

test("Tři nemoci – dny a týdny po jednotlivých zadáních",()=>{
  const r=calculateSicknessPeriods({sicknessPeriods:[
    {from:"2026-01-05",to:"2026-01-09"},
    {from:"2026-02-02",to:"2026-02-06"},
    {from:"2026-03-07",to:"2026-03-09"}
  ]});
  assert.deepEqual(r.periodDetails.map(p=>[p.calendarDays,p.workingDays,p.weeks]),[[5,5,1],[5,5,1],[3,1,0.2]]);
  assert.equal(r.summedCalendarDays,13);
  assert.equal(r.summedWorkingDays,11);
  assert.equal(r.uniqueCalendarDays,13);
  assert.equal(r.uniqueWeeks,2.2);
});
test("Překryv období se nesčítá dvakrát",()=>{
  const r=calculateSicknessPeriods({sicknessPeriods:[
    {from:"2026-01-05",to:"2026-01-09"},
    {from:"2026-01-07",to:"2026-01-12"},
    {from:"2026-05-01",to:"2026-05-03"}
  ]});
  assert.equal(r.overlaps,true);
  assert.equal(r.summedCalendarDays,14);
  assert.equal(r.uniqueCalendarDays,11);
  assert.equal(r.summedWorkingDays,10);
  assert.equal(r.uniqueWorkingDays,7);
  assert.equal(r.absentDays,7);
});
test("Čtyři nebo více období nemoci",()=>{
  const r=calculateSicknessPeriods({sicknessPeriods:[
    {from:"2026-07-01",to:"2026-07-03"},
    {from:"2026-10-05",to:"2026-10-07"},
    {from:"2026-11-02",to:"2026-11-06"},
    {from:"2026-12-14",to:"2026-12-18"}
  ]});
  assert.equal(r.periodDetails.length,4);
  assert.equal(r.uniqueWorkingDays,16);
  assert.equal(r.uniqueWeeks,3.2);
});
test("Nemoc přes hranici roku se krátí na vybraný rok",()=>{
  const r=calculateSicknessPeriods({sicknessPeriods:[{from:"2025-12-22",to:"2026-01-09"}]});
  assert.equal(r.periodDetails[0].calendarDays,9);
  assert.equal(r.periodDetails[0].workingDays,7);
  assert.equal(r.periodDetails[0].clipped,true);
});
test("Prázdné nebo neúplné období není platné",()=>{
  assert.throws(()=>calculateSicknessPeriods({sicknessPeriods:[]}));
  assert.throws(()=>calculateSicknessPeriods({sicknessPeriods:[{from:"2026-01-01",to:""}]}));
});
