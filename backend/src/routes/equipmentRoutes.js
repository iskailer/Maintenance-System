const express = require("express");
const router = express.Router();

const {
    getAllEquipments
} = require("../controllers/equipmentController");

router.get("/", getAllEquipments);
// router.get("/:id", getEquipment);
// router.delete("/:id", deleteEquipment);

module.exports = router;