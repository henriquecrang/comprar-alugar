// Avalia equivalência da necessidade habitacional sem interferir no motor monetário.
const moneyFields=["condoMonthly","iptuMonthly","insuranceMonthly","maintenanceMonthly"];
function assessComparability(config){
  const alerts=[];
  const info=config.housingEquivalence;
  if(!info?.buy||!info?.rent){
    alerts.push("Comparabilidade não confirmada: preencha área, quartos e bairro das alternativas de compra e aluguel.");
  }else{
    const buy=info.buy,rent=info.rent;
    for(const field of ["areaSqm","bedrooms","neighborhood"]){
      if(buy[field]===undefined||rent[field]===undefined||buy[field]===""||rent[field]===""){
        alerts.push("Informação incompleta de equivalência habitacional: "+field+".");
      }
    }
    if(buy.areaSqm>0&&rent.areaSqm>0){
      const deviation=Math.abs(buy.areaSqm-rent.areaSqm)/Math.max(buy.areaSqm,rent.areaSqm);
      if(deviation>.10)alerts.push("Áreas dos imóveis diferem mais de 10%; o ranking mede riqueza, não utilidade da moradia.");
    }
    if(Number.isFinite(buy.bedrooms)&&Number.isFinite(rent.bedrooms)&&buy.bedrooms!==rent.bedrooms){
      alerts.push("Quantidade de quartos diferente entre comprar e alugar.");
    }
    if(buy.neighborhood?.trim()&&rent.neighborhood?.trim()&&buy.neighborhood.trim().toLocaleLowerCase("pt-BR")!==rent.neighborhood.trim().toLocaleLowerCase("pt-BR")){
      alerts.push("Bairros diferentes: risco de comparação entre localizações, padrões e serviços distintos.");
    }
    if(buy.housingType&&rent.housingType&&buy.housingType!==rent.housingType){
      alerts.push("Tipos de imóvel diferentes (apartamento/casa): verificar diferenças de manutenção e condomínio.");
    }
  }
  const kinds=config.strategies||["rent","cash","mortgage"];
  if(kinds.includes("rent")&&kinds.some(x=>x!=="rent")){
    const p=config.property||{},r=config.rent||{};
    for(const field of moneyFields){
      if(p[field]===undefined||r[field]===undefined){
        alerts.push("Despesa "+field+" não declarada de forma simétrica em compra e aluguel: ausência foi tratada como zero.");
      }
    }
  }
  const over=config.strategyOverrides||{};
  if(Object.keys(over).length)alerts.push("Foram aplicados custos específicos por estratégia; confira a equivalência das demais premissas.");
  return [...new Set(alerts)];
}
export {assessComparability};
