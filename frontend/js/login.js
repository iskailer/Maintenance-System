import { signInWithEmailAndPassword } from 
'https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js';
import { createUserWithEmailAndPassword } from 
'https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js';
import { sendPasswordResetEmail } from 
'https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js';
import { onAuthStateChanged } from 
'https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js';
import {auth} from "./firebase.js";

const loginForm = document.querySelector("#loginForm");
const emailInput = document.querySelector("#email");
const passwordInput = document.querySelector("#password");
const feedback = document.querySelector("#feedback");
const registerButton = document.querySelector("#registerButton");
const resetPasswordButton = document.querySelector("#resetPasswordButton");

// Mensagens em português para os códigos de erro do Firebase Authentication.
const authErrorMessages = {
    "auth/invalid-credential": "E-mail ou senha incorretos.",
    "auth/invalid-email": "E-mail inválido.",
    "auth/user-disabled": "Esta conta foi desativada.",
    "auth/email-already-in-use": "Este e-mail já está cadastrado.",
    "auth/weak-password": "A senha deve ter pelo menos 6 caracteres.",
    "auth/too-many-requests": "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
    "auth/network-request-failed": "Falha de conexão. Verifique sua internet."
};

function getAuthErrorMessage(error, fallback) {
    return authErrorMessages[error.code] || fallback;
}

// Usuário já autenticado é enviado direto ao dashboard.
onAuthStateChanged(auth, (user) => {
    if (user) {
        window.location.href = "./pages/dashboard.html";
    }
});

loginForm.addEventListener("submit", async (event)=> {
    event.preventDefault();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    feedback.textContent ="Validando acesso...";
    try{
        await signInWithEmailAndPassword(auth, email, password);
        window.location.href = "./pages/dashboard.html";
    } catch (error){
        console.error("Falha no login", error.code);
        feedback.textContent = getAuthErrorMessage(
            error,
            "Não foi possível entrar. Verifique suas credenciais e tente novamente."
        );
    }
});

registerButton.addEventListener("click", async() =>{
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    if(!email || !password){
        feedback.textContent = "Informe e-mail e senha para criar a conta!";
        return;
    }
    try {
        await createUserWithEmailAndPassword(auth, email, password);
        feedback.textContent ="Conta criada com sucesso.";
        window.location.href = "./pages/dashboard.html";
    } catch (error) {
        console.error("Falha no cadastro:", error.code);
        feedback.textContent = getAuthErrorMessage(
            error,
            "Não foi possível criar a conta. Verifique os dados informados."
        );
    }
});

resetPasswordButton.addEventListener("click", async() =>{
    const email = emailInput.value.trim();
    if(!email){
        feedback.textContent ="Informe seu e-mail para continuar.";
        return;
    }
    try {
        await sendPasswordResetEmail(auth,email);
        feedback.textContent ="Se o endereço de e-mail informado puder receber a recuperação, você receberá as instruções por e-mail!"
    } catch (error) {
        console.error("Falha na Recuperação:", error.code);
        feedback.textContent = getAuthErrorMessage(
            error,
            "Não foi possível solicitar a recuperação agora. Tente novamente!"
        );
    }
});
