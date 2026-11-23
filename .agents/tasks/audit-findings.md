# Auditoria técnica: Sistema de Controle de Manutenção de Equipamentos

Nenhum segredo foi lido ou copiado. Arquivos `.env` e credenciais: apenas nomes de variáveis e estado (definido/ausente).

## 1. Resumo do estado inicial

- Estrutura real: `backend/` (Express 5, CommonJS, Prisma 6, Firebase Admin) e `frontend/` (HTML + ES Modules + Firebase JS SDK 12.11.0 via CDN). Layout em camadas existe: `routes -> controllers -> services -> database/prisma.js`.
- Backend implementa só `GET /equipments` (lista). Services já têm CRUD completo; rotas e controllers não.
- Frontend: `index.html` vazio (0 bytes); `login.html` é fragmento (sem doctype, head, Bootstrap, CSS); `pages/dashboard.html` completo, mas `dashboard.js` usa array local (mock) e um endpoint `/dashboard` que não existe no backend.
- Ambiente desta máquina: `node`/`npm` NÃO estão no PATH (nenhum comando Node foi executado nesta auditoria). `backend/node_modules` não existe. `backend/.env` não existe. `src/generated/prisma` não existe (Prisma Client não gerado). Variáveis `DATABASE_URL`, `DIRECT_URL`, `GOOGLE_APPLICATION_CREDENTIALS`: não definidas no ambiente.
- Segredos versionados: `git ls-files` não lista `.env`, JSON de service account nem `node_modules`. O `apiKey` em `frontend/js/firebase.js` é configuração web pública do Firebase (esperado, não é segredo).
- `.gitignore` raiz ignora `node_modules/`, `.env`, `.env.*` (exceto `.env.example`). `backend/.gitignore` ignora `node_modules`, `.env`, `/src/generated/prisma`. Nenhum dos dois ignora JSON de service account.
- Migração: existe `20261006003550_create_equipment` (SQL confere com o schema: tabela `Equipment`, índice único em `patrimony`). `prisma migrate status` NÃO pôde ser executado (sem Node, sem DATABASE_URL).

## 2. Tabela de dependências (backend/package.json e package-lock.json)

| Pacote | Declarado | Travado (lock) | Observação |
|---|---|---|---|
| express | ^5.2.1 | 5.2.1 | Express 5 captura erros de middlewares async automaticamente |
| prisma | ^6.19.3 | 6.19.3 | Compatível com @prisma/client (mesma versão) |
| @prisma/client | ^6.19.3 | 6.19.3 | `prisma.config.ts` com `engine: "classic"` é válido na 6.19 |
| firebase-admin | ^14.5.0 | 14.5.0 | exige Node >= 20 |
| cors | ^2.8.6 | 2.8.6 | ok |
| dotenv | ^18.0.5 | 18.0.5 | usado só por `prisma.config.ts`; o app não o carrega |
| firebase (frontend, CDN) | 12.11.0 | n/a | `firebase.js`, `login.js`, `dashboard.js` usam a mesma versão |
| Node.js | não instalado no PATH | n/a | exigir >= 20 (lock) |
| npm | não instalado no PATH | n/a | |
| Bootstrap (CDN) | 5.3.8 | n/a | só em `dashboard.html` |

Conclusão: versões consistentes. Não atualizar nada. Faltam apenas scripts (`dev`, geração do Prisma).

## 3. Lista priorizada de problemas

### CRÍTICO (bloqueia inicialização/operação)

**C1. `startswith` em vez de `startsWith`**
- Arquivo: `backend/src/middlewares/authenticateToken.js`, `!authorization.startswith("Bearer ")`.
- Descrição: `String.prototype.startswith` não existe; `TypeError` sempre que há header Authorization (Express devolve 500). Sem header o 401 funciona.
- Causa: erro de digitação.
- Correção: trocar por `startsWith`.
- Impacto: token válido passa a ser verificado; 401 correto para ausente/inválido.

