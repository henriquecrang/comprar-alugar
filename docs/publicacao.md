# Publicação e QA web

## Estratégia
A interface utiliza ES modules JavaScript, sem backend. A opção atual é GitHub Pages publicando os arquivos do repositório após testes em Node. Ação: `.github/workflows/pages.yml`. `main.py` é apenas CLI local e não executa em Pages.

## Como verificar
1. Confirmar workflow `Testes financeiros` aprovado no PR **e no commit**.
2. Confirmar `Publicar simulador` aprovado após integrar a branch à main.
3. Confirmar Settings → Pages → Source: GitHub Actions, caso `actions/configure-pages` não consiga habilitar automaticamente.
4. Acessar a URL reportada por `deploy-pages` em navegador real, sem login; verificar carregamento de CSS, módulos JS e valores do cenário.
5. Alterar taxas e confirmar recálculo, persistência local, import/export JSON e CSV, mobile, acessibilidade e mensagens de erro.
6. Testar no browser real cenários relevantes e comparar números com execução de `python3 main.py` do mesmo JSON.
7. Registrar evidências e problemas em issue #33. Não declarar publicação confirmada só porque foi criado o workflow.

**Endereço provável**, a confirmar via workflow: https://henriquecrang.github.io/comprar-alugar/.

## Limitações
GitHub Pages não executa Python no servidor nem fornece armazenamento remoto dos cenários. A UI carrega em navegador com suporte a ES modules. Dados permanecem em armazenamento local e arquivos exportados. Novas versões de schema devem introduzir migrações testadas.
