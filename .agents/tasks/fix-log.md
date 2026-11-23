# Registro de correÃ§Ãµes (iteraÃ§Ã£o 1)

Nenhum segredo foi lido, impresso ou copiado. `backend/.env` nÃ£o existe nesta mÃ¡quina; nenhum valor real de credencial foi usado.

## Ambiente de verificaÃ§Ã£o

- `node`/`npm` nÃ£o estÃ£o no PATH. Usei o Node que jÃ¡ vem com o IntelliJ (`%APPDATA%\JetBrains\IntelliJIdea2026.2\node\versions\24.19.0`), adicionado ao PATH sÃ³ na sessÃ£o do comando. Nada foi instalado no sistema.
- Node v24.19.0, npm 11.17.0.
- prisma 6.19.3 e @prisma/client 6.19.3 (`npx prisma -v`): versÃµes iguais e compatÃ­veis. Nenhuma dependÃªncia foi alterada.

## Comandos executados e resultados

| Comando | Resultado |
|---|---|
| `npm install` (backend) | OK. O npm 11 avisou que bloqueou o postinstall do `protobufjs` (allow-scripts); sem efeito no app. O `package-lock.json` mudou sÃ³ por metadado (`"peer": true`) e foi revertido com `git checkout`. |
| `npx prisma -v` | OK, carregou `prisma.config.ts`. |
| `npx prisma generate` (sem `.env`) | OK, client gerado em `src/generated/prisma` (ignorado pelo Git). |
| `node --check` em `server.js` e em todos os `.js` de `src/` | Todos com cÃ³digo 0. |
| `node server.js` sem `GOOGLE_APPLICATION_CREDENTIALS` | Para na hora com a mensagem: "VariÃ¡vel GOOGLE_APPLICATION_CREDENTIALS nÃ£o definida no arquivo .env." (categoria: credenciais). |
| `node server.js` e `npm run dev` com service account **descartÃ¡vel** (chave RSA gerada na hora em `%TEMP%`, project_id `test-project`, apagada logo depois) | Log: `Servidor iniciado em http://localhost:3000`. |
| `GET /equipments` sem token | 401 `{"message":"AutenticaÃ§Ã£o necessÃ¡ria."}` |
| `GET /equipments` com `Authorization: Bearer invalid_token` | 401 `{"message":"SessÃ£o invÃ¡lida ou expirada."}` (antes desta correÃ§Ã£o dava 500, por causa do `startswith`) |
| `POST /equipments` sem token; `GET /equipments/1` com `Basic abc` | 401 nos dois |
| `GET /nao-existe` | 404 `{"message":"Rota nÃ£o encontrada."}` |
| `POST` com JSON malformado | 400 `{"message":"JSON invÃ¡lido na requisiÃ§Ã£o."}` |
| Preflight `OPTIONS /equipments` vindo de `http://127.0.0.1:5500` com `authorization` | 204, `Access-Control-Allow-Origin: http://127.0.0.1:5500`, mÃ©todos `GET,POST,PUT,DELETE,OPTIONS`, cabeÃ§alhos `Content-Type,Authorization` |
| Preflight vindo de `http://evil.example` | Sem `Access-Control-Allow-Origin` (o navegador bloqueia) |
| Controller com service simulado (script temporÃ¡rio, jÃ¡ apagado) | id `abc` 400; id inexistente 404; POST sem body 400; POST vÃ¡lido 201, com o campo extra descartado; patrimÃ´nio duplicado (P2002) 409; data invÃ¡lida 400; PUT vazio 400; PUT/DELETE inexistente (P2025) 404; PUT vÃ¡lido 200; DELETE vÃ¡lido 204 |
| `node --check` em cÃ³pias `.mjs` de `frontend/js/*.js` | api.js, dashboard.js, firebase.js e login.js com cÃ³digo 0 |
| ConferÃªncia de IDs | Os 14 IDs que `dashboard.js` usa existem em `pages/dashboard.html`. Os 6 IDs de `login.js` existem em `login.html`. `localhost:3000` aparece sÃ³ em `frontend/js/api.js`. |
| Servidor parado (`taskkill /T`) | Porta 3000 livre |

NÃ£o verificado (depende de credenciais reais): conexÃ£o com o Supabase, `prisma migrate status` contra o banco, verificaÃ§Ã£o de um ID Token real e o fluxo no navegador (cadastro, login, CRUD, logout, recuperaÃ§Ã£o de senha). Nenhum comando de banco foi executado.

## Arquivos alterados

