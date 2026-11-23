const fs = require("fs");
const path = require("path");
const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

// Carrega a credencial do arquivo apontado por GOOGLE_APPLICATION_CREDENTIALS.
// Caminhos relativos são resolvidos a partir da pasta backend/.
function loadServiceAccount() {
    const credentialPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!credentialPath) {
        throw new Error(
            "Variável GOOGLE_APPLICATION_CREDENTIALS não definida no arquivo .env."
        );
    }
    const absolutePath = path.resolve(__dirname, "..", credentialPath);
    if (!fs.existsSync(absolutePath)) {
        throw new Error(
            "Arquivo de credencial do Firebase Admin não encontrado em GOOGLE_APPLICATION_CREDENTIALS."
        );
    }
    try {
        return JSON.parse(fs.readFileSync(absolutePath, "utf8"));
    } catch (error) {
        throw new Error(
            "O arquivo de credencial do Firebase Admin não contém um JSON válido."
        );
    }
}

// A credencial só é carregada na primeira inicialização do Firebase Admin.
const firebaseApp = getApps().length
    ? getApps()[0]
    : initializeApp({
        credential: cert(loadServiceAccount())
    });

const firebaseAdminAuth = getAuth(firebaseApp);

module.exports = { firebaseAdminAuth };
