# Comprar ou Alugar — levantamento, especificação inicial e roadmap

> **Status:** baseline de pesquisa e planejamento; não é implementação financeira nem promessa de precisão legal/tributária.  
> **Data-base:** 23/11/2026.  
> **Repositório:** https://github.com/henriquecrang/comprar-alugar  
> **Escopo desta entrega:** documentar variáveis, método de comparação, premissas, decisões pendentes e backlog. O código será desenvolvido em issues posteriores.

## 1. Missão e problema

Construir um simulador brasileiro, parametrizável, auditável e reutilizável para comparar **alugar um imóvel residencial** versus **comprá-lo à vista, por financiamento bancário, por parcelamento direto ou com carta contemplada de consórcio**, incluindo o destino alternativo de todo o capital, o valor patrimonial acumulado, os encargos mensais, os riscos e a liquidez.

A comparação não é “aluguel x prestação”: entrada, parcelas, amortização, juros, condomínio, impostos, obras, inflação, valorização e revenda possuem efeitos diferentes sobre **caixa, patrimônio e custo de oportunidade**.

**Perguntas-alvo:** (a) com qual decisão terminarei com maior patrimônio líquido real? (b) qual o custo econômico mensal equivalente de morar? (c) quanto caixa preciso em cada mês? (d) após quantos anos comprar passa a valer a pena? (e) qual a valorização real, aluguel ou rendimento alternativo que faz a escolha mudar? (f) o resultado é robusto a manutenção extraordinária, mudança de cidade e venda antecipada?

