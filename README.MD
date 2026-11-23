Nome: Sistema de manutenção de equipamentos
Objetivo: Criar um sistema para o controle da manutenção de equipamentos
Tecnologias: HTML, JS, CSS, Node ...
Autor: Iskailer

## Como executar localmente

Pré-requisitos: Node.js 20 ou superior (com npm), um projeto no Supabase e um projeto no Firebase com o provedor E-mail/Senha ativado.

### Backend

1. Instale as dependências:

   ```powershell
   cd backend
   npm install
   ```

2. Copie `backend/.env.example` para `backend/.env` e preencha os valores:
   - `DATABASE_URL`: conexão do Supabase pelo pooler (porta 6543, com `?pgbouncer=true`).
   - `DIRECT_URL`: conexão direta do Supabase (porta 5432), usada pelo Prisma Migrate.
   - `GOOGLE_APPLICATION_CREDENTIALS`: caminho do JSON da conta de serviço do Firebase Admin (Firebase Console > Configurações do projeto > Contas de serviço), relativo à pasta `backend/`. Guarde o arquivo em `backend/secrets/` (ignorado pelo Git).
   - `PORT` (opcional, padrão 3000) e `CORS_ORIGINS` (opcional, origens extras separadas por vírgula).

   Nunca versione o `.env` nem o JSON da conta de serviço.

3. Gere o Prisma Client e confira as migrações (não destrutivo):

   ```powershell
   npx prisma generate
   npx prisma migrate status
   npx prisma migrate deploy   # somente se houver migrações pendentes
   ```

4. Inicie o servidor:

   ```powershell
   npm run dev     # com recarga automática
   npm start       # sem recarga
   ```

   O servidor informa a URL no terminal (padrão `http://localhost:3000`). Todas as rotas `/equipments` exigem o cabeçalho `Authorization: Bearer <Firebase ID Token>`.

### Frontend

1. Abra a pasta `frontend/` no VS Code e inicie o Live Server na porta 5500.
2. Acesse `http://127.0.0.1:5500/login.html` (ou `http://localhost:5500/login.html`).
3. Não abra os arquivos HTML direto pelo `file://`: os módulos ES e o CORS não funcionam assim.
4. Se usar `127.0.0.1`, adicione esse domínio em Firebase Console > Authentication > Settings > Authorized domains.

A URL da API fica em `frontend/js/api.js` (`API_BASE_URL`).
