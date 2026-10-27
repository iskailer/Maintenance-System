import { signInWithEmailAndPassword } from 
'https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js';

import { createUserWithEmailAndPassword } from 
'https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js';

import { sendPasswordResetEmail } from 
'https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js';

import {auth} from "./firebase.js";

const loginForm = document.querySelector("#loginForm");
const emailInput = document.querySelector("#email");
const passwordInput = document.querySelector("#password");
const feedback = document.querySelector("#feedback");
const registerButton = document.querySelector("#registerButton");
const resetPasswordButton = document.querySelector("#resetPasswordButton");

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

        feedback,textContent = "Não foi possivel entrar. Verifique suas credencias e tente novamente.";
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
        feedback.textContent = "Não foi possível criar a conta. Verifique os dados informados."

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
        feedback.textContent = "Não foi possível solicitar a recuperação agora. Tente novamente!";
    }
});