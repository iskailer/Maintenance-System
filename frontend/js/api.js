import { auth } from "./firebase.js";

// URL base da API: único local onde ela é definida no frontend.
export const API_BASE_URL = "http://localhost:3000";

// Erro de requisição com status HTTP e mensagem em português.
export class ApiError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

const defaultMessages = {
    400: "Dados inválidos. Verifique as informações e tente novamente.",
    401: "Sessão inválida ou expirada. Faça login novamente.",
    403: "Você não tem permissão para realizar esta ação.",
    404: "Recurso não encontrado.",
    409: "Já existe um registro com estes dados.",
    500: "Erro interno do servidor. Tente novamente mais tarde."
};

// Envia a requisição com o Firebase ID Token no cabeçalho Authorization.
export async function apiRequest(path, options = {}) {
    const currentUser = auth.currentUser;
    if (!currentUser) {
        throw new ApiError(401, defaultMessages[401]);
    }
    const idToken = await currentUser.getIdToken();

    let response;
    try {
        response = await fetch(`${API_BASE_URL}${path}`, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...options.headers,
                Authorization: `Bearer ${idToken}`
            }
        });
    } catch (error) {
        throw new ApiError(0, "Não foi possível conectar ao servidor. Verifique se o backend está em execução.");
    }

    if (!response.ok) {
        let serverMessage;
        try {
            serverMessage = (await response.json()).message;
        } catch (error) {
            serverMessage = undefined;
        }
        throw new ApiError(
            response.status,
            serverMessage || defaultMessages[response.status] || defaultMessages[500]
        );
    }

    if (response.status === 204) {
        return null;
    }
    return response.json();
}
