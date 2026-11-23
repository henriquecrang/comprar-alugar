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

## Vínculo e qualidade da comparação (v0.2)

A seção **Equivalência entre imóveis** permite registrar área em m², quartos e bairro das alternativas. Diferenças maiores que 10% na área, divergência de quartos e bairros geram alertas na tela. Esses campos **não** são monetizados: um imóvel maior não vira automaticamente um retorno financeiro superior. O aluguel e a compra compartilham capital inicial, horizonte e aportes.

## JSON e rastreabilidade

- O cenário padrão vem do arquivo estático `presets/rio-exemplo.json`, carregado pelo GitHub Pages; não há backend.
- `schemaVersion` deve ser `1.0`. JSON legado sem versão é migrado para `1.0`. Versões não reconhecidas são recusadas.
- Campos desconhecidos são rejeitados na importação, em vez de ignorados.
- Um JSON salvo incompatível é mantido no armazenamento original, e a tela oferece opção de baixar backup antes de substituí-lo.
- `metadata.assumptions` permite indicar fonte, data-base e confiança para cada premissa.
- `strategyOverrides` permite alterar campos restritos próprios de cada modalidade, via importação JSON, sem alterar capital inicial e horizonte. Consulte [catálogo](catalogo-parametros.md).
- As prestações SAC/Price indexadas recalculam com saldo devedor e prazo restantes. O índice é aplicado no mês 13 (padrão legado anual) ou mensalmente, se indicado; dados contratuais reais prevalecem.

**Cuidado:** custo equivalente e comparabilidade de moradia são conceitos distintos. Veja [auditoria financeira](auditoria-economica.md) e [matriz de fontes](matriz-fontes-2026.md).
