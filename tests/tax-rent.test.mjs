import test from "node:test";
import assert from "node:assert/strict";
import {progressiveCapitalGainsTax,rentalEarlyExitPenalty,project} from "../engine.mjs";
const c=()=>({months:12,initialCash:200000,investmentAnnualNet:0,property:{price:100000,marketValue:150000},rent:{monthly:1000,contractMonths:24,contractPenaltyMonths:3,penaltyMode:"proportional"},sale:{sellAtEnd:true,taxPolicy:"progressive"},strategies:["cash","rent"]});
test("Brazil 2026 capital gains marginal brackets",()=>{
 assert.equal(progressiveCapitalGainsTax(100000),15000);
 assert.equal(progressiveCapitalGainsTax(6000000),925000);
 assert.equal(progressiveCapitalGainsTax(11000000),1925000);
 assert.equal(progressiveCapitalGainsTax(32000000),6675000);
});
test("single-property exemption is opt-in and requires both declarations",()=>{
 const a=c();assert.ok(project(a,"cash").ledger.some(x=>x.category==="capital-gains-tax"&&x.amount<0));
 a.sale.onlyProperty=true;a.sale.noSalePast5Years=true;
 assert.equal(project(a,"cash").ledger.filter(x=>x.category==="capital-gains-tax").length,0);
});
test("proportional rent penalty and manual mode",()=>{
 const a=c();
 assert.equal(rentalEarlyExitPenalty(a.rent,12),1500);
 assert.ok(project(a,"rent").ledger.some(x=>x.category==="rent-exit"&&x.amount===-1500));
 a.rent.penaltyMode="manual";a.rent.earlyExitPenalty=200;
 assert.equal(rentalEarlyExitPenalty(a.rent,12),200);
});
test("deposit growth remains linked until returned",()=>{
 const a=c();a.rent.deposit=3000;a.rent.depositAnnualReturn=.1;
 const x=project(a,"rent");
 assert.ok(x.months[1].deposit>3000);
 assert.ok(x.ledger.some(e=>e.category==="deposit-return" && e.amount>3000));
});
