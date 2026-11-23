# Auditoria econômica independente — decisões e resultados (23/11/2026)

## Bugs corrigidos neste ciclo

1. **Price indexado:** antes, a parcela ficava baseada no saldo original; a correção do principal podia deixar dívida após o último mês contratual. Agora cada mês calcula juros sobre o saldo atualizado e prestação Price ou SAC sobre **saldo e prazo restantes**; resíduo numérico inferior a 10^-7 é zerado.
2. **Indexação como estoque, não fluxo:** a atualização de dívida é marcada em \`debt-indexation\` com \`amount=0\`, \`cashChange=0\` e \`debtChange\` explícito. Isso permite demonstrar que não é uma prestação adicional.
3. **Corretagem de venda:** comissão calculada sobre o **preço efetivamente negociado após desconto**, e não sobre o valor inicial do imóvel. Desconto, comissão, custo fixo e imposto são distintos.
4. **Custo fiscal:** \`sale.taxBasisOverride\` (opcional) permite substituir o custo automático por base documentada e \`sale.additionalTaxBasis\` (opcional) acresce despesas elegíveis informadas; não presume dedutibilidade fiscal sem comprovação.
5. **Entradas inválidas:** prazos, taxas, encargos negativos, amortizações extraordinárias fora do calendário e estratégias duplicadas são recusados antes do cálculo.
6. **Rastreabilidade:** cada evento ganha \`id\` estável por simulação, \`source\` e \`cashChange\`. Não muda a fórmula do patrimônio.

## Oráculos com soluções calculadas fora da função de produção

- SAC: dívida R$ 1.200, taxa efetiva 1% ao mês, 12 meses ⇒ amortização R$ 100, juros R$ 12 no primeiro mês e R$ 11 no segundo.
- Price: financiamento de R$ 1.200, 12 meses, 12% a.a. efetivos ⇒ \`i=(1.12)^(1/12)-1\` e \`p=1200*i/(1-(1+i)^(-12))\`; o último saldo deve ser zero.
- Correção devedor anual: saldo de R$ 1.200 após mês 12 ⇒ 10% = R$ 120 no mês 13; 12 prestações restantes de R$ 110 quando juros zero, quitando no 24º mês.
- Correção mensal: crédito inicial R$ 300; 1% mensal, três meses, juros zero ⇒ saldos após as prestações R$ 202, R$ 102,01, R$ 0.
- Venda: imóvel de R$ 1.000, desconto 10% e corretagem de 10% sobre R$ 900 ⇒ receita R$ 810.
- Base fiscal: venda R$ 1.000, base R$ 900 e imposto efetivo 15% ⇒ IR R$ 15.
- Caução: R$ 100 rendendo 1% ao mês por dois meses ⇒ devolução R$ 102,01.
- Aluguel antecipado por três meses: pagamentos nos meses 0, 1, 2 e **não** no 3.
- Reserva vinculada: aportar R$ 500 não muda o patrimônio; manutenção de R$ 100 por mês reduz patrimônio em R$ 200 em dois meses, ainda mantendo R$ 300 em reserva.
- Imóvel: inflação 10% a.a. × valorização real 1% a.a. ⇒ valorização nominal 11,1% em 12 meses, valor real de R$ 10.100 para imóvel de R$ 10.000.
- Liquidez: o saldo pode ficar negativo mesmo quando o patrimônio imobiliário é positivo; a falta frente à reserva mínima é reportada separadamente.

## Propriedades automatizadas
- 300 configurações sintéticas determinísticas com cinco estratégias, diversos preços, aportes, inflação, juros, índices, correções, financiamento e eventual venda.
- \`netWorth = cash + property + deposit + reserve − debt\` **em todos os meses**.
- Valores reais finitos, dívida não negativa, imóvel/dívida zerados após venda ao final.
- Paridade entre API pública, motor e CLI JavaScript e round-trip JSON, sem mutar o objeto de entrada.
- Smoke tests Chrome em caminho relativo de GitHub Pages, com importação/exportação.

## Decisões de modelagem tomadas autonomamente
- **Indexadores:** mantida a frequência \`annual\` como padrão legado, no aniversário contratual (meses 13, 25…). Acrescentada frequência \`monthly\` com conversão efetiva anual→mensal, ou vetor explícito \`monthlyIndexRates\`. Não inferir TR/IPCA automaticamente.
- **Recalcular Price:** recálculo mensal com mesma taxa de juros e prazo remanescente. É uma **aproximação transparente** para contratos com correção; o contrato real prevalece.
- **Ausência de equivalência habitacional:** alerta e ranking numérico mantido, pois bloquear todas as simulações antigas impediria exploração financeira.
- **Diferença de área de 10%:** limiar de alerta de produto, não norma legal nem evidência de fungibilidade entre imóveis; quartos, bairro e tipo também são comparados.
- **Overrides:** permitem despesas e taxas por estratégia sem permitir sobrescrever horizonte, caixa inicial ou renda externa comum. Preço e necessidade habitacional continuam sujeitos à comparação compartilhada.
- **JSON legado:** apenas configurações antigas **sem versão** são convertidas para \`1.0\`; versões desconhecidas são recusadas para não atribuir semântica inventada.
- **Valores fiscais:** tributo zero em modo manual não prova isenção; base fiscal documentada é opcional e a app continua exigindo conferência com GCAP.
- **Rendimento de caixa negativo:** custo de funding separado do rendimento alternativo, parametrizado e visível como aviso de liquidez; não finge que crédito bancário foi aprovado.

## Fora da cobertura desta rodada
CET exato, MIP/DFI por idade e saldo, amortização TR/IPCA conforme contratos, correção de consórcio e fundo de reserva exatos, direitos de FGTS, regra completa de isenção/GCAP e custos cartorários municipais ainda dependem de propostas ou normas individuais. **Não fechar as issues #11, #13 e #19** por existir um campo aproximado.
