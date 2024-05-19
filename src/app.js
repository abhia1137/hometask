const express = require("express");
const bodyParser = require("body-parser");
const { sequelize } = require("./model");
const { getProfile } = require("./middleware/getProfile");
const app = express();
const ContractController = require("./controller/task.controller");
const ContractService = require("./services/task.service");
const models = require("../src/model");
const cors = require('cors');

app.use(bodyParser.json());
app.set("sequelize", sequelize);
app.set("models", sequelize.models);
const corsOptions = {
  origin: "http://localhost:3002",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  allowedHeaders: ["Content-Type", "Authorization", "profile_id"], // Add 'profile_id' here
};

app.use(cors(corsOptions));

const contractService = new ContractService(models);
const contractController = new ContractController(contractService);

app.get("/contracts/:id", getProfile, contractController.getContractById);

app.get("/contracts", getProfile, contractController.getContractByUser);

app.get("/jobs/unpaid", getProfile, contractController.getUnPaidContracts);

app.post("/jobs/:job_id/pay", getProfile, contractController.payByJobId);

app.post("/balances/deposit/:userId",getProfile,contractController.depositByUserId);

app.get("/admin/best-profession",getProfile,contractController.getBestProfession);

app.get("/admin/best-clients", contractController.getBestClients);

module.exports = app;
