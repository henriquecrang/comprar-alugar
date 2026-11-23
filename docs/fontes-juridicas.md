# Pesquisa regulatória e limites operacionais — 23/11/2026

> Fontes oficiais consultadas em 23/11/2026; antes de operações reais verificar versão vigente, localidade, contrato e situações pessoais. Não é parecer tributário ou jurídico.

## Imposto de renda sobre ganho de capital
- Receita Federal: [alíquotas progressivas](https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/pagamento/ganhos-de-capital/aliquotas): 15% até R$ 5 milhões de ganho; 17,5% sobre a parcela seguinte de R$ 5 milhões; 20% sobre a parcela seguinte de R$ 20 milhões; 22,5% no excedente. Implementadas em função matemática isolada.
- Receita: [operações não sujeitas](https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/pagamento/ganhos-de-capital/operacoes-nao-sujeitas): possibilidade de isenção ao vender **único imóvel por até R$ 440 mil**, observadas condições, inclusive não ter feito outra venda imobiliária nos cinco anos anteriores. O simulador só aplica **se o usuário declarar explicitamente ambas as condições**, além do limite do preço líquido aproximado.
- Aquisição de outro imóvel residencial no Brasil dentro de 180 dias pode ensejar isenção total/parcial; **não simulada automaticamente**, pois é necessário um segundo evento imobiliário e requisitos próprios.
- Outras isenções e reduções por data de aquisição (fatores FR1/FR2), aquisição anterior a 1969, custos de benfeitoria elegíveis e tratamento da titularidade/copropriedade não estão completos. **Mesmo selecionando o modo progressivo, o resultado pode divergir do GCAP oficial.** Validar no sistema da Receita antes de uma operação real.
- No modo manual, a alíquota informada é uma aproximação efetiva e **zero não implica isenção**.

## Aluguel
- [Lei 8.245/1991, art. 4º](https://www.planalto.gov.br/ccivil_03/leis/l8245.htm): saída antecipada pode exigir multa contratual proporcional ao período cumprido, respeitadas exceções legais. Modo proporcional simplificado: aluguel atual de referência × multa em meses × período faltante / prazo contratual; contrato prevalece. Modo manual substitui o proporcional, sem soma dupla.
- Caução em dinheiro: limite de três meses de aluguel e rendimentos da caderneta de poupança em regra legal pertinente; o simulador parametriza rendimento e restituição, **não calcula rendimentos oficiais da poupança automaticamente**.
- Condomínio ordinário e extraordinário têm regimes diferentes de responsabilidade; conferir documento do edifício e contrato, não aplicar mesma obrigação às alternativas.

## Financiamento e consórcio
- [BCB — CET](https://www.bcb.gov.br/meubc/faqs/p/cuidados-na-hora-de-contratar-uma-operacao-de-credito/): CET inclui juros, tarifas, impostos e encargos. O app usa encargos explícitos por mês e não soma um “CET” extra; ainda falta auditoria do CET e dos indexadores.
- [Resolução BCB 285/2023](https://www.bcb.gov.br/estabilidadefinanceira/exibenormativo?numero=285&tipo=resolu%C3%A7%C3%A3o+bcb): enquadramento e uso de crédito de consórcio dependem de regras próprias e contrato. O motor inicial **não garante** que uma cota específica tenha crédito imediatamente liberável ou possam ser transferidas as garantias na revenda.
- IPCA/TR/INCC, taxas bancárias, CET e fundo de reserva do consórcio devem ser calibrados com instrumentos contratuais.

## Dados imobiliários e regionalidade
- FipeZAP: anúncios de venda e locação, não preços de escritura.
- IBGE IPCA/SINAPI, FGV INCC/IVAR, BCB IVG-R/Focus: dados com periodicidades, alcance e metodologia distintos.
- ITBI e emolumentos são locais; por padrão valores estimados **editáveis**, não taxa nacional fixa.
