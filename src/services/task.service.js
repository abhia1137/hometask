const { Op } = require("@sequelize/core");
const { ContractStatus } = require("../enum/Contract");
const { sequelize } = require("../model");

class ContractService {
  constructor(models) {
    this.Contract = models.Contract;
    this.Job = models.Job;
    this.Profile = models.Profile;
  }

  async getContract(profileId = "", id = "") {
    try {
      const contract = await this.Contract.findOne({
        where: {
          ContractorId: id,
          [Op.or]: {
            ClientId: profileId,
          },
        },
      });
      return contract;
    } catch (error) {
      console.error("Error fetching contract:", error);
      throw new Error("Failed to fetch contract");
    }
  }
  async getUserContract(profileId) {
    try {
      const contracts = await this.Contract.findAll({
        where: {
          [Op.or]: {
            ClientId: profileId,
            ContractorId: profileId,
          },
          [Op.not]: {
            status: ContractStatus.TERMINATED,
          },
        },
      });
      return contracts;
    } catch (error) {
      console.error("Error fetching user contracts:", error);
      throw error;
    }
  }
  async getUnPaidContracts(profileId) {
    try {
      const contract = await this.Contract.findAll({
        where: {
          [Op.and]: [
            {
              [Op.or]: [{ ClientId: profileId }, { ContractorId: profileId }],
            },
            { status: { [Op.ne]: ContractStatus.TERMINATED } },
          ],
        },
        include: [
          {
            model: this.Job,
            as: "Jobs",
            where: { paid: null },
          },
        ],
        attributes: ["id", "terms", "status"],
      });
      return contract;
    } catch (err) {
      console.error("Error fetching getUnPaidContracts:", err);
      throw new Error("Failed to fetch getUnPaidContracts");
    }
  }
  async pay(clientId, contractorId, JobId) {
    const t = await sequelize.transaction();
    try {
      const job = await this.Job.findOne(
        {
          where: { id: JobId },
          attributes: ["price"],
        },
        { transaction: t }
      );
      const clientProfile = await this.Profile.findOne({
        where: { id: clientId },
      });
      if (!clientProfile) {
        throw `Client with id ${clientId} not found`;
      }

      if (clientProfile.balance < job.price) {
        throw "Insufficient balance";
      }
      await this.Profile.increment("balance", {
        by: -job.price,
        where: { id: clientId },
        transaction: t,
      });
      await this.Profile.increment("balance", {
        by: Math.abs(job.price),
        where: { id: contractorId },
        transaction: t,
      });
      t.commit();
      return { message: "Payment Successfully Completed" };
    } catch (err) {
      t.rollback();
      console.error("Error in pay:", err);
      throw err;
    }
  }
  async getClients(startDate, endDate) {
    try {
      const results = await this.Job.findAll({
        where: {
          createdAt: {
            [Op.gte]: new Date(startDate),
            [Op.lte]: new Date(endDate),
          },
        },
        attributes: [
          "id",
          [sequelize.fn("sum", sequelize.col("price")), "paid"],
          [sequelize.literal('firstName || " " || lastName'), "fullName"],
        ],
        include: [
          {
            model: this.Contract,
            as: "Contract",
            attributes: [],
            include: [
              {
                model: this.Profile,
                as: "Client",
              },
            ],
          },
        ],
        group: ["Contract.ClientId"],
        order: [[sequelize.fn("sum", sequelize.col("Job.price")), "DESC"]],
        limit: 2,
      });
      return results;
    } catch (error) {
      console.error("Error in getClients:", error);
      throw error;
    }
  }
  async getProfession(startDate, endDate) {
    try {
      const result = await this.Job.findOne({
        attributes: [
          ["description", "Description"],
          [sequelize.fn("sum", sequelize.col("price")), "Total"],
          ["paymentDate", "Payment Date"],
          ["ContractId", "Contract Id"],
        ],
        where: {
          createdAt: {
            [Op.gte]: new Date(startDate),
            [Op.lte]: new Date(endDate),
          },
          [Op.not]: {
            price: null,
          },
        },
        group: ["description"],
        order: [["price", "DESC"]],
        limit: 1,
      });
      return result;
    } catch (error) {
      console.error("Error in getClients:", error);
      throw error;
    }
  }
  async deposit(userId, amount) {
    const t = await sequelize.transaction();
    try {
      const contractIds = await this.Contract.findAll(
        {
          attributes: ["id"],
          where: {
            clientId: userId,
          },
        },
        { transaction: t }
      );
      const userIds = contractIds.map((record) => record.id);

      const result = await this.Job.findOne(
        {
          attributes: [[sequelize.fn("sum", sequelize.col("price")), "Total"]],
          where: {
            contractId: userIds,
          },
        },
        { transaction: t }
      );
      const amountCanDepost = result.dataValues.Total * 0.25;
      if (amount > amountCanDepost) {
        throw (
          "Can not submit more then 25% of the total jobs amount, Max amount can be submitted: " +
          amountCanDepost
        );
      }
      await this.Profile.increment(
        "balance",
        {
          by: amount,
          where: { id: userId },
        },
        { transaction: t }
      );
      t.commit();
      return { message: "Funds Successfully Added" };
    } catch (error) {
      t.rollback();
      console.error("Error deposit amount:", error);
      throw new Error(error);
    }
  }
}

module.exports = ContractService;
