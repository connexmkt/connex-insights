# connex-insights

## Documentação da API

Documentação dos endpoints em `app/api/`. Começando pelas rotas de cron job.

### Cron Jobs (`app/api/cron/instagram/`)

Regras comuns a todas as rotas abaixo:

- **Método HTTP:** apenas `GET`. A Vercel sempre invoca cron jobs com `GET`; nenhuma rota implementa `POST`, então qualquer outro método recebe `405 Method Not Allowed` automaticamente do Next.js.
- **Autenticação:** header `Authorization: Bearer <INSTAGRAM_CRON_SECRET>`. Se o valor não bater, a rota responde `401` com `{ error: "Não autorizado.", code: "SESSION_EXPIRED" }` antes de executar qualquer lógica.

#### `GET /api/cron/instagram/daily-sync`
- Agenda: `0 4 * * *` (diariamente, 04:00 UTC).
- Objetivo: dispara a sincronização diária de métricas do Instagram para todos os tenants com integração `CONNECTED`.
- Erros: falhas de sincronização de um tenant específico são capturadas individualmente e contabilizadas no campo `failed` da resposta (`200`); não interrompem o processamento dos demais tenants. Uma falha antes do loop (ex.: erro ao consultar integrações no banco) não é tratada e resulta em `500`.

#### `GET /api/cron/instagram/refresh-tokens`
- Agenda: `0 3 * * *`.
- Objetivo: renova tokens de acesso do Instagram que expiram nos próximos 14 dias, ignorando credenciais criadas há menos de 24h para evitar renovar tokens recém-emitidos.
- Erros: falhas ao renovar um token específico são capturadas por credencial e contabilizadas em `failed`; se o erro indicar problema de autenticação na Meta API, a integração é marcada como exigindo reconexão. Erros fora do loop (ex.: falha na consulta ao banco) não são tratados e resultam em `500`.

#### `GET /api/cron/instagram/purge-metrics`
- Agenda: `0 5 * * *`.
- Objetivo: apaga snapshots de métricas mais antigos que o período de retenção configurado (`metricRetentionDays`).
- Erros: não há tratamento próprio — uma falha na exclusão (ex.: indisponibilidade do banco) propaga como exceção não tratada e resulta em `500`.

#### `GET /api/cron/instagram/generate-weekly-reports`
- Agenda: `0 2 * * 1` (segunda-feira, 02:00 UTC).
- Objetivo: gera os relatórios semanais de todos os tenants e os persiste com status `PENDING`. É idempotente — reexecuções sobrescrevem o payload mantendo o status `PENDING`.
- Erros: falhas ao persistir o relatório de um tenant são capturadas, logadas e contabilizadas em `skipped`; os demais tenants continuam sendo processados.

#### `GET /api/cron/instagram/send-weekly-reports`
- Agenda: `0 11 * * 1`.
- Objetivo: envia ao CRM todos os relatórios semanais com status `PENDING` e atualiza o status para enviado ou falho conforme o resultado.
- Erros: uma falha de envio não lança exceção — é identificada pelo retorno do CRM, registrada (persistindo a mensagem de erro) e contabilizada em `failed`; o processamento dos demais relatórios continua normalmente.

#### `GET /api/cron/instagram/generate-monthly-reports`
- Agenda: `0 2 * * 1` (mesmo horário do cron semanal).
- Objetivo: gera os relatórios mensais referentes ao mês anterior. Como compartilha o horário com o cron semanal, só executa de fato entre os dias 1 e 7 do mês (primeira segunda-feira); fora dessa janela retorna `{ skipped: true, reason: "not-first-week" }` sem gerar nada.
- Erros: mesmo comportamento do cron semanal de geração — falhas de persistência por tenant são capturadas, logadas e contabilizadas em `skipped`.

#### `GET /api/cron/instagram/send-monthly-reports`
- Agenda: `0 11 * * 1`.
- Objetivo: envia ao CRM os relatórios mensais `PENDING` e atualiza o status conforme o resultado. Também só executa na primeira semana do mês, pelo mesmo motivo do cron de geração.
- Erros: mesmo comportamento do envio semanal — falhas de envio são identificadas pelo retorno do CRM, registradas e contabilizadas em `failed`, sem interromper os demais envios.