- `backend/package.json`: scripts `dev` (`node --watch server.js`), `prisma:generate` e `prisma:status`. VersÃµes mantidas. (A8)
- `backend/.env.example` (novo): sÃ³ os nomes `PORT`, `DATABASE_URL`, `DIRECT_URL`, `CORS_ORIGINS` e `GOOGLE_APPLICATION_CREDENTIALS`, com valores vazios. (B7)
- `backend/.gitignore` e `.gitignore` (raiz): passam a ignorar `secrets/`, `serviceAccount*.json`, `*firebase-adminsdk*.json` e `*-credentials.json`. (M6)
- `backend/server.js`: `dotenv` carregado primeiro; `PORT` vem do env (padrÃ£o 3000); CORS removido daqui. (C2, C3, M4)
- `backend/src/app.js`: CORS com allowlist fixa + `CORS_ORIGINS`, e `express.json()`, ambos antes das rotas; handler 404 e handler global de erros em portuguÃªs. (C2, A2)
- `backend/src/firebaseAdmin.js`: credencial carregada por `cert()` a partir do arquivo em `GOOGLE_APPLICATION_CREDENTIALS` (caminho relativo a `backend/`), com erro claro em portuguÃªs. (C3)
- `backend/src/middlewares/authenticateToken.js`: `startswith` corrigido para `startsWith`. (C1)
- `backend/src/routes/equipmentRoutes.js`: rotas GET `/`, GET `/:id`, POST `/`, PUT `/:id` e DELETE `/:id`, todas protegidas por `authenticateToken`. (A1)
- `backend/src/controllers/equipmentController.js`: os quatro handlers que faltavam, com validaÃ§Ã£o, whitelist de campos e status 400/404/409/500. (A1)
- `frontend/js/api.js` (novo): `API_BASE_URL` num lugar sÃ³ e `apiRequest`, que envia `Bearer <ID Token>` e traduz 400/401/403/404/409/500 e falha de rede para portuguÃªs. (M3)
- `frontend/js/dashboard.js`: redirects para `../login.html`; dados vindos da API (sem mocks nem `/dashboard`); indicadores calculados; criar/excluir pela API; delegaÃ§Ã£o de eventos no lugar de `onclick`; cÃ©lulas preenchidas com `textContent`; `preventDefault` na pesquisa; alerta de erro na tela; `signOut` antes de redirecionar em caso de 401, para nÃ£o entrar em loop com o login. (C4, A4, A5, A6, M1, M2, M7, B3)
- `frontend/js/login.js`: corrigido `feedback,textContent`; mensagens em portuguÃªs por `error.code`; `onAuthStateChanged` manda o usuÃ¡rio jÃ¡ logado para o dashboard. (A3, M5)
- `frontend/login.html`: estrutura HTML completa (doctype, charset, Bootstrap 5.3.8); formulÃ¡rio e IDs sem mudanÃ§a. (A7)
- `frontend/index.html`: redireciona para `login.html` (antes o arquivo estava vazio). (A7)
- `frontend/pages/dashboard.html`: alerta `#pageAlert`; `id="searchForm"`; botÃ£o de pesquisa com `type="submit"`; colunas Equipamento/PatrimÃ´nio/Status/AÃ§Ãµes; campo `#equipmentPatrimony` no modal; linhas de exemplo retiradas; Popper e `bootstrap.min.js` duplicados retirados (o bundle jÃ¡ inclui os dois); `align-midle` corrigido para `align-middle`. (A5, A6, M2, M7, B3, B4)
- `frontend/css/style.css`: `--sidebar-widht` corrigido para `--sidebar-width` (a variÃ¡vel nÃ£o Ã© usada em nenhum lugar). (B4)
- `README.MD`: instruÃ§Ãµes para rodar localmente (backend, `.env`, Prisma, Live Server na porta 5500, nunca `file://`). (B5)

## Arquivos excluÃ­dos

- `backend/--server.js`: mock antigo com erro de sintaxe, sem nenhuma referÃªncia (`main`/`start` usam `server.js`). (B1)
- `backend/src/controllers/-equipmentController.js`: versÃ£o antiga com array em memÃ³ria, sem nenhum `require` apontando para ela. (B2)

## NÃ£o alterado (registrado)

- `prisma/schema.prisma`, `prisma.config.ts`, migraÃ§Ã£o `20261006003550_create_equipment` (B6) e `src/services/equipmentService.js`, que jÃ¡ estavam corretos.

## PendÃªncias manuais

1. Criar `backend/.env` a partir de `.env.example`, com os valores reais do Supabase e o caminho do JSON da conta de serviÃ§o do projeto Firebase `maintenance-system-225ca`.
2. Rodar `npx prisma migrate status` e, se houver migraÃ§Ã£o pendente, `npx prisma migrate deploy`.
3. Firebase Console: ativar E-mail/Senha e incluir `127.0.0.1` em Authorized domains.
4. Instalar Node.js 20 ou superior no PATH, ou continuar usando o Node do IntelliJ.

## Iteração 2
- backend/src/firebaseAdmin.js: JSON de credencial inválido agora gera mensagem em português (node não está no PATH nesta sessão; node --check não executado, alteração é um try/catch simples). A verificação ponta a ponta com Supabase/Firebase reais segue como pendência manual (sem credenciais).


## Rodada de testes reais

- N1: `.gitignore` da raiz ganhou o padrão `*-firebase-*.json`. A service account em `doc/maintenance-system-225ca-firebase-1.json` aparecia como não rastreada e não ignorada (risco de commit acidental). Agora `git check-ignore` casa a regra. Nenhum código da aplicação foi alterado; o dashboard manteve o comportamento.

