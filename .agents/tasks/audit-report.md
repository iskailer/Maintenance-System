# Relatório final de auditoria: Sistema de Controle de Manutenção de Equipamentos

Nenhum segredo foi lido, impresso ou copiado. Variáveis de ambiente aparecem só pelo nome. Nada foi commitado.

## 13.1 Resumo da auditoria

**Estado inicial.** Backend em Express 5 (CommonJS), Prisma 6 e Firebase Admin, com camadas `routes -> controllers -> services -> database/prisma.js`. Frontend em HTML, ES Modules e Firebase JS SDK 12.11.0 via CDN. Só existia `GET /equipments`. O `index.html` estava vazio e o `login.html` era um fragmento. O dashboard usava dados fictícios e um endpoint `/dashboard` que não existe. Não havia `.env`, `node_modules` nem Prisma Client gerado.

**Resultado.** 26 problemas (4 críticos, 8 altos, 7 médios, 7 baixos). Todos os críticos e altos foram corrigidos, assim como os médios e baixos planejados. A exceção é B6, que só foi registrado.

### Lista priorizada

| ID | Prioridade | Problema | Causa | Correção |
|---|---|---|---|---|
| C1 | Crítico | `startswith` no middleware (500 com qualquer Authorization) | Erro de digitação | `startsWith` |
| C2 | Crítico | CORS depois das rotas; sem `express.json()` | Configuração no arquivo e ordem errados | CORS com allowlist e `express.json()` em `app.js`, antes das rotas |
| C3 | Crítico | `dotenv` não carregado; credencial Admin indefinida; Prisma Client não gerado | Projeto sem `.env`, `npm install` e `prisma generate` | `dotenv` primeiro em `server.js`; `cert()` a partir de `GOOGLE_APPLICATION_CREDENTIALS`; `.env.example` |
| C4 | Crítico | `"Bearer ${idToken}"` com aspas | Faltou template string | Crase |
| A1 | Alto | CRUD incompleto em rotas/controllers | Só `GET /` implementado | GET `/:id`, POST, PUT, DELETE com validação e status 400/404/409/500 |
| A2 | Alto | Sem 404 nem handler global de erros | Ausentes | Handlers em português em `app.js` |
| A3 | Alto | `feedback,textContent` no login | Vírgula no lugar de ponto | Corrigido |
| A4 | Alto | Redirect `./login.html` a partir de `pages/` | Caminho relativo errado | `../login.html` |
| A5 | Alto | Dashboard com mocks e `/dashboard` inexistente | Código de aula | Dados da API; indicadores calculados |
| A6 | Alto | Criar/excluir só em memória; `onclick` inline em módulo | Código de aula | `POST`/`DELETE` pela API; delegação de eventos; campo `patrimony` no modal |
| A7 | Alto | `index.html` vazio; `login.html` sem estrutura | Incompleto | Estrutura completa; `index` redireciona |
| A8 | Alto | Faltavam scripts `dev` e do Prisma | Ausentes | `dev`, `prisma:generate`, `prisma:status` |
| M1-M7 | Médio | XSS por `innerHTML`; pesquisa recarrega a página; URL da API repetida; porta fixa; mensagens de login genéricas; `.gitignore` sem service account; erro de carga invisível | Vários | `textContent`; `preventDefault`; `api.js`; `PORT` do env; mapa de `error.code`; novos padrões no `.gitignore`; alerta na tela |
| B1-B5, B7 | Baixo | Arquivos obsoletos, Popper/bootstrap duplicados, typos de CSS/HTML, README mínimo, sem `.env.example` | Resíduos de aula | Removidos ou corrigidos |
| B6 | Baixo | Migração `20261006003550_create_equipment` com data futura | Possível data errada | Fechado por decisão do usuário: o nome segue o padrão `YYYYMMDDHHMMSS_nome` e fica como está |
| N1 | Alto | Service account em `doc/maintenance-system-225ca-firebase-1.json` não era ignorada pelo Git (aparecia como `?? doc/`) | O nome não casava com nenhum padrão do `.gitignore` | Padrão `*-firebase-*.json` adicionado ao `.gitignore` da raiz |

## 13.2 Arquivos alterados e removidos

Fonte: `git status` e `git diff --stat` (18 arquivos, +489 / -398, mais 3 novos).

