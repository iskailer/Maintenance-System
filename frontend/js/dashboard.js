import { signOut, onAuthStateChanged } from 
'https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js';
import {auth} from "./firebase.js";
import { apiRequest } from "./api.js";

const logoutButton = document.querySelector("#logoutButton");
const userInfo = document.querySelector("#userInfo");
const activeTotal = document.querySelector("#activesTotal");
const preventiveTotal = document.querySelector("#preventiveTotal");
const maintenanceEquipmentsTotal = document.querySelector("#maintenanceEquipmentsTotal");
const equipmentsTable = document.querySelector("#equipmentsTable");
const searchInput = document.getElementById("searchInput");
const searchForm = document.getElementById("searchForm");
const btnNewEquipment = document.getElementById("btnNewEquipment");
const modalElement = document.getElementById("equipmentModal");
const modal = new bootstrap.Modal(modalElement);
const btnSave = document.getElementById("btnSaveEquipment");
const equipmentName = document.getElementById("equipmentName");
const equipmentPatrimony = document.getElementById("equipmentPatrimony");
const pageAlert = document.getElementById("pageAlert");

// Estado único da tela, alimentado pela API.
let equipments = [];

const statusLabels = {
    active: "Ativo",
    maintenance: "Manutenção",
    preventive: "Preventiva",
    inactive: "Inativo"
};

function showAlert(message) {
    pageAlert.textContent = message;
    pageAlert.classList.remove("d-none");
}

function hideAlert() {
    pageAlert.textContent = "";
    pageAlert.classList.add("d-none");
}

// Sessão inválida: encerra a sessão local e volta para o login
// (evita loop de redirecionamento entre login e dashboard).
async function handleApiError(error) {
    if (error.status === 401) {
        await signOut(auth).catch(() => {});
        window.location.href = "../login.html";
        return;
    }
    console.error("Erro na API:", error);
    showAlert(error.message);
}

onAuthStateChanged(auth, async (user)=>{
    if(!user) {
        window.location.href = "../login.html";
        return;
    }
    userInfo.textContent = `Usuário: ${user.email}`;
    await loadEquipments();
});

logoutButton.addEventListener("click", async () =>{
    try {
        await signOut(auth);
        window.location.href = "../login.html";
    } catch (error) {
        console.error("Falha ao sair:",error.code);
        alert("Não foi possível encerrar a sessão. tente novamente.");
    }
});

// Calcula os indicadores a partir da lista carregada.
function dashboardRefresh() {
    const countByStatus = (status) =>
        equipments.filter(equipment => equipment.status === status).length;
    activeTotal.textContent = countByStatus("active");
    maintenanceEquipmentsTotal.textContent = countByStatus("maintenance");
    preventiveTotal.textContent = countByStatus("preventive");
}

function createCell(text) {
    const cell = document.createElement("td");
    cell.textContent = text;
    return cell;
}

function equipmentsTableRender(list) {
    equipmentsTable.innerHTML = "";
    list.forEach(equipment => {
        const row = document.createElement("tr");
        row.appendChild(createCell(equipment.name));
        row.appendChild(createCell(equipment.patrimony));
        row.appendChild(createCell(statusLabels[equipment.status] || equipment.status));

        const actionCell = document.createElement("td");
        const deleteButton = document.createElement("button");
        deleteButton.className = "btn btn-danger";
        deleteButton.textContent = "Excluir";
        deleteButton.dataset.id = equipment.id;
        actionCell.appendChild(deleteButton);
        row.appendChild(actionCell);

        equipmentsTable.appendChild(row);
    });
}

function applySearchFilter() {
    const term = searchInput.value.toLowerCase();
    const result = equipments.filter(equipment =>
        equipment.name.toLowerCase().includes(term));
    equipmentsTableRender(result);
}

searchInput.addEventListener("input", applySearchFilter);

// Evita o recarregamento da página ao pesquisar.
searchForm.addEventListener("submit", function (event) {
    event.preventDefault();
    applySearchFilter();
});

btnNewEquipment.addEventListener("click", function(){
    modal.show();
});

btnSave.addEventListener("click", async function(){
    const name = equipmentName.value.trim();
    const patrimony = equipmentPatrimony.value.trim();
    if (name === "" || patrimony === ""){
        alert("Informe o nome e o patrimônio do equipamento.");
        return;
    }
    try {
        await apiRequest("/equipments", {
            method: "POST",
            body: JSON.stringify({ name, patrimony, status: "active" })
        });
        modal.hide();
        equipmentName.value = "";
        equipmentPatrimony.value = "";
        await loadEquipments();
    } catch (error) {
        handleApiError(error);
    }
});

// Exclusão por delegação de eventos no corpo da tabela.
equipmentsTable.addEventListener("click", async function(event){
    const button = event.target.closest("button[data-id]");
    if (!button) {
        return;
    }
    try {
        await apiRequest(`/equipments/${button.dataset.id}`, { method: "DELETE" });
        await loadEquipments();
    } catch (error) {
        handleApiError(error);
    }
});

async function loadEquipments(){
    try {
        equipments = await apiRequest("/equipments");
        hideAlert();
        dashboardRefresh();
        applySearchFilter();
    } catch (error) {
        handleApiError(error);
    }
}
