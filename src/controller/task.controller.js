const { isValidDate } = require("../util");

class ContractController {
  constructor(contractService) {
    this.contractService = contractService;
    this.getContractById = this.getContractById.bind(this);
    this.getContractByUser = this.getContractByUser.bind(this);
    this.getUnPaidContracts = this.getUnPaidContracts.bind(this);
    this.payByJobId = this.payByJobId.bind(this);
    this.depositByUserId = this.depositByUserId.bind(this);
    this.getBestProfession = this.getBestProfession.bind(this);
    this.getBestClients = this.getBestClients.bind(this);
  }

  async getContractById(req, res) {
    try {
      const profileId = req.profile.id;
      const id = req.params.id;

      if (!profileId || !id) {
        return res
          .status(400)
          .json({ error: "Both profileId and id must be provided" });
      }

      const contract = await this.contractService.getContract(profileId, id);

      if (!contract) {
        return res.status(404).json({ error: "Contract not found" });
      }

      res.json(contract);
    } catch (err) {
      console.error("Error while calling the getContractById", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
  async getContractByUser(req, res) {
    try {
      const profileId = req.profile.id;
      if (!profileId) {
        return res
          .status(400)
          .json({ error: "Both profileId and id must be provided" });
      }
      const contract = await this.contractService.getUserContract(profileId);

      if (!contract) {
        return res.status(404).json({ error: "Contract not found" });
      }
      res.json(contract);
    } catch (err) {
      console.error("Error while calling the getContractByUser", err);
      res.status(500).json({ err: "Internal Server Error" });
    }
  }
  async getUnPaidContracts(req, res) {
    try {
      const profileId = req.profile.id;
      const contract = await this.contractService.getUnPaidContracts(profileId);
      if (!contract) {
        return res.status(404).json({ error: "Contract not found" });
      }
      res.json(contract);
    } catch (error) {
      console.error("Error while calling the getUnPaidContracts", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
  async payByJobId(req, res) {
    try {
      const result = await this.contractService.pay(
        req.profile.id,
        req.body.contractorId,
        req.params.job_id
      );
      res.json(result);
    } catch (error) {
      console.error("Error in payByJobId:", error);
      res.status(500).json({
        error: "An error occurred while processing the payment",
        message: error,
      });
    }
  }
  async depositByUserId(req, res) {
    try {
      const result = await this.contractService.deposit(req.params.userId, req.body.amount);
      res.send(result);
    } catch (error) {
      console.error("Error in depositByUserId:fdsfds", error.message);
      res.status(500).json({
        error: error.message,
      });
    }
  }
  async getBestProfession(req, res) {
    try {
      const { start, end } = req.query;
      if (!isValidDate(new Date(start)) || !isValidDate(new Date(end))) throw "Start or end date is invalid";
      const result = await this.contractService.getProfession(start, end);
      res.json(result);
    } catch (error) {
      console.error("Error in getBestProfession:", error);
      res.status(500).json({
        error: "An error occurred while processing the payment",
        message: error,
      });
    }
  }
  async getBestClients(req, res) {
    try {
      const { start, end } = req.query;
      if (!isValidDate(new Date(start)) || !isValidDate(new Date(end))) throw "Start or end date is invalid";
      const result = await this.contractService.getClients(start, end);
      res.json(result);
    } catch (error) {
      console.error("Error in getBestClients:", error);
      res.status(500).json({
        error: "An error occurred while fetching best clients.",
        message: error,
      });
    }
  }
}
module.exports = ContractController;