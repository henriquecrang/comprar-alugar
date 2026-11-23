// Fronteira de importação/exportação. Não requer Node, backend ou biblioteca.
import {validate} from "./model-api.mjs";
const VERSION="1.0";
const ROOT=new Set(["schemaVersion","months","initialCash","monthlyContribution","minimumReserve","inflationAnnual","investmentAnnualNet","negativeCashAnnualRate","property","rent","mortgage","seller","consortium","sale","strategies","monthlyRates","strategyOverrides","housingEquivalence","metadata"]);
const FIELDS={
property:["price","marketValue","acquisitionRate","acquisitionFixed","initialRenovation","initialRenovationValueRate","initialFurnishing","condoMonthly","iptuMonthly","insuranceMonthly","maintenanceMonthly","annualExtraCosts","appreciationRealAnnual","neighborhoodRealAnnual","propertyRealAnnual","renovations","initialMaintenanceReserve","maintenanceReserveMonthly","reserveAnnualReturn"],
rent:["monthly","annualIncrease","condoMonthly","iptuMonthly","insuranceMonthly","maintenanceMonthly","deposit","upfrontCosts","prepaid","depositReturnRate","depositAnnualReturn","earlyExitPenalty","exitCosts","penaltyMode","contractMonths","contractPenaltyMonths"],
mortgage:["downPayment","months","system","annualInterestRate","annualIndexRate","indexationFrequency","monthlyIndexRates","insuranceMonthly","fees","extraPayments"],
seller:["downPayment","months","annualInterestRate","annualCorrectionRate","annualIndexRate","indexationFrequency","monthlyIndexRates","insuranceMonthly","fees","extraPayments"],
consortium:["credit","shareAcquisitionPrice","remainingDebt","months","annualIndexRate","monthlyOtherCharges","transferFee"],
sale:["sellAtEnd","discountRate","commissionRate","fixedCosts","capitalGainsTaxRate","taxPolicy","onlyProperty","noSalePast5Years","taxBasisOverride","additionalTaxBasis"]
};
const OVERRIDE_FIELDS={
property:["marketValue","condoMonthly","iptuMonthly","insuranceMonthly","maintenanceMonthly","annualExtraCosts","appreciationRealAnnual","neighborhoodRealAnnual","propertyRealAnnual","initialMaintenanceReserve","maintenanceReserveMonthly","reserveAnnualReturn"],
rent:["monthly","annualIncrease","condoMonthly","iptuMonthly","insuranceMonthly","maintenanceMonthly","deposit","upfrontCosts","earlyExitPenalty","exitCosts","depositAnnualReturn"],
mortgage:["insuranceMonthly","fees","annualInterestRate","annualIndexRate"],
seller:["annualInterestRate","annualCorrectionRate","fees"],
consortium:["monthlyOtherCharges","annualIndexRate","transferFee"],
sale:["discountRate","commissionRate","fixedCosts","capitalGainsTaxRate"]
};
const isObject=(v)=>v!==null&&typeof v==="object"&&!Array.isArray(v);
function allowed(obj,keys,path){
  if(!isObject(obj))throw new Error("Objeto esperado: "+path);
  for(const key of Object.keys(obj))if(!keys.has(key))throw new Error("Campo desconhecido em "+path+": "+key);
}
function assertShape(c){
  allowed(c,ROOT,"cenário");
  for(const key of Object.keys(FIELDS))if(c[key]!==undefined)allowed(c[key],new Set(FIELDS[key]),key);
  if(c.monthlyRates!==undefined)allowed(c.monthlyRates,new Set(["inflation","investment","negativeCash","propertyExtra"]),"monthlyRates");
  if(c.housingEquivalence!==undefined){
    allowed(c.housingEquivalence,new Set(["buy","rent","acknowledgedDifference"]),"housingEquivalence");
    for(const key of ["buy","rent"])if(c.housingEquivalence[key]!==undefined)
      allowed(c.housingEquivalence[key],new Set(["areaSqm","bedrooms","neighborhood","housingType"]),"housingEquivalence."+key);
  }
  if(c.metadata!==undefined){
    allowed(c.metadata,new Set(["currency","referenceDate","source","confidence","notes","assumptions"]),"metadata");
    if(c.metadata.currency!==undefined&&c.metadata.currency!=="BRL")throw new Error("Somente BRL suportado no cenário");
    if(c.metadata.referenceDate!==undefined&&!/^\d{4}-\d\d-\d\d$/.test(c.metadata.referenceDate))throw new Error("Data-base ISO inválida");
    if(c.metadata.assumptions!==undefined){
      if(!isObject(c.metadata.assumptions))throw new Error("Metadados de fontes inválidos");
      for(const [path,value] of Object.entries(c.metadata.assumptions)){
        allowed(value,new Set(["source","referenceDate","confidence","note"]),"metadata.assumptions."+path);
        if(value.confidence!==undefined&&!["unknown","low","medium","high"].includes(value.confidence))throw new Error("Confiança inválida");
      }
    }
  }
  if(c.property?.renovations!==undefined){
    if(!Array.isArray(c.property.renovations))throw new Error("Lista de reformas inválida");
    for(const e of c.property.renovations)allowed(e,new Set(["month","cost","marketRecoveryRate","taxBasisEligible"]),"reforma");
  }
  for(const key of ["mortgage","seller"]){
    if(c[key]?.extraPayments!==undefined){
      if(!Array.isArray(c[key].extraPayments))throw new Error("Amortizações inválidas");
      for(const e of c[key].extraPayments)allowed(e,new Set(["month","amount"]),"amortização extraordinária");
    }
  }
  if(c.strategyOverrides!==undefined){
    allowed(c.strategyOverrides,new Set(["rent","cash","mortgage","seller","consortium"]),"strategyOverrides");
    for(const [kind,sections] of Object.entries(c.strategyOverrides)){
      if(!isObject(sections))throw new Error("Override inválido: "+kind);
      for(const [section,entry] of Object.entries(sections)){
        if(!OVERRIDE_FIELDS[section])throw new Error("Seção de override desconhecida");
        allowed(entry,new Set(OVERRIDE_FIELDS[section]),"strategyOverrides."+kind+"."+section);
      }
    }
  }
}
function migrateScenario(raw){
  if(!isObject(raw))throw new Error("JSON de cenário deve ser um objeto");
  const scenario=JSON.parse(JSON.stringify(raw));
  if(scenario.schemaVersion===undefined){
    // Migração real dos presets anteriores à definição do contrato, sem versão explícita.
    scenario.schemaVersion=VERSION;
  }else if(scenario.schemaVersion!==VERSION){
    throw new Error("Schema "+String(scenario.schemaVersion)+" não suportado; os dados originais foram preservados");
  }
  if(scenario.strategies===undefined){
    scenario.strategies=["rent","cash",...["mortgage","seller","consortium"].filter(k=>scenario[k]!==undefined)];
  }
  assertShape(scenario);
  validate(scenario);
  return scenario;
}
function serializeScenario(config){
  return JSON.stringify(migrateScenario(config),null,2)+"\n";
}
export {migrateScenario,serializeScenario};