**C2. CORS registrado depois das rotas; sem `express.json()`**
- Arquivos: `backend/server.js` (`app.use(cors(...))` após `require("./src/app")`), `backend/src/app.js`.
- Descrição: em `app.js` a rota `/equipments` já foi montada; o CORS adicionado depois não é executado para ela (sem `Access-Control-Allow-Origin`, o navegador bloqueia; o preflight OPTIONS com `Authorization` falha). Também não há `app.use(express.json())`, então `req.body` é `undefined` em POST/PUT.
- Causa: configuração feita no arquivo errado e na ordem errada.
- Correção: mover CORS e `express.json()` para `app.js`, antes das rotas. Lista de origens: `http://127.0.0.1:5500`, `http://localhost:5500` mais as de `CORS_ORIGINS` (env, separadas por vírgula). Sem curinga. Métodos GET/POST/PUT/DELETE/OPTIONS; headers `Content-Type`, `Authorization`. Remover o CORS de `server.js`.
- Impacto: frontend consegue chamar a API; preflight responde 204.

**C3. Configuração de ambiente ausente (dotenv não carregado, credencial Firebase Admin indefinida, Prisma Client não gerado)**
- Arquivos: `backend/server.js`, `backend/src/firebaseAdmin.js` (`credential: applicationDefault()`), `backend/src/database/prisma.js` (`require("../generated/prisma")`).
- Descrição: o app nunca chama `dotenv`; `applicationDefault()` depende de `GOOGLE_APPLICATION_CREDENTIALS` (não definida) e falha na primeira verificação de token. `src/generated/prisma` não existe até rodar `prisma generate`, então `require` em `prisma.js` quebra. Não há `.env.example`.
- Causa: projeto clonado sem `.env`, sem `npm install` e sem `prisma generate`.
- Correção: `require("dotenv").config()` como primeira linha de `server.js`; em `firebaseAdmin.js` carregar a credencial do arquivo apontado por `GOOGLE_APPLICATION_CREDENTIALS` (resolvido a partir de `backend/`) via `cert()`, com erro claro em português se a variável ou o arquivo faltarem; criar `backend/.env.example` (só nomes); rodar `npm install` e `npx prisma generate`.
- Impacto: servidor sobe, Firebase Admin valida tokens, Prisma funciona.

**C4. Header Authorization com string literal em vez de template**
- Arquivo: `frontend/js/dashboard.js`, `Authorization: "Bearer ${idToken}"` (aspas duplas).
- Descrição: envia o texto `Bearer ${idToken}`; o backend sempre responde 401.
- Correção: usar crase: `` `Bearer ${idToken}` ``.
- Impacto: autenticação por ID Token funciona de ponta a ponta.

### ALTO (bloqueia funcionalidade importante)

**A1. CRUD de equipamentos incompleto nas rotas/controllers**
- Arquivos: `backend/src/routes/equipmentRoutes.js` (só `GET /`; demais comentadas), `backend/src/controllers/equipmentController.js` (só `getAllEquipments`).
- Descrição: faltam `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`. Os services existem (`equipmentService.js`).
- Correção: adicionar os 4 handlers com `authenticateToken`. Validar: `id` inteiro positivo (400); POST exige `name`, `patrimony`, `status` não vazios (400); `acquisitionDate` opcional e válida (400). Status: 200 lista/busca/atualiza, 201 criação, 204 exclusão, 404 inexistente (`findUnique` nulo ou Prisma `P2025`), 409 patrimônio duplicado (`P2002`), 500 demais. Mensagens em português. Whitelist dos campos (`name`, `patrimony`, `status`, `acquisitionDate`) para evitar mass assignment. Converter `id` com `Number` no controller (service continua sem `req/res`).
- Impacto: contrato REST conforme especificado.

**A2. Sem tratamento global de erros e sem 404**
- Arquivo: `backend/src/app.js`.
- Correção: após as rotas, `app.use` de 404 JSON em português e error handler `(err, req, res, next)` (400 para JSON malformado, 500 genérico sem vazar detalhes).
- Impacto: respostas consistentes em JSON.

