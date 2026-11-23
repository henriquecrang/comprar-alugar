# Manual — Comprar ou Alugar (beta)

## Começando
1. Acesse https://henriquecrang.github.io/comprar-alugar/ ou inicie um servidor local de desenvolvimento com `node tests/serve.mjs` e abra `http://localhost:8080/comprar-alugar/`. Abertura direta do arquivo HTML pode falhar com ES modules por política de navegador.
2. Escolha estratégias, informe **o mesmo horizonte, riqueza inicial e renda externa comum**.
3. Configure preço e avaliação de mercado do imóvel, aluguel equivalente, condomínio, IPTU, obras, juros, retornos alternativos, valorização e saída.
4. A tela recalcula após alterar cada campo e salva a configuração **localmente**. Use Importar/Exportar JSON para transportar cenários.
5. Compare **patrimônio líquido real**, caixa, dívida, custo equivalente e alertas. O gráfico mostra trajetória nominal ou real.
6. Selecione “Fluxos” para examinar mês a mês, ou exporte o ledger de eventos CSV.

## Interpretação
- Patrimônio líquido do proprietário = caixa + avaliação de mercado + caução (se houver) − dívida.
- O imóvel é **ilíquido** até a venda. Venda ao final é configurável.
- A entrada no financiamento diminui caixa, mas não desaparece como custo: reduz a parte financiada.
- A amortização diminui o passivo; juros e encargos são custos.
- Rendimento financeiro alternativo é aplicado aos saldos positivos; para caixa negativo o modelo usa o custo de déficit editado.
- Resultados reais são deflacionados pela inflação informada, não projeções garantidas.
- O custo econômico mensal equivale à diferença contra um patrimônio hipotético investido sem custo habitacional, **não** ao boleto mensal de cada estratégia.
- A sensibilidade atual compara **à vista x aluguel**; não avalia a robustez de todas as cinco estratégias.
- O “aluguel de equilíbrio” pesquisa a primeira raiz dentro de faixa limitada; pode não existir, ou mais de um cruzamento ser possível.

## Limites contratuais
- Simulação de IR manual ou progressivo é **ilustrativa**. Fatores de redução, outras isenções, base fiscal e comprovação de benfeitorias devem ser validados no programa/contrato aplicável.
- A multa de aluguel proporcional usa uma aproximação parametrizada e ignora exceções específicas; coteje o contrato.
- Financiamento pode ter seguros, taxas e correções indexadas não modeladas exatamente. CET contratual prevalece.
- Carta contemplada usa cronograma residual simplificado; verificar transferência, uso do crédito, índice, tarifas, condições e aprovação pela administradora.
- Condomínio extraordinário e reformas podem não aparecer se não tiverem sido lançados como eventos. Diferencie apartamento/casa pela despesa efetivamente assumida.
- O código não tem ingestão automática de dados de mercado; o preset **não** representa uma cotação.

## Validação
```bash
npm test
node cli.mjs presets/rio-exemplo.json > resultado.json
```
A suite automatizada valida regras financeiras e o comando, mas não substitui QA em navegador real, inspeção de layouts ou conferência jurídica.