**Alterados**
- `.gitignore`: ignora `secrets/`, `serviceAccount*.json`, `*firebase-adminsdk*.json`, `*-credentials.json` e, na rodada de testes reais, `*-firebase-*.json` (achado N1; `git check-ignore` agora casa o arquivo em `doc/`, que não está rastreado).
- `README.MD`: instruções de execução local.
- `backend/.gitignore`: mesmos padrões de credenciais.
- `backend/package.json`: scripts `dev`, `prisma:generate`, `prisma:status`. Versões intactas.
- `backend/server.js`: `dotenv` primeiro, `PORT` do env, sem CORS.
- `backend/src/app.js`: CORS com allowlist, `express.json()`, 404 e handler global de erros.
- `backend/src/firebaseAdmin.js`: credencial via `cert()`, com erros claros em português.
- `backend/src/middlewares/authenticateToken.js`: `startsWith`.
- `backend/src/routes/equipmentRoutes.js`: rotas CRUD protegidas.
- `backend/src/controllers/equipmentController.js`: handlers CRUD com validação, whitelist de campos e status HTTP.
- `frontend/css/style.css`: typo `--sidebar-widht`.
- `frontend/index.html`: redireciona para `login.html`.
- `frontend/login.html`: estrutura HTML completa com Bootstrap 5.3.8.
- `frontend/pages/dashboard.html`: alerta, `searchForm`, colunas, campo `patrimony`, scripts duplicados removidos, `align-middle`.
- `frontend/js/dashboard.js`: dados da API, indicadores, criar/excluir, redirects corretos, `textContent`.
- `frontend/js/login.js`: typo e mensagens por `error.code`.

**Novos**
- `backend/.env.example`: nomes das variáveis, sem valores.
- `frontend/js/api.js`: `API_BASE_URL` e `apiRequest` com Bearer e erros em português.
- `.agents/`: artefatos da auditoria (não fazem parte do app).

**Removidos**
- `backend/--server.js`: mock antigo com erro de sintaxe, sem referências.
- `backend/src/controllers/-equipmentController.js`: versão antiga com array em memória, sem referências.

## 13.3 Dependências

Nenhuma dependência foi instalada, atualizada ou removida. As versões existentes são compatíveis e funcionais.

| Pacote | Versão |
|---|---|
| Node.js (usado nos testes) | v24.19.0 (`firebase-admin` exige >= 20) |
| npm | 11.17.0 |
| express | 5.2.1 |
| prisma / @prisma/client | 6.19.3 / 6.19.3 (iguais) |
| firebase-admin | 14.5.0 |
| cors / dotenv | 2.8.6 / 18.0.5 |
| Firebase JS SDK (CDN) | 12.11.0 |
| Bootstrap (CDN) | 5.3.8 |

Observações:
- `npm install` terminou sem erro. O `package-lock.json` muda só por metadado e foi revertido com `git checkout`.
- O npm 11 avisa que bloqueou scripts de instalação (`allow-scripts`). Isso não impediu `prisma generate` nem a execução do app.
- `npm audit` aponta 13 vulnerabilidades. Por decisão do usuário, não serão tratadas nesta entrega.
- Na rodada de testes reais o Node usado foi o v26.13.1 de `C:\Program Files\nodejs` (adicionado ao PATH só na sessão).

## 13.4 Variáveis de ambiente (`backend/.env`, só nomes)

- `PORT` (opcional, padrão 3000)
- `DATABASE_URL` (Supabase, pooler, porta 6543)
- `DIRECT_URL` (Supabase, conexão direta, porta 5432; o Prisma exige as duas)
- `CORS_ORIGINS` (opcional; `http://127.0.0.1:5500` e `http://localhost:5500` já são permitidas)
- `GOOGLE_APPLICATION_CREDENTIALS` (caminho do JSON da service account, relativo a `backend/`)

## 13.5 Como executar

**Backend**
```powershell
cd backend
npm install
# copie .env.example para .env e preencha os valores
npx prisma generate
npx prisma migrate status   # somente leitura
npm run dev                 # esperado: "Servidor iniciado em http://localhost:3000"
```

**Frontend.** Abra a pasta `frontend/` no VS Code e use Live Server em `http://127.0.0.1:5500/login.html`. Não abra por `file://`.

## 13.6 Testes (rodada com Firebase e Supabase reais)

Ambiente: Windows, Node v26.13.1 (`C:\Program Files\nodejs`, só no PATH da sessão), Chrome headless via `puppeteer-core` instalado em `%TEMP%` (fora do projeto, apagado ao final). Backend iniciado com `npm run dev` (`node --watch server.js`). Frontend servido por um servidor estático Node mínimo em `http://127.0.0.1:5500` apontando para `frontend/` (equivalente ao Live Server). Nenhum valor do `.env` ou da service account foi impresso. ID Tokens aparecem só com os 10 primeiros caracteres.

Dados de teste: usuários `audit-test-<timestamp>@example.com` e `audit-test-reg-<timestamp>@example.com` (criados e apagados com `auth().deleteUser`); equipamentos `TESTE-AUDITORIA-<timestamp>` com patrimônio `TESTE-AUD-<timestamp>` / `TESTE-AUD-UI-<timestamp>`. Nenhum registro real foi tocado (a tabela estava vazia: `GET /equipments` retornou 0 itens).