**A3. Erro de digitação no `catch` do login**
- Arquivo: `frontend/js/login.js`, `feedback,textContent = "Não foi possivel entrar..."`.
- Descrição: vírgula no lugar de ponto; em login inválido lança `ReferenceError` e nada aparece na tela.
- Correção: `feedback.textContent = ...` (e corrigir "possivel"/"credencias").
- Impacto: usuário vê o erro de login.

**A4. Redirecionamentos para `./login.html` a partir de `pages/`**
- Arquivo: `frontend/js/dashboard.js` (3 ocorrências: `onAuthStateChanged`, logout, `loadEquipments`/401).
- Descrição: `dashboard.html` está em `frontend/pages/`; `./login.html` resolve para `pages/login.html` (404). Há também `response.status === 401` sem `return`.
- Correção: usar `../login.html` e `return` após redirecionar.
- Impacto: logout e proteção visual de página funcionam.

**A5. Dashboard usa dados fictícios e endpoint inexistente**
- Arquivo: `frontend/js/dashboard.js`.
- Descrição: array `equipments` local e `dashboardLoad()` chama `http://localhost:3000/dashboard`, que só existia no `--server.js` antigo (404). `loadEquipments` declara `const equipments` local (sombra) e `equipmentsTableRender` usa `equipment.local` (campo inexistente na API) e 4 colunas contra 3 `<th>`. Cabeçalho do HTML tem 3 colunas e o JS renderiza 4.
- Correção: manter um único estado `equipments` alimentado pela API; calcular os indicadores (ativos, manutenção, preventiva) a partir de `status` da lista; remover `dashboardLoad`/fetch de `/dashboard`; renderizar colunas compatíveis com `name`, `patrimony`, `status` e ajustar `<thead>`. Remover mocks e `console.log` de aula.
- Impacto: tela mostra dados reais do Supabase.

**A6. Criar/excluir equipamentos só em memória; `onclick` inline em módulo**
- Arquivos: `frontend/js/dashboard.js`, `frontend/pages/dashboard.html`.
- Descrição: salvar faz `push` no array; excluir usa `onclick="equipmentDelete(id)"`, mas funções de módulo ES não são globais (`ReferenceError`). O modal só tem `name`, porém o schema exige `patrimony` único e `status`.
- Correção: `POST /equipments` e `DELETE /equipments/:id` pela API; trocar `onclick` por `addEventListener` (delegação no `tbody` com `data-id`); adicionar campo `patrimony` ao modal (suposição mínima, exigência do schema; `status` fixo `"active"` como já usado no JS). Recarregar a lista após sucesso.
- Impacto: CRUD funcional ponta a ponta.

**A7. `index.html` vazio e `login.html` sem estrutura**
- Arquivos: `frontend/index.html` (0 bytes), `frontend/login.html`.
- Descrição: sem `<!DOCTYPE>`, `<head>`, charset, Bootstrap e CSS; sem `lang`. Acentos podem quebrar sem `<meta charset>`.
- Correção: completar `login.html` com a estrutura padrão e Bootstrap 5.3.8 como em `dashboard.html`, sem alterar o formulário (IDs `loginForm`, `email`, `password`, `registerButton`, `resetPasswordButton`, `feedback` batem com `login.js`). `index.html`: redirecionar (meta refresh/JS) para `login.html`.
- Impacto: páginas abrem corretamente no Live Server.

**A8. Scripts do `package.json` e `DIRECT_URL` obrigatório**
- Arquivos: `backend/package.json` (só `start`), `backend/prisma.config.ts` (`directUrl: env("DIRECT_URL")`), `backend/prisma/schema.prisma`.
- Descrição: falta `dev`; `env("DIRECT_URL")` lança erro quando a variável não existe (qualquer comando `prisma`).
- Correção: adicionar `"dev": "node --watch server.js"`, `"prisma:generate": "prisma generate"`, `"prisma:status": "prisma migrate status"`. Manter `DIRECT_URL` (Supabase: `DATABASE_URL` pelo pooler porta 6543 com `?pgbouncer=true`; `DIRECT_URL` conexão direta porta 5432) e documentar as duas no `.env.example`. Não alterar versões.
- Impacto: `npm run dev`/`npm start` e CLI do Prisma funcionam com `.env` completo.