**Referências dos projetos existentes:**
- [viabilidade-airbnb](https://github.com/henriquecrang/viabilidade-airbnb): caixa livre versus patrimônio, capital vinculado, custos de implantação, regimes de propriedade/gestão, configuração guiada e JSON.
- [cenarios-consorcio](https://github.com/henriquecrang/cenarios-consorcio): motor de cenários isolado, eventos contratuais, regras específicas de consórcio, testes, rastreabilidade.
- [custo-veiculo](https://github.com/henriquecrang/custo-veiculo): ledger mensal, custo de oportunidade de todos os pagamentos, venda antecipada, liquidez, breakeven, presets, fluxo de issues.

## 2. Escopo, estratégias e comparabilidade

### 2.1 Estratégias a suportar
| ID sugerido | Estratégia | Situação terminal |
| --- | --- | --- |
| `rent` | Alugar imóvel equivalente e investir recursos não imobilizados | Investimentos + restituição líquida de garantias – obrigações |
| `buy-cash` | Comprar à vista | Imóvel líquido de dívidas, ou receita líquida da venda |
| `buy-mortgage` | Comprar com financiamento bancário | Imóvel menos dívida, ou liquidação na saída |
| `buy-seller-finance` | Comprar parcelado diretamente com vendedor/incorporadora | Imóvel menos obrigações contratuais |
| `buy-consortium` | Comprar por carta já contemplada | Imóvel menos obrigações remanescentes da cota |

Todos podem ter **venda no horizonte** ou **manutenção do imóvel em carteira**; são resultados distintos. O cenário alugado pode terminar, renovar ou exigir nova locação. Uso temporário, aluguel do imóvel próprio e estratégias híbridas entram em módulo avançado.

### 2.2 Regras de equivalência
- Mesma duração e necessidade de moradia, data de início, moeda e poder de compra.
- Mesma dotação inicial de capital financeiro, mesma renda/aporte exógeno e mesma política para déficits, sobras e reservas mínimas.
- Registrar diferenças de metragem, localização, qualidade, serviços e custos incluídos; **alertar quando imóveis não forem equivalentes**.
- Não exigir que os valores de aluguel e compra sejam do mesmo imóvel; permitir comparação de imóveis equivalentes com atributos distintos.
- Distinguir preço **pedido**, preço **transacionado**, avaliação de mercado e custo fiscal da propriedade.
- Despesas de consumo iguais em todas as estratégias (ex.: água e energia sem diferença contratual) podem ser excluídas justificadamente; despesas diferentes devem ser incluídas.

### 2.3 Escopo de versões
**MVP:** fluxo mensal determinístico, compra à vista e financiada, aluguel, custos de aquisição/posse/manutenção/venda, valorização, aplicação alternativa, patrimônio final real, ledger e JSON.  
**V1 completa:** compra parcelada, carta contemplada, indexadores e taxas contratuais, impostos de saída, break-even, sensibilidade, documentação e presets.  
**Avançado:** probabilidades, Monte Carlo, locação posterior do imóvel próprio, localização e clima, dados de mercado automáticos e otimização de dívida.

## 3. Convenções econômico-contábeis obrigatórias

1. **Passo mensal** `m=0..N`; cada evento tem mês, cenário, categoria, descrição, valor assinado, fonte e regra responsável. Entradas (+), saídas (-). Não prorratear pagamentos reais apenas para suavizar gráficos.
2. **Aporte inicial não é consumo.** Na compra, o preço vira ativo imobiliário; na locação, capital poupado permanece aplicado; no financiamento, o crédito cria simultaneamente aquisição e dívida.
3. **Amortização reduz passivo**, não é perda patrimonial independente. Juros, seguros, tarifas e atualização monetária têm tratamento próprio; a parcela total é saída de caixa.
4. **Venda:** preço líquido negociado – despesas – tributos aplicáveis – quitação da dívida; se a venda não ocorre, o imóvel é marcado a mercado e exibido como **patrimônio ilíquido**, sem supor caixa recebido.
5. **Custo de oportunidade:** incide pelo calendário real de *todos* os desembolsos; se há carteira financeira simulada mês a mês, o retorno alternativo já está refletido no patrimônio final. **Não subtrair custo de oportunidade duas vezes**.
6. **Inflação não é despesa.** Exibir fluxos nominais e resultado deflacionado; inflação e valorização real compõem-se multiplicativamente. Ex.: (1+0,04)(1+0,01)-1 = 5,04% nominal.
7. **Reserva para manutenção não é custo**, até ser gasta. Separar aporte a reserva, saldo vinculado, gasto efetivo e deterioração patrimonial.
8. **Reforma:** saída de caixa integral; melhoria de valor de revenda **parcial, variável e separada**; nunca tratar automaticamente todo custo como valorização.
9. **Custos de aquisição e alienação não recuperáveis** devem entrar uma única vez no mês devido.
10. **Base fiscal e valor econômico** são diferentes; deduções, imposto de ganho de capital, isenções e atualização do custo fiscal dependem da regra aplicável e documentos.
11. **Contratos reais prevalecem** sobre defaults de mercado. Não presumir condições de consórcio, crédito ou responsabilidade por condomínio.
12. Comparações precisam exibir **déficits**, necessidade de aporte externo e quebras de reserva. Não financiar déficit automaticamente a juro zero.

### 3.1 Motor patrimonial (definições conceituais)
Para cada cenário e mês, rastrear:
- `F_m`: saldo financeiro líquido (com buckets de livre, vinculado, caução e reserva);
- `V_m`: valor econômico do imóvel, incluindo efeito explícito de obras e desgaste;
- `D_m`: saldo devedor e obrigações liquidáveis;
- `O_m`: outros ativos/obrigações remanescentes (móveis, garantias etc., quando materiais).
- `PL_m = F_m + V_m + O_m - D_m`. No aluguel, `V_m=0` para um imóvel que não é do usuário.
- Resultado em reais do mês zero: `PL_real_N = PL_nominal_N / produto_m(1+inflacao_m)`.
- No modo “liquidar no horizonte”, converter imóvel e dívidas em eventos reais de venda/baixa, incluindo custos e tributos; não **somar novamente** o valor marcado do imóvel após vendê-lo.
- Para comparar economicamente, usar a **mesma renda/aporte exógeno** e despesas de moradia equivalentes. Fluxos de financiamento, rendimento e resgates devem reconciliar com os saldos.
- Custo mensal equivalente pode ser obtido do valor presente/terminal das diferenças de fluxo e valor residual usando a mesma taxa de oportunidade, mas não deve substituir nem conflitar com o ranking por `PL_real_N`.

**Casos-limite obrigatórios:** taxa de oportunidade zero; juros zero; compra e venda no mês 0; venda antes de terminar financiamento; imóvel sem valorização real; aluguel antecipado; caução devolvida; saldo da venda menor que dívida; reforma paga no último mês; reserva insuficiente; horizonte maior que prazo de parcelas; dívidas indexadas com cenário de inflação; manutenção do imóvel sem venda.

## 4. Dicionário de variáveis — catálogo inicial

**Regras gerais de cada entrada:** armazenar identificador, unidade, moeda (BRL por padrão), precisão, valor, periodicidade, condição de incidência, data-base, origem/evidência, confiança e possibilidade de substituição pelo usuário. Valores numéricos são hipóteses configuráveis, não cotações universais. Entradas podem ser únicas, periódicas, por evento ou séries mensais/anuais.

### A — Simulação e recursos financeiros
| Variáveis | Notas |
| --- | --- |
| data de início; horizonte em meses; data de aquisição/posse e saída | datas não necessariamente coincidentes |
| patrimônio financeiro inicial; renda externa; aportes previstos | mesmos recursos para todos os cenários |
| reserva mínima; limite de déficit; financiamento de déficit | restrição de liquidez |
| moeda; inflação IPCA geral/curva futura; indexadores contratuais | anual, mensal ou série |
| aplicação alternativa: CDI/Selic ou taxa líquida; impostos, taxas, liquidez | evitar IR líquido simplificado errado |
| estratégia de reinvestimento, resgate e ordem das contas | cada aporte no mês próprio |
| horizonte de revenda, manter ativo, venda com atraso | calendário terminal |
| modalidade de imóvel equivalente / diferenças aceitáveis | qualidade da comparação |

### B — Características do imóvel e preço
| Variáveis | Notas |
| --- | --- |
| cidade, bairro, microlocalização; tipo (casa, apartamento, condomínio fechado) | localização pode afetar tributos e despesas |
| área privativa/construída/terreno; idade; padrão; estado | componentes de manutenção |
| preço pedido; preço de compra negociado; avaliação de mercado | impedir tratar anúncio como venda realizada |
| avaliação fiscal e base de ITBI; situação registral | regras locais |
| imóvel pronto, usado, na planta, em obra; data de entrega | cenários de sobreposição com aluguel |
| mobiliado, acessórios, benfeitorias existentes | bens com vida útil própria |
| garagem, elevador, portaria, piscina, jardim, telhado, fachada | custos/serviços de conservação |
| equivalência do imóvel alugado versus comprado | área, localização, comodidades, condição |

### C — Aquisição e implantação
| Variáveis | Notas |
| --- | --- |
| ITBI (alíquota/base/isenção), escritura, registro, certidões | regras municipais/estaduais |
| corretagem se paga pelo comprador; advogado; avaliação | evitar cobranças duplicadas |
| taxas bancárias e de garantia; regularização | por contratação |
| inspeção e laudo técnico; deslocamento/mudança | timing específico |
| reforma inicial e CAPEX discriminado por item | custo e valor residual separados |
| mobília/eletros; vida útil; revenda ou perda de valor | não somar duas vezes ao imóvel |
| desconto efetivo do preço de compra versus valor de mercado | prêmio/desconto documentado |

### D — Compra à vista, financiamento e parcelamento
| Variáveis | Notas |
| --- | --- |
| entrada/sinal e calendário; preço à vista e parcelado | negociar preços diferentes |
| principal, prazo, SAC/Price, juros nominais/efetivos, CET | CET deve servir para conferência |
| taxas, IOF quando aplicável, MIP, DFI, avaliação, tarifas | conforme contrato |
| indexador (taxa fixa, TR, IPCA, CDI ou outros); periodicidade e base | atualizar saldo conforme instrumento |
| FGTS, subsídios, carência, vencimento e amortização extraordinária | políticas editáveis |
| amortizar prazo versus prestação; quitação, portabilidade | recalcular cronograma |
| parcelamento direto: intermediárias, balões, INCC, atraso | além do crédito bancário |
| venda antecipada e custo de baixa da garantia | não cobrar prestações pós-quitação |

### E — Carta contemplada de consórcio
| Variáveis | Notas |
| --- | --- |
| crédito nominal/utilizável; preço de aquisição da cota | ágio, deságio, capital próprio |
| saldo devedor, parcelas, prazo; reajuste por índice/grupo | contrato e regulamento específicos |
| taxa de administração, fundo de reserva, seguro | custo e reembolso potencial |
| lance embutido prévio e abatimento de crédito, se houver | não presumir novo lance em carta contemplada |
| transferência/cessão, aprovação cadastral, tarifas e garantias | operação depende de aprovação |
| complemento de preço, custos de cartório e registro | recursos próprios |
| liquidação/cessão da obrigação remanescente na saída | regras documentadas |
| reaproveitamento do motor `cenarios-consorcio` | avaliar importação/portabilidade, sem acoplamento prematuro |

### F — Aluguel
| Variáveis | Notas |
| --- | --- |
| aluguel inicial, vencimento antecipado/vencido, carência | cronograma real |
| índice contratual e periodicidade; renegociação | não confundir com aluguel novo de mercado |
| evolução de aluguel de mercado, vacância e recolocação | mudança ou renovação |
| condomínio ordinário, IPTU e demais encargos do locatário | exatamente como prevê contrato |
| caução com rendimento e devolução; fiança; seguro-fiança | capital vinculado versus custo |
| seguro incêndio, administração direta, utilidades incluídas | incluir apenas responsabilidades reais |
| reparos por desgaste, pequenas obras, benfeitorias permitidas | valor recuperável na saída |
| multa proporcional de saída, desgaste, vistoria, mudança | eventos certos ou condicionais |
| risco de necessidade de nova locação e preço de reentrada | probabilidade em avançado |

### G — Propriedade e despesas recorrentes
| Variáveis | Notas |
| --- | --- |
| IPTU, taxas municipais, alíquotas e calendário | não alocar em dobro com aluguel |
| condomínio ordinário, previsão de reajustes | custos coletivos |
| rateios extraordinários e chamadas de capital | não presumir cobertura por condomínio |
| seguro residencial, incêndio e outras coberturas | modalidades/risco |
| água, energia, gás, internet, segurança, jardim/piscina | apenas diferença relevante entre estratégias |
| inadimplência condominial e fundo de reserva coletivo | riscos |
| custos de administração e horas próprias | não misturar com desembolso por padrão |
| casa versus apartamento; responsabilidades privativas/comuns | natureza e convenção |

### H — Manutenção, reformas, risco de obra
| Variáveis | Notas |
| --- | --- |
| manutenção preventiva recorrente; corretiva eventual | lançar no mês efetivo |
| idade/vida útil/valor de reposição de telhado, pintura, elétrica, hidráulica, elevadores etc. | componentes distintos |
| manutenção interna versus estrutura compartilhada | casa/apartamento |
| obras extraordinárias: valor, mês, probabilidade, cobertura | eventos raros |
| reforma inicial e futura: orçamento, contingência, atraso | desembolso versus valorização |
| percentual/curva de valorização residual de benfeitorias | não igualar custo e valor |
| reservas próprias e vinculadas para manutenção | não tratar aporte como OPEX |
| desempenho real de custos de obras (INCC/SINAPI) | diferente do IPCA |

### I — Preço, inflação e mercado imobiliário
| Variáveis | Notas |
| --- | --- |
| inflação geral prevista/histórica; variação real mercado amplo | compor multiplicativamente |
| prêmio/desconto do bairro sobre a região | não somar índices que já incluem bairro |
| desempenho idiossincrático do imóvel e desgaste | envelhecimento, vista, padrão |
| valorização de terreno versus construção (avançado) | evitar simplificações estruturais |
| valorização gerada por reformas, restrições urbanas | estimativa com faixa |
| velocidade/desconto de venda, liquidez e sazonalidade | valor ofertado não é recebido |
| aluguel de mercado versus aluguel contratual | índices distintos |
| distribuição de incertezas e correlação | não declarar cenário como probabilidade sem calibração |

### J — Alienação, impostos e liquidação
| Variáveis | Notas |
| --- | --- |
| preço efetivo e comissão da venda; prazo de anúncio | receita e custos por evento |
| registro, advogado, certidões e despesas finais | incidência comprovada |
| custo fiscal de aquisição e benfeitorias elegíveis documentadas | distinto do valor de mercado |
| ganho de capital tributável, alíquotas, isenções, regras de reinvestimento | verificar regime aplicável |
| imposto do ganho nominal, sem deflacionar automaticamente a base fiscal | evitar erro de IR |
| saldo bancário a quitar, custos de liberação, carta/cessão | dívida terminal |
| custos de manutenção até a entrega e capital preso durante venda | prazo real |
| valor líquido da venda versus patrimônio ilíquido se mantido | dois modos de saída |

### K — Riscos e flexibilidade (avançado)
| Variáveis | Notas |
| --- | --- |
| mudança de cidade, permanência parcial, imóvel vazio | utilidade e custo alternativo de hospedagem |
| aluguel do imóvel próprio: receita, vacância, gestão, IR, CAPEX | estratégia híbrida |
| concentração patrimonial, baixa liquidez, perda de emprego | cenários de estresse |
| risco de inundação, encosta, erosão, maresia, ruído, violência | evidência local, sem falsa precisão |
| obra vizinha, mudança de zoneamento, condomínio deteriorado | desconto no valor futuro |
| custo pessoal de gestão e horas por evento | cenário econômico opcional |
| estabilidade residencial, liberdade de reformar, mobilidade | quadro qualitativo separado |

### L — Metadados, configuração e UX
| Variáveis | Notas |
| --- | --- |
| `schema_version`, `engine_version`, `scenario_id`, nomes e notas | reprodutibilidade |
| fonte, URL, data-base, faixa estimada, confiança, aviso de hipótese | transparência |
| preferências de unidades, formato BRL, período e vista nominal/real | apresentação |
| parâmetros herdados e sobrescritos por estratégia | evitar divergências ocultas |
| presets editáveis, importação/exportação, autosave opt-in/local | privacidade |
| eventos e alterações contratuais por mês | suporte a cenários detalhados |

## 5. Índices e taxonomia de despesas: cuidados legais

- Aluguel: distinguir **índice de reajuste do contrato** de **evolução do aluguel anunciado/negociado no mercado**.
- Condomínio: responsabilidades do locatário e locador diferem conforme natureza da despesa, contrato e Lei do Inquilinato; casa sem condomínio pode concentrar manutenção estrutural que, no prédio, é rateada.
- ITBI, tabela de emolumentos, IPTU, tributação da venda e programas habitacionais variam por localidade, período e situação; **não hardcode alíquotas nacionais**.
- CET não é parcela somada aos juros do financiamento: deve ser calculado/auditado com os fluxos de encargos da proposta, ou exibido como informação.
- Carta contemplada exige due diligence do contrato, administradora, documentos e aprovação de transferência; tratar cotação comercial como evidência inferior ao contrato.
- Saldo do FGTS, regras de programas subsidiados, limites de imóvel, condições de isenção e financiamento exigem parâmetros ou módulos específicos, nunca habilitação presumida.
- Não incluir encargos previstos no aluguel e na compra quando pagos uma única vez por outra parte.

## 6. Saídas que o motor deverá expor

**Principais:** patrimônio líquido nominal/real por cenário no horizonte, diferença real de riqueza, valor financeiro livre e vinculado, imóvel marcado a mercado, dívidas, necessidade máxima de caixa/aportes, custo mensal econômico equivalente, despesa nominal efetiva, valor líquido de liquidação, risco de déficit.

**Diagnóstico:** cronograma mensal e anual (caixa, capital investido, juros, amortização, indexação, condomínio, IPTU, seguro, manutenção, obras, impostos, cauções, compra/venda); reconciliação por categoria; composição da valorização; saldo devedor e reservas por mês; fonte de cada premissa relevante.

**Equilíbrio:** prazo em que resultado da compra ultrapassa aluguel, aluguel de equilíbrio, valorização real necessária, retorno financeiro alternativo de equilíbrio e preço de compra de equilíbrio. Se não houver solução nas restrições, informar explicitamente.

**Incerteza:** cenários desfavorável/central/favorável e sensibilidade univariada; depois stress, múltiplas trajetórias correlacionadas e probabilidade condicionada às distribuições assumidas.

## 7. Fontes a consultar e governança de premissas

| Fonte | Uso | Observações |
| --- | --- | --- |
| [FipeZAP](https://www.fipe.org.br/pt-br/indices/fipezap/) | venda/locação por mercado | anúncios não são transações |
| [BCB IVG-R](https://dadosabertos.bcb.gov.br/dataset/21340-indice-de-valores-de-garantia-de-imoveis-residenciais-financiados-ivg-r) | avaliações de imóveis financiados | cobertura limitada |
| [FGV IVAR](https://portalibre.fgv.br/indice-de-variacao-de-alugueis-residenciais) | contratos de aluguel | mercado distinto do FipeZAP |
| [IBGE IPCA](https://www.ibge.gov.br/explica/inflacao.php) | inflação | projetar separadamente |
| [BCB Focus](https://www.bcb.gov.br/controleinflacao/expectativasmercado) | expectativa macro | não é previsão garantida |
| [BCB taxas](https://www.bcb.gov.br/estatisticas/txjuros) | juros e crédito | contrato real prevalece |
| [IBGE SINAPI](https://www.ibge.gov.br/estatisticas/economicas/precos-e-custos/9270-sistema-nacional-de-pesquisa-de-custos-e-indices-da-construcao-civil.html) | custos de construção | orçamento específico prevalece |
| [FGV INCC](https://portalibre.fgv.br/estudos-e-pesquisas/indices-de-precos/incc) | evolução custo da obra | não confundir com IPCA |
| [Receita Federal](https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda) | ganho de capital | regras e isenções variáveis |
| [SGB](https://www.sgb.gov.br/pt/cartografia-de-suscetibilidade) | riscos naturais | granularidade local |

Hierarquia de evidência: (1) lei, norma e contrato aplicável; (2) documentação oficial da operação; (3) dados oficiais/publicações metodologicamente claras; (4) propostas e orçamentos verificáveis; (5) médias de mercado; (6) hipóteses ilustrativas. Registrar data e ressalvas. Nenhum default é fato universal. Pesquisas anteriores geraram este mapa; **verificação de vigência legal e calibração atual serão issues próprias**.

## 8. Arquitetura desejada e decisão pendente

Requisitos já estabelecidos:
- configuração independente dos cálculos, importação/exportação de **JSON versionado** e presets;
- motor financeiro sem dependência de interface, ledger mensal e funções puras testáveis;
- possibilidade de invocar o modelo por **`main.py`** (CLI/integração futura) e saída estruturada;
- interface web com recálculo, simulação guiada, comparação e explicação;
- uso local, reprodutibilidade, privacidade, testes de regressão e CI;
- manter o fluxo issue → branch → PR → testes → revisão → merge para desenvolvimento posterior.

**ADR pendente:** GitHub Pages hospeda arquivos estáticos, não executa Python no servidor. Antes de começar o motor, definir e provar uma das arquiteturas: Python canônico com UI usando Pyodide/WASM no navegador; Python com serviço/API separado; ou motor compartilhado com estratégia de paridade (evitar dois motores divergentes). Não declarar “GitHub Pages + `main.py`” funcional sem essa decisão. O CLI precisa consumir o mesmo schema e gerar resultados equivalentes à UI.

Proposta de contrato lógico de entrada (ilustrativa, ainda **não** schema aprovado):
```json
{
  "schema_version": "0.1-draft",
  "scenario": {"start_date": "2026-11-01", "months": 60},
  "household": {"initial_cash": 250000, "reserve_floor": 20000},
  "market": {"inflation_annual": 0.045, "investment_annual_net": 0.10},
  "properties": [{"id": "imovel-a", "type": "apartment", "price": 600000}],
  "strategies": [{"id": "aluguel", "kind": "rent"}, {"id": "avista", "kind": "buy-cash"}]
}
```
Campos de exemplo não significam defaults oficiais, completude ou schema validado.

## 9. Roadmap em issues — ordem sugerida

Os identificadores `E01..E42` são chaves estáveis de backlog, independentes do número atribuído pelo GitHub. Cada issue deve detalhar objetivo, aceite, dependências e testes; **P0** = especificação/bloqueadores, **P1** = motor, **P2** = produto/QA, **P3** = evoluções.

| Código | Prioridade | Entrega | Dependências |
| --- | --- | --- | --- |
| E01 | P0 | ADR do motor Python e execução web | — |
| E02 | P0 | Estrutura inicial, governança GitHub Flow e CI | E01 |
| E03 | P0 | Schema, dicionário tipado, migrações e validação | E01 |
| E04 | P0 | Calibração das fontes e regras legais/tributárias | — |
| E05 | P0 | Política de comparabilidade e jornadas do produto | — |
| E06 | P1 | Ledger financeiro mensal com eventos rastreáveis | E01,E03 |
| E07 | P1 | Carteira financeira, aportes, resgates e oportunidade | E06 |
| E08 | P1 | Inflação, índices, taxas e curvas temporais | E03,E06 |
| E09 | P1 | Compra à vista, aquisição, registro e CAPEX inicial | E06 |
| E10 | P1 | Financiamento SAC/Price, cronograma e quitação | E06 |
| E11 | P1 | Indexadores/seguros/tarifas e auditoria de CET | E08,E10 |
| E12 | P1 | Parcelamento direto e imóvel em construção | E06,E08 |
| E13 | P1 | Carta contemplada de consórcio | E06,E08,E04 |
| E14 | P1 | Aluguel, reajuste, caução e garantias | E06,E08 |
| E15 | P1 | Saída do aluguel, multa, renovação e mudança | E14 |
| E16 | P1 | Despesas recorrentes da propriedade | E06,E04 |
| E17 | P1 | Manutenção, obras, rateios, reservas e valor residual | E09,E16 |
| E18 | P1 | Projeção de avaliação, inflação, bairro e desgaste | E08,E09 |
| E19 | P1 | Venda, base fiscal e IR de ganho de capital | E04,E18 |
| E20 | P1 | Encerramento, dívida terminal ou retenção do ativo | E10,E13,E19 |
| E21 | P1 | Financiamento simétrico dos cenários e liquidez | E07,E14,E20 |
| E22 | P1 | Indicadores finais e reconciliação patrimonial | E21 |
| E23 | P2 | Shell da aplicação web e experiência responsiva | E01,E02,E05 |
| E24 | P2 | Assistente guiado de criação de simulações | E03,E23 |
| E25 | P2 | Formulários editáveis, ajuda, evidência e validação | E03,E23 |
| E26 | P2 | Painel comparativo de estratégias e indicadores | E22,E23 |
| E27 | P2 | Gráficos e auditoria mensal dos fluxos | E22,E26 |
| E28 | P2 | JSON import/export, migração, autosave e presets | E03,E23 |
| E29 | P2 | `main.py` CLI/API de integração e paridade | E01,E22 |
| E30 | P2 | Pontos de equilíbrio por busca numérica | E22 |
| E31 | P2 | Sensibilidade e cenários determinísticos | E22 |
| E32 | P2 | Fixtures, regressão e auditoria financeira | E06..E22 |
| E33 | P2 | QA em navegador, acessibilidade e usabilidade | E24..E28 |
| E34 | P2 | Pipeline de publicação e validação no GitHub Pages (se aplicável) | E01,E02,E33 |
| E35 | P2 | Casos-exemplo completos e manual de uso | E28,E32 |
| E36 | P3 | Uso parcial, imóvel vazio e aluguel do imóvel próprio | E22 |
| E37 | P3 | Stress de liquidez e eventos extraordinários | E22 |
| E38 | P3 | Monte Carlo com correlações e probabilidades | E31,E37 |
| E39 | P3 | Riscos locais, clima, urbanismo e patrimônio | E04,E18 |
| E40 | P3 | Integração opcional com dados públicos e proveniência | E04,E08 |
| E41 | P3 | Amortização/portabilidade e otimizações financeiras | E10,E22 |
| E42 | P3 | Quadro separado de flexibilidade e fatores não monetários | E05,E26 |

## 10. Critérios gerais de pronto

Uma issue de cálculo só poderá ser concluída quando tiver: (1) fórmula e limites documentados; (2) calendário e sinais corretos; (3) exemplos numéricos independentes; (4) teste unitário/integrado e casos-limite; (5) sem dupla contagem; (6) reconciliação com patrimônio, caixa e dívida; (7) descrição de fontes/hipóteses/limites.

Uma issue de interface só poderá ser concluída quando os dados utilizados forem **os do motor**, com edição, mensagens de erro, estados vazios, responsividade, acessibilidade, importação/exportação conforme aplicável e QA verificável.

**Governança:** toda alteração relevante passa por branch e PR, validação de CI e revisão do diff; não declarar a branch protegida nem site publicado sem evidência. Configurações pessoais, dados cadastrais, endereços precisos e contratos privados não devem entrar no repositório público.

## 11. Decisões em aberto (não inventar defaults)
1. Arquitetura Python/web e local de execução do motor (E01).
2. Tratamento de renda/despesa externa e retorno de investimentos tributado por prazo (E07/E21).
3. Fonte do aluguel e comparabilidade de imóveis (E05).
4. Preços transacionais versus anúncios; curvas de valorização e incerteza (E18/E04).
5. O que é legalmente devido em ITBI, condomínio, IR, FGTS e consórcio em cada contrato/localidade (E04/E13/E19).
6. Política de venda efetiva versus imóvel mantido e liquidez (E20).
7. Limites de horizonte, series mensais e tratamento das distribuições (E08/E38).
8. Separação de custos de moradia, qualidade de vida e risco individual (E42).

Este documento é o inventário e plano inicial, não aconselhamento financeiro, jurídico ou tributário.