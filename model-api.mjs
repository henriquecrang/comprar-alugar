// API estável do motor financeiro: ES Modules nativos, sem dependências de ambiente.
// Funciona diretamente no navegador e no Node usado apenas em testes/CLI.
export {validate, project, compare} from './engine.mjs';
export const MODEL_API_VERSION = '1.0';