### MÉDIO (comportamento errado em algumas situações)

**M1. Risco de XSS por `innerHTML`**: `dashboard.js` injeta `equipment.name` sem escape. Correção: criar células com `textContent`.

**M2. Formulário de pesquisa recarrega a página**: em `dashboard.html` o `<form>` com botão submit não tem `preventDefault`. Correção: `submit` handler com `preventDefault` em `dashboard.js` (filtro já funciona no evento `input`).

**M3. URL base da API repetida e fixa**: `http://localhost:3000` aparece em `dashboard.js` duas vezes. Correção: criar `frontend/js/api.js` com `API_BASE_URL` e função `apiRequest(path, options)` que anexa o Bearer token, interpreta JSON e traduz 400/401/403/404/409/500 e falha de rede para mensagens em português; `dashboard.js` usa só ele.

**M4. Porta e origens fixas no servidor**: `server.js` tem `PORT = 3000` fixo. Correção: `process.env.PORT || 3000`; log `Servidor iniciado em http://localhost:${PORT}`.

**M5. Mensagens de login/cadastro genéricas**: `login.js` mostra a mesma mensagem para qualquer `error.code`. Correção: mapa `error.code` para texto em português (`auth/invalid-credential`, `auth/email-already-in-use`, `auth/weak-password`, `auth/invalid-email`, `auth/too-many-requests`, `auth/network-request-failed`), padrão genérico. Desabilitar botões durante a requisição é opcional.

**M6. `.gitignore` não cobre service account**: adicionar a `backend/.gitignore` e ao raiz: `serviceAccount*.json`, `*firebase-adminsdk*.json`, `*-credentials.json`.

**M7. Sem tratamento de falha de carregamento na tela**: `loadEquipments` só faz `console.error`; usuário não vê nada. Correção: área de aviso (elemento de alerta Bootstrap existente no padrão) com a mensagem em português vinda de `apiRequest`.

### BAIXO (organização/qualidade)

**B1.** `backend/--server.js`: stale. Mock antigo (`/dashboard` com números fixos, resto comentado), tem erro de sintaxe (`origin: '...', 'http://localhost:5500'` dentro de objeto), não é referenciado por `package.json` (`main`/`start` usam `server.js`) nem por `require`. Candidato a exclusão: REMOVER (`git rm`).

**B2.** `backend/src/controllers/-equipmentController.js`: stale. Versão inicial com array em memória e campos em português (`nome`); nenhum `require` o referencia (rotas usam `equipmentController.js`). REMOVER (`git rm`).

**B3.** `dashboard.html` carrega Bootstrap bundle, Popper e `bootstrap.min.js` juntos (o bundle já inclui Popper). Manter só o bundle. Remover `console.log`/código comentado de aula em `dashboard.js`.

**B4.** Detalhes de CSS/HTML: classe `align-midle` (correto `align-middle`), variável `--sidebar-widht` em `style.css`, `forms.css` vazio (referenciado), `<footer>` e `<div class="modal">` dentro de `.row`. Corrigir só typos; não mexer no visual.

**B5.** `README.MD` mínimo; adicionar passos de execução local (instalar, `.env`, `prisma generate`, `npm run dev`, Live Server na porta 5500).

**B6.** Pasta de migração `20261006003550_create_equipment` tem timestamp de 2026-10-06 (futuro, possivelmente data errada). Ordenação continua válida e renomear exige reconciliar `_prisma_migrations` no banco. Não alterar; só registrar.

**B7.** Sem `backend/.env.example`. Criar com nomes: `PORT`, `DATABASE_URL`, `DIRECT_URL`, `GOOGLE_APPLICATION_CREDENTIALS`, `CORS_ORIGINS`.

