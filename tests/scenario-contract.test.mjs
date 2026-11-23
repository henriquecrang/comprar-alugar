import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {migrateScenario,serializeScenario,FIELDS,ROOT} from "../scenario.mjs";
import {compare,project} from "../model-api.mjs";
import {assessComparability} from "../comparability.mjs";

const copy=o=>JSON.parse(JSON.stringify(o));
const preset=JSON.parse(readFileSync(new URL("../presets/rio-exemplo.json",import.meta.url),"utf8"));
const schema=JSON.parse(readFileSync(new URL("../schema/scenario.schema.json",import.meta.url),"utf8"));
test("schema v1 completo com unidades, provenance e condições das cinco estratégias",()=>{
  assert.equal(schema.$schema,"https://json-schema.org/draft/2020-12/schema");
  assert.ok(schema.required.includes("schemaVersion"));
  assert.equal(schema.properties.initialCash["x-unit"],"BRL");
  assert.equal(schema.properties.inflationAnnual["x-unit"],"fração por ano");
  assert.ok(schema.properties.strategyOverrides.properties.mortgage.properties.mortgage.properties.insuranceMonthly);
  assert.ok(schema.properties.metadata.properties.assumptions);
  assert.equal(schema.properties.property.additionalProperties,false);
  assert.equal(schema.allOf.length,3);
});
test("preset v1 e scenario da UI podem serializar com estabilidade sem perdas",()=>{
  const before=copy(preset);
  const s=migrateScenario(preset);
  assert.deepEqual(s,before);
  assert.deepEqual(JSON.parse(serializeScenario(s)),s);
  assert.deepEqual(preset,before);
  assert.equal(compare(s).results.length,5);
});
test("migração real: JSON legado sem versão e sem estratégias ganha versão 1.0 e modalidades aplicáveis",()=>{
  const input={months:24,initialCash:200000,property:{price:150000},rent:{monthly:1000},mortgage:{downPayment:30000,months:120,system:"sac",annualInterestRate:.1}};
  const x=migrateScenario(input);
  assert.equal(x.schemaVersion,"1.0");
  assert.deepEqual(x.strategies,["rent","cash","mortgage"]);
  assert.equal(input.schemaVersion,undefined);
});
test("versão futura, campo desconhecido e entradas perigosas não são aceitos",()=>{
  const future=copy(preset);future.schemaVersion="2.0";
  assert.throws(()=>migrateScenario(future),/não suportado/);
  const typo=copy(preset);typo.property.annualApreciation=.1;
  assert.throws(()=>migrateScenario(typo),/Campo desconhecido/);
  const extra=copy(preset);extra.mySecret={value:"bad"};
  assert.throws(()=>migrateScenario(extra),/Campo desconhecido/);
  assert.throws(()=>migrateScenario([]));
  const missing=copy(preset);missing.months=0;
  assert.throws(()=>migrateScenario(missing));
});
test("proveniência e data base preservadas por importação/exportação",()=>{
  const c=copy(preset);
  c.metadata={currency:"BRL",referenceDate:"2026-11-23",confidence:"low",source:"teste independente",
    assumptions:{"property.price":{source:"anúncio demonstrativo",referenceDate:"2026-11-23",confidence:"medium",note:"não é escritura"}}};
  assert.deepEqual(migrateScenario(c).metadata,c.metadata);
  assert.deepEqual(JSON.parse(serializeScenario(c)).metadata,c.metadata);
  c.metadata.currency="USD";assert.throws(()=>migrateScenario(c),/BRL/);
});
test("override de custo aplicado apenas a uma estratégia com mesma dotação de capital",()=>{
  const c={schemaVersion:"1.0",months:2,initialCash:10000,monthlyContribution:0,property:{price:1000,maintenanceMonthly:0},rent:{monthly:0},strategies:["rent","cash","mortgage"],mortgage:{downPayment:0,months:12,annualInterestRate:0}};
  const baseline=project(c,"cash");
  c.strategyOverrides={cash:{property:{maintenanceMonthly:100}}};
  const after=project(c,"cash");
  assert.ok(Math.abs(after.summary.netWorth-(baseline.summary.netWorth-200))<1e-7);
  assert.equal(project(c,"rent").summary.netWorth,10000);
  assert.ok(compare(c).alerts.some(x=>x.includes("específicos")));
  c.strategyOverrides.cash.initialCash=1234;
  assert.throws(()=>migrateScenario(c),/Seção de override|Override/);
});
test("comparabilidade não declarada gera alerta, metadados equivalentes o eliminam",()=>{
  const c={schemaVersion:"1.0",months:2,initialCash:10000,property:{price:1000,condoMonthly:100,iptuMonthly:50,insuranceMonthly:0,maintenanceMonthly:0},rent:{monthly:100,condoMonthly:100,iptuMonthly:50,insuranceMonthly:0,maintenanceMonthly:0},strategies:["rent","cash"]};
  assert.ok(assessComparability(c).some(x=>x.includes("não confirmada")));
  c.housingEquivalence={buy:{areaSqm:60,bedrooms:2,neighborhood:"Botafogo",housingType:"apartment"},rent:{areaSqm:59,bedrooms:2,neighborhood:"Botafogo",housingType:"apartment"}};
  assert.deepEqual(assessComparability(c),[]);
  c.housingEquivalence.rent.areaSqm=45;c.housingEquivalence.rent.neighborhood="Glória";
  assert.ok(assessComparability(c).some(x=>x.includes("10%")));
  assert.ok(assessComparability(c).some(x=>x.includes("Bairros diferentes")));
});
test("despesa unilateral ausente é exibida como incerteza, não como custo zero silencioso",()=>{
  const c={schemaVersion:"1.0",months:2,initialCash:10000,property:{price:1000},rent:{monthly:100},strategies:["rent","cash"]};
  assert.ok(compare(c).alerts.some(x=>x.includes("não declarada")));
});
test("ledger tem identidade e indexação da dívida não passa pelo caixa",()=>{
  const c={schemaVersion:"1.0",months:13,initialCash:15000,property:{price:12000},rent:{monthly:200},mortgage:{downPayment:0,months:24,annualInterestRate:0,annualIndexRate:.1},strategies:["mortgage"]};
  const x=project(c,"mortgage");
  const ids=new Set(x.ledger.map(e=>e.id));
  assert.equal(ids.size,x.ledger.length);
  const indexed=x.ledger.filter(e=>e.category==="debt-indexation");
  assert.equal(indexed.length,1);
  assert.equal(indexed[0].amount,0);
  assert.equal(indexed[0].cashChange,0);
  assert.ok(indexed[0].debtChange>0);
});

test("catálogo de campos importados coincide com propriedades do JSON Schema",()=>{
  assert.deepEqual([...ROOT].sort(),Object.keys(schema.properties).sort());
  for(const [section,fields] of Object.entries(FIELDS))
    assert.deepEqual(fields.slice().sort(),Object.keys(schema.properties[section].properties).sort(),"Divergência entre validador e schema em "+section);
});