### Configuração e backend

| # | Teste | Status | Evidência |
|---|---|---|---|
| 1 | Variáveis do `backend/.env` | PASSOU | `PORT`, `DATABASE_URL`, `DIRECT_URL`, `CORS_ORIGINS`, `GOOGLE_APPLICATION_CREDENTIALS` definidas (só nomes verificados). `dotenv` injeta 5 variáveis. |
| 2 | Arquivo da service account | PASSOU após correção N1 | Existe em `doc/`. Não está rastreado (`git ls-files` vazio). Antes não era ignorado (`git check-ignore` código 1); depois do padrão `*-firebase-*.json`, `git check-ignore -v` casa a regra e `doc/` sumiu do `git status`. |
| 3 | `project_id` da service account = `projectId` do frontend | PASSOU | Ambos `maintenance-system-225ca`. |
| 4 | `npx prisma validate` | PASSOU | "The schema at prisma\schema.prisma is valid". |
| 5 | `npx prisma generate` | PASSOU | Client gerado sem erro. |
| 6 | `npx prisma migrate status` | PASSOU | "1 migration found ... Database schema is up to date!" |
| 7 | `npm run dev` | PASSOU | Log: `Servidor iniciado em http://localhost:3000`, sem erros no stderr. |
| 8 | `GET /equipments` sem token | PASSOU | 401 `{"message":"Autenticação necessária."}` |
| 9 | `Bearer invalid_token` | PASSOU | 401 `{"message":"Sessão inválida ou expirada."}` |
| 10 | Preflight de `http://127.0.0.1:5500` | PASSOU | 204, `Access-Control-Allow-Origin: http://127.0.0.1:5500`. |
| 11 | Preflight de `http://localhost:5500` | PASSOU | 204, `Access-Control-Allow-Origin: http://localhost:5500`. |
| 12 | Preflight de `http://evil.example` | PASSOU | 204 sem `Access-Control-Allow-Origin`. |

### Firebase Auth (REST, com usuário criado pelo Admin SDK)

| # | Teste | Status | Evidência |
|---|---|---|---|
| 13 | `createUser` com a credencial do backend (`src/firebaseAdmin.js`) | PASSOU | Usuário criado; UID não registrado no relatório. |
| 14 | `signInWithPassword` com senha correta | PASSOU | ID Token obtido (`eyJhbGciOi...`). |
| 15 | `signInWithPassword` com senha errada | PASSOU | Erro `INVALID_LOGIN_CREDENTIALS`. |
| 16 | `sendOobCode` `PASSWORD_RESET` | PASSOU | Resposta com o e-mail do usuário de teste. |

### CRUD com ID Token real e Supabase

| # | Teste | Status | Evidência |
|---|---|---|---|
| 17 | `GET /equipments` | PASSOU | 200, array (0 itens antes do teste). |
| 18 | `POST /equipments` | PASSOU | 201, corpo com `name` enviado e `id` gerado. |
| 19 | `GET /equipments/:id` | PASSOU | 200, `patrimony` igual ao enviado. |
| 20 | `PUT /equipments/:id` (`status`) | PASSOU | 200, `status` alterado; `GET` seguinte mostra a alteração. |
| 21 | Persistência conferida direto pelo Prisma | PASSOU | `prisma.equipment.findUnique` encontrou o registro com `name` e `status` atualizados. |
| 22 | `POST` sem campos obrigatórios | PASSOU | 400 `{"message":"O campo patrimony é obrigatório."}` |
| 23 | `POST` com patrimônio duplicado | PASSOU | 409 `{"message":"Já existe um equipamento com este patrimônio."}` |
| 24 | `GET /equipments/abc` | PASSOU | 400 `{"message":"Identificador de equipamento inválido."}` |
| 25 | `GET` / `PUT` em id inexistente | PASSOU | 404 `{"message":"Equipamento não encontrado."}` |
| 26 | `DELETE /equipments/:id` | PASSOU | 204; `GET` seguinte 404; `prisma.equipment.count` = 0. |

### Navegador (Chrome headless, `http://127.0.0.1:5500`)