### Contagem
- CRÍTICO: 4
- ALTO: 8
- MÉDIO: 7
- BAIXO: 7
- Total: 26

## 4. Plano de correção ordenado (diffs mínimos)

1. Backend, ordem de dependência:
   1. `backend/package.json`: scripts `dev`, `prisma:generate`, `prisma:status` (A8).
   2. `backend/.env.example` novo (B7); `.gitignore` raiz e backend (M6).
   3. `backend/src/firebaseAdmin.js`: credencial via `cert()` do arquivo em `GOOGLE_APPLICATION_CREDENTIALS` (C3).
   4. `backend/src/middlewares/authenticateToken.js`: `startsWith` (C1).
   5. `backend/src/app.js`: CORS (allowlist + env), `express.json()`, rotas, 404, error handler (C2, A2).
   6. `backend/server.js`: `dotenv` primeiro, `PORT` de env, sem CORS (C2, C3, M4).
   7. `backend/src/controllers/equipmentController.js` e `routes/equipmentRoutes.js`: CRUD completo com validação e status HTTP (A1).
   8. `git rm backend/--server.js backend/src/controllers/-equipmentController.js` (B1, B2).
2. Frontend:
   1. `frontend/js/api.js` novo (M3); usar em `dashboard.js`.
   2. `frontend/js/login.js`: typo `feedback,textContent`, mapa de erros (A3, M5).
   3. `frontend/login.html` e `frontend/index.html` (A7).
   4. `frontend/js/dashboard.js` e `pages/dashboard.html`: redirects `../login.html`, Bearer correto, dados da API, indicadores calculados, create/delete via API, delegação de eventos, `textContent`, `preventDefault` na pesquisa, mensagens de erro (C4, A4, A5, A6, M1, M2, M7, B3, B4).
3. Documentação: `README.MD` (B5).
4. Verificação final (exige Node >= 20 e `.env` real; ver pendências): `cd backend; npm install; npx prisma generate; npx prisma migrate status` (somente leitura); `node --check` em cada `.js` do backend; `npm run dev` e conferir log com URL/porta; requisições sem token (esperado 401) e token inválido (401); `GET /equipments` com token real (200). Frontend: abrir `http://127.0.0.1:5500/login.html` no Live Server, testar cadastro, login, listagem, criação, exclusão, logout, recuperação de senha. Sem comandos destrutivos (nada de `migrate reset` ou `db push --force-reset`).

## 5. Pendências manuais (dependem de entrada externa)

1. Instalar Node.js >= 20 (e npm) e deixá-los no PATH desta máquina; hoje `node`/`npm` não são encontrados.
2. Criar `backend/.env` com valores reais (ao Supabase: Project Settings > Database): `DATABASE_URL` (pooler, porta 6543, `?pgbouncer=true`), `DIRECT_URL` (porta 5432), `GOOGLE_APPLICATION_CREDENTIALS`, e opcionalmente `PORT` e `CORS_ORIGINS`.
3. Gerar a chave de service account no Firebase Console (Configurações do projeto > Contas de serviço) para o projeto `maintenance-system-225ca` (mesmo `projectId` do frontend em `firebase.js`), salvá-la fora do Git (ex.: `backend/secrets/`, já coberto pelos novos padrões do `.gitignore`) e apontar `GOOGLE_APPLICATION_CREDENTIALS` para ela. A correspondência do project id entre front e Admin SDK só pode ser confirmada com esse arquivo (não verificado).
4. Firebase Console > Authentication: ativar o provedor E-mail/Senha; em Settings > Authorized domains, incluir `127.0.0.1` (por padrão só `localhost` é autorizado) caso se use Live Server em `127.0.0.1:5500`.
5. Executar `npx prisma migrate status` com o banco real; se o banco estiver sem a tabela, aplicar com `npx prisma migrate deploy` (não destrutivo). Decidir se mantém a pasta de migração com data de 2026 (B6).
6. Confirmar que a chave `apiKey` pública do Firebase tem restrições de HTTP referrer, se desejado (opcional, console Google Cloud).
