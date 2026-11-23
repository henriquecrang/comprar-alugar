# Comprar ou Alugar — simulador patrimonial imobiliário

Ferramenta em planejamento para comparar **aluguel residencial** com **compra à vista, financiamento bancário, parcelamento direto ou carta contemplada de consórcio**, considerando custos de aquisição, manutenção, obras, impostos, valorização real, investimentos alternativos, liquidez e saída do imóvel.

## Documentação
- **[Pesquisa, especificação financeira inicial e roadmap](docs/plano-e-especificacao.md)** — inventário de variáveis, princípios, modalidades, fontes, decisões em aberto e sequência de entregas.
- **[Backlog no GitHub Issues](https://github.com/henriquecrang/comprar-alugar/issues)** — 42 issues planejadas, identificadas por E01–E42, com prioridades, critérios de aceite e dependências.

## Status

**Planejamento concluído; implementação não iniciada.** A primeira etapa é decidir a arquitetura de um motor financeiro reutilizável em Python, com ponto de entrada `main.py` e integração com interface web. GitHub Pages não executa Python no servidor; a solução de integração será definida na [issue E01](https://github.com/henriquecrang/comprar-alugar/issues/1).

Referências conceituais: [custo-veiculo](https://github.com/henriquecrang/custo-veiculo), [cenarios-consorcio](https://github.com/henriquecrang/cenarios-consorcio), [viabilidade-airbnb](https://github.com/henriquecrang/viabilidade-airbnb).

## Princípio

Comparar **patrimônio líquido real**, **fluxo de caixa mensal**, **necessidade de capital**, **custo equivalente da moradia** e **risco**, sem confundir amortização com custo, nem contabilizar duas vezes a valorização do imóvel ou o custo de oportunidade.

*Os valores e referências são hipóteses de simulação, não aconselhamento financeiro, tributário ou jurídico.*
