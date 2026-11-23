# Estado de implementação e backlog — 23/11/2026

## Entregue e integrado
- [PR #43](https://github.com/henriquecrang/comprar-alugar/pull/43) integrado à main, contendo motor econômico JS, antigo wrapper Python posteriormente retirado, UI estática responsiva, comparativo de cinco estratégias, entrada/saída JSON, CSV, gráficos, análise de sensibilidade e testes.
- CI da `main` aprovado: [execução de testes](https://github.com/henriquecrang/comprar-alugar/actions/runs/45196710259).
- Deploy Pages reportado com sucesso: [execução de publicação](https://github.com/henriquecrang/comprar-alugar/actions/runs/45196710257).
- Auditada a identidade patrimonial em 100 cenários sintéticos adicionais; não houve inconsistência numérica detectada nesse teste.
- Issues **#1 #2 #6 #10 #20 #21 #22 #29** encerradas após implementação e validação na rodada.
- [Especificação e roadmap](plano-e-especificacao.md) permanece a fonte de escopo e limitações.

## Pendências reais
Os demais itens #3–#42 (exceto os oito encerrados) permanecem **abertos**, inclusive aqueles com código parcial.

- #3 Schema e migração versionada: JSON import/export e schema inicial existem, mas não há migração robusta nem metadados completos.
- #4 Verificação tributária, cartorial, regulamentar e mercado; documento [fontes jurídicas](fontes-juridicas.md) cobre parte.
- #5 Comparabilidade: a interface alerta, mas não compara qualidade/área/localização de imóveis distintos.
- #7–#8 Séries financeiras e de inflação já funcionam via JSON; tributação de aplicação e índices heterogêneos precisam amadurecer.
- #9, #11–#19 Compra à vista, aluguel, preço e gastos já existem, porém há regras específicas, contratos, obras e tributos ainda não reproduzidos integralmente.
- #23–#28 UI e JSON implementados em beta; faltam wizard, ajuda contextual completa, migração, QA visual e auditoria interativa de eventos.
- #30–#32 Existe equilíbrio do aluguel e sensibilidade simples; ainda falta generalização, sensibilidade de todas as variáveis e regressões abrangentes.
- #33 QA de navegador real **não executado**.
- #34 Publicação com sucesso **reportado pelo GitHub**; ainda faltam verificação HTTP/browser independente e evidências end-to-end.
- #35 Documentação e preset inicial disponíveis; falta catálogo completo de casos verificados.
- #36–#42 Evoluções avançadas ainda não implementadas.

## Ordem recomendada para continuação autônoma
1. **#33 e #34** — teste real do site e verificação end-to-end antes de uso decisório.
2. **#3 #4 #5 #9 #14** — schema, comparabilidade, impostos/contratos e aquisição/aluguel corretos.
3. **#11 #12 #13 #17 #19** — instrumentos de crédito, consórcio e regras de obras/tributação mais completas.
4. **#24 #28 #30 #31 #32** — fluxo guiado, migrações, análises generalizadas e regressões.
5. **#36–#42** — módulos avançados.

## Nota
**Atualização de arquitetura:** a ADR-002 substitui o wrapper Python pela API JavaScript nativa; a issue histórica #29 foi superada. Node.js 22+ fica apenas em CLI de desenvolvimento e CI. O simulador não substitui cálculo oficial de imposto (GCAP), instrumento bancário ou regulamento de consórcio. A paginação dos relatórios, o fluxo de eventos mensais e o valor residual de melhorias merecem revisão contínua.

## Refatoração para JS puro — issues #45–#48
A arquitetura vigente foi definida na [ADR-002](adr-002-static-js.md): aplicação estática sem Python, backend ou build para o navegador. O CLI Node é opcional, e os testes automatizados verificam o mesmo motor usado na interface. As instruções históricas acima identificam o estado do PR #43 e não reintroduzem requisitos Python. Consulte #45–#48 para evidências e critérios de aceite.

## Ciclo de auditoria financeira (PR #50, novembro de 2026)

O ciclo acrescentou: oráculos independentes da função de produção, reconciliação determinística, correção do financiamento indexado e comissão de revenda, importação com schema e migração v1.0, overrides de custos por estratégia, avisos de equivalência habitacional e fontes contratuais documentadas. Evidências: [PR #50](https://github.com/henriquecrang/comprar-alugar/pull/50), [auditoria](auditoria-economica.md), [matriz de fontes](matriz-fontes-2026.md).
