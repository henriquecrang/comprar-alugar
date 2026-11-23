import test from "node:test";
import assert from "node:assert/strict";
import {project,baseline} from "../engine.mjs";
const c=()=>({months:2,initialCash:10000,monthlyContribution:0,investmentAnnualNet:0,inflationAnnual:0,property:{price:1000,marketValue:1000,maintenanceMonthly:0},rent:{monthly:0},sale:{sellAtEnd:false},strategies:["rent","cash"]});
test("monthly series of investment returns applied in baseline and rental cash",()=>{
 const a=c();a.monthlyRates={investment:[.01,.02]};
 assert.ok(Math.abs(baseline(a)-10302)<.0001);
 assert.ok(Math.abs(project(a,"rent").summary.cash-10302)<.0001);
});
test("monthly inflation affects real wealth but not nominal rental wealth",()=>{
 const a=c();a.monthlyRates={inflation:[.1,0]};const x=project(a,"rent").summary;
 assert.equal(x.netWorth,10000);assert.ok(Math.abs(x.netWorthReal-10000/1.1)<1e-6);
});
test("reserve transfer is asset, spending decreases wealth exactly once",()=>{
 const a=c();a.property.initialMaintenanceReserve=300;
 a.property.maintenanceMonthly=50;
 const x=project(a,"cash");
 assert.equal(x.months[0].netWorth,10000);
 assert.ok(Math.abs(x.summary.netWorth-9900)<1e-6);
 assert.equal(x.months[1].reserve,250);
});
test("reserve is released as cash at property sale without wealth creation",()=>{
 const a=c();a.sale.sellAtEnd=true;a.property.initialMaintenanceReserve=300;
 const x=project(a,"cash");
 assert.equal(x.summary.reserve,0);
 assert.ok(Math.abs(x.summary.netWorth-10000)<1e-6);
});
test("invalid monthly series rejected",()=>{
 const a=c();a.monthlyRates={investment:[.01]};assert.throws(()=>project(a,"rent"));
});
