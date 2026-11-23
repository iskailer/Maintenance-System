const equipmentService = require("../services/equipmentService");

// Converte o parâmetro de rota em inteiro positivo; retorna null se inválido.
function parseId(value) {
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
}

function isBlank(value) {
    return typeof value !== "string" || value.trim() === "";
}

// Valida e filtra os campos permitidos (evita mass assignment).
// Em "partial" (PUT) os campos são opcionais, mas se enviados não podem ser vazios.
function buildEquipmentData(body, partial) {
    const source = body || {};
    const data = {};

    for (const field of ["name", "patrimony", "status"]) {
        if (source[field] === undefined) {
            if (!partial) {
                return { error: `O campo ${field} é obrigatório.` };
            }
            continue;
        }
        if (isBlank(source[field])) {
            return { error: `O campo ${field} deve ser um texto não vazio.` };
        }
        data[field] = source[field].trim();
    }

    if (source.acquisitionDate !== undefined && source.acquisitionDate !== null) {
        const date = new Date(source.acquisitionDate);
        if (Number.isNaN(date.getTime())) {
            return { error: "O campo acquisitionDate deve ser uma data válida." };
        }
        data.acquisitionDate = date;
    } else if (source.acquisitionDate === null) {
        data.acquisitionDate = null;
    }

    if (partial && Object.keys(data).length === 0) {
        return { error: "Informe ao menos um campo para atualizar." };
    }
    return { data };
}

// Traduz erros do Prisma em respostas HTTP em português.
function handlePrismaError(error, res, action) {
    if (error.code === "P2025") {
        return res.status(404).json({ message: "Equipamento não encontrado." });
    }
    if (error.code === "P2002") {
        return res.status(409).json({ message: "Já existe um equipamento com este patrimônio." });
    }
    console.error(`Erro ao ${action} equipamento: `, error);
    return res.status(500).json({ message: `Erro ao ${action} equipamento.` });
}

async function getAllEquipments(req, res) {
    try {
        const equipments = await equipmentService.getAllEquipments();
        res.json(equipments);
    } catch (error) {
        console.error("Erro ao buscar equipamentos: ", error);
        res.status(500).json({
            message: "Erro ao buscar equipamentos."
        });
    }
}

async function getEquipmentById(req, res) {
    const id = parseId(req.params.id);
    if (id === null) {
        return res.status(400).json({ message: "Identificador de equipamento inválido." });
    }
    try {
        const equipment = await equipmentService.getEquipmentById(id);
        if (!equipment) {
            return res.status(404).json({ message: "Equipamento não encontrado." });
        }
        res.json(equipment);
    } catch (error) {
        handlePrismaError(error, res, "buscar");
    }
}

async function createEquipment(req, res) {
    const { data, error } = buildEquipmentData(req.body, false);
    if (error) {
        return res.status(400).json({ message: error });
    }
    try {
        const equipment = await equipmentService.createEquipment(data);
        res.status(201).json(equipment);
    } catch (err) {
        handlePrismaError(err, res, "criar");
    }
}

async function updateEquipment(req, res) {
    const id = parseId(req.params.id);
    if (id === null) {
        return res.status(400).json({ message: "Identificador de equipamento inválido." });
    }
    const { data, error } = buildEquipmentData(req.body, true);
    if (error) {
        return res.status(400).json({ message: error });
    }
    try {
        const equipment = await equipmentService.updateEquipment(id, data);
        res.json(equipment);
    } catch (err) {
        handlePrismaError(err, res, "atualizar");
    }
}

async function deleteEquipment(req, res) {
    const id = parseId(req.params.id);
    if (id === null) {
        return res.status(400).json({ message: "Identificador de equipamento inválido." });
    }
    try {
        await equipmentService.deleteEquipment(id);
        res.status(204).send();
    } catch (error) {
        handlePrismaError(error, res, "excluir");
    }
}

module.exports = {
    getAllEquipments,
    getEquipmentById,
    createEquipment,
    updateEquipment,
    deleteEquipment
};
