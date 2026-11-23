# Publicação e QA web

## Estado observado em 23/11/2026

- PR #43 integrado na `main`, commit `3a64c1a7bc1af8fbce6d6df1bcaab601364da52d`.
- Workflow [Publicar simulador](https://github.com/henriquecrang/comprar-alugar/actions/runs/45196710257) **concluiu com sucesso**, etapa de deploy também aprovada. Logs registram `Reported success!` e URL https://henriquecrang.github.io/comprar-alugar/.
- A URL **não foi carregada com sucesso pela ferramenta externa de acesso web desta sessão**. Isso não invalida o deploy reportado, mas **não equivale a QA HTTP/browser**. A issue #33 e os critérios residuais da #34 permanecem abertos.

## Estratégia
A interface utiliza HTML, CSS e ES modules JavaScript puros, sem backend ou etapa de build. O GitHub Pages publica os arquivos do repositório depois de CI financeiro e smoke test real no Chrome. Node é ferramenta exclusiva de CI/desenvolvimento. Consulte [ADR-002](adr-002-static-js.md).

## Como verificar
1. Confirmar workflow `Testes financeiros` aprovado no PR **e no commit**.
2. Confirmar `Publicar simulador` aprovado após integrar a branch à main.
3. Confirmar Settings → Pages → Source: GitHub Actions, caso `actions/configure-pages` não consiga habilitar automaticamente.
4. Acessar a URL reportada por `deploy-pages` em navegador real, sem login; verificar carregamento de CSS, módulos JS e valores do cenário.
5. Alterar taxas e confirmar recálculo, persistência local, import/export JSON e CSV, mobile, acessibilidade e mensagens de erro.
6. Testar no navegador real cenários relevantes e comparar números com o motor via `model-api.mjs` e o CLI de desenvolvimento `node cli.mjs` do mesmo JSON; o smoke test roda no CI.
7. Registrar evidências e problemas em issue #33. Não declarar publicação confirmada só porque foi criado o workflow.

**Endereço provável**, a confirmar via workflow: https://henriquecrang.github.io/comprar-alugar/.

## Limitações
GitHub Pages é apenas hospedagem de arquivos estáticos e não fornece armazenamento remoto de cenários. A UI carrega em navegadores com suporte a ES Modules. Dados permanecem em armazenamento local e arquivos exportados. Novas versões de schema devem introduzir migrações testadas.