| # | Teste | Status | Evidência |
|---|---|---|---|
| 27 | `pages/dashboard.html` sem sessão | PASSOU | Redireciona para `/login.html`. |
| 28 | `index.html` | PASSOU | Redireciona para `/login.html`. |
| 29 | Console do `login.html` | PASSOU | Único erro: 404 de `/favicon.ico` (o projeto não tem favicon; o Live Server teria o mesmo). Não é crítico e não foi alterado. Nenhum erro de JavaScript (`pageerror`). |
| 30 | Login com senha errada | PASSOU | Mensagem "E-mail ou senha incorretos." |
| 31 | "Esqueci minha senha" | PASSOU | Mensagem "Se o endereço de e-mail informado puder receber a recuperação, ...". |
| 32 | Login válido | PASSOU | Redireciona para `/pages/dashboard.html`; `#userInfo` mostra o e-mail. |
| 33 | Requisição do dashboard à API | PASSOU | `GET http://localhost:3000/equipments` com `Authorization: Bearer eyJhbGciOi...`, resposta 200. |
| 34 | Indicadores e tabela | PASSOU | Indicadores numéricos (0/0/0 com tabela vazia), alerta de erro oculto. |
| 35 | Reload mantém a sessão | PASSOU | Continua em `/pages/dashboard.html` com o e-mail do usuário. |
| 36 | `login.html` com sessão ativa | PASSOU | Vai direto para o dashboard. |
| 37 | Criar pelo modal | PASSOU | `POST` 201; linha `TESTE-AUDITORIA-... | TESTE-AUD-UI-... | Ativo | Excluir` aparece; registro existe no Supabase com `status=active`; indicador Ativos 0 -> 1. |
| 38 | Excluir pela tabela | PASSOU | `DELETE` 204; linha some; 0 registros no banco. Comportamento atual mantido (sem confirmação), conforme decisão do usuário. |
| 39 | Sair | PASSOU | Volta para `/login.html`. |
| 40 | Dashboard depois do logout | PASSOU | Redireciona para `/login.html`. |
| 41 | "Criar conta" | PASSOU | Redireciona para o dashboard; usuário existe no Firebase (removido depois). |
| 42 | "Criar conta" com e-mail já cadastrado | PASSOU | Mensagem "Este e-mail já está cadastrado." |

### Limpeza

| # | Item | Status | Evidência |
|---|---|---|---|
| 43 | Equipamentos de teste | PASSOU | Consulta Prisma por `name` `TESTE-AUDITORIA-*` ou `patrimony` `TESTE-AUD-*`: 0. |
| 44 | Usuários de teste | PASSOU | `listUsers` com e-mail `audit-test-*`: 0. |
| 45 | Servidores e temporários | PASSOU | Portas 3000 e 5500 livres; scripts e `puppeteer-core` apagados; `package-lock.json` sem alteração; `git status` sem arquivos novos fora de `.agents/` e `frontend/js/api.js` (já existente da auditoria). |

### Checklist dos requisitos

| # | Requisito | Status | Evidência |
|---|---|---|---|
| R1 | Frontend local em `http://127.0.0.1:5500` | PASSOU | Testes 27 a 42 (servidor estático equivalente ao Live Server). |
| R2 | Backend local com `npm run dev` em `http://localhost:3000` | PASSOU | Teste 7. |
| R3 | Cadastro e login com e-mail/senha no Firebase Auth | PASSOU | Testes 14 a 16, 30 a 32, 41 e 42. |
| R4 | Manter e restaurar sessão | PASSOU | Testes 35 e 36. |
| R5 | Proteção das páginas | PASSOU | Testes 27 e 40. |
| R6 | ID Token enviado como `Authorization: Bearer` | PASSOU | Teste 33. |
| R7 | Backend valida com `verifyIdToken` do Admin SDK | PASSOU | Token real aceito (17) e token inválido recusado (9), com a mesma credencial do Admin. |
| R8 | Endpoints protegidos (401) | PASSOU | Testes 8 e 9. |
| R9 | CRUD `GET`, `GET /:id`, `POST`, `PUT /:id`, `DELETE /:id` | PASSOU | Testes 17 a 26. |
| R10 | Persistência no Supabase via Prisma | PASSOU | Testes 6, 21, 26 e 37. |
| R11 | Dados reais visíveis no frontend | PASSOU | Testes 33, 34 e 37 (registro criado aparece na tabela e no indicador). |

## 13.7 Pendências

Resolvidas nesta rodada e removidas da lista: `.env`, service account, login por e-mail/senha, migrações aplicadas, testes ponta a ponta, B6 (fechado por decisão do usuário) e `npm audit` (ignorado por decisão do usuário).

1. Opcional: adicionar Node.js ao PATH do sistema (hoje ele existe em `C:\Program Files\nodejs`, mas não está no PATH).
2. Opcional: restringir a `apiKey` web por HTTP referrer no Google Cloud.
3. Opcional: considerar mover a service account de `doc/` para `backend/secrets/`. Ela já está ignorada pelo Git (N1), mas `doc/` costuma ser pasta de documentação.

### Observações não bloqueantes

- O pacote `cors` não bloqueia requisições sem cabeçalho Origin (curl, Postman). É o comportamento esperado; a autenticação por token continua obrigatória.
- O navegador registra 404 de `/favicon.ico`. Não afeta o uso.
