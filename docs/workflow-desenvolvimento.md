# Desenvolvimento e revisão (GitHub Flow)

Este repositório adota o padrão dos projetos `custo-veiculo` e `cenarios-consorcio`.

1. Toda implementação deve citar uma issue aberta; documentar eventuais dependências, riscos e critérios de aceite.
2. Branches como `feat/<issue>-assunto`, `fix/<issue>-assunto`, `docs/<issue>-assunto`. Não fazer commits diretamente na main. Commits no padrão Conventional Commits.
3. Uma issue pode ter implementação parcial no PR e permanecer aberta. Só fechar quando critérios da própria issue estiverem implementados, testados e documentados.
4. PR com descrição, testes, fontes de hipóteses e questões ainda não resolvidas. Conferir diff; não fazer merge sem CI verde e revisão do conteúdo.
5. Cálculo só é aceito quando tabela de eventos e indicadores reconciliam e casos-limite possuem testes. UI precisa usar **apenas** os resultados do motor.
6. Datas, alíquotas, índice de juros e cláusulas são dados editáveis; contratos e leis aplicáveis prevalecem sobre presets. O software não presume validade jurídica do resultado.
7. Não registrar CPF, renda privada individual, documentos, endereços de residência ou credenciais no repositório público.
8. GitHub Pages não executa backend Python. Ver [ADR-001](adr-001-arquitetura.md).
9. Proteção de branch é uma política do GitHub a ser configurada separadamente; instruções em arquivo não significam proteção habilitada.
