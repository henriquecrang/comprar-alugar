# Regras para agentes de implementação
- Ler `docs/plano-e-especificacao.md`, `docs/adr-001-arquitetura.md` e `docs/workflow-desenvolvimento.md` antes de alterar regras financeiras.
- Implementar através de issue → branch → commits → PR → CI → revisão; nunca fazer commit diretamente na `main`.
- Motor canônico: `engine.mjs`; o `main.py` encaminha JSON ao Node e não reimplementa o motor.
- Não duplicar custos: amortização reduz passivo; venda elimina ativo; reserva é dinheiro vinculado; custo de oportunidade já aparece na carteira financeira.
- Contratos e cálculos tributários brasileiros incompletos DEVEM gerar aviso e permanecer em backlog, nunca resultar em presunção de isenção.
- Preservar testes e atualizar especificação/documentação se mudar regra de cálculo.
