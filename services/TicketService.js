import TicketRepository from "../repositories/TicketRepository.js";

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

class TicketService {
  getAllTickets(filters = {}, options = {}) {
    const query = {};
    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.search) {
      const safe = escapeRegex(filters.search);
      query.$or = [
        { name: { $regex: safe, $options: "i" } },
        { email: { $regex: safe, $options: "i" } },
        { packageName: { $regex: safe, $options: "i" } },
      ];
    }
    return TicketRepository.findAll(query, options);
  }

  async getTicketById(id) {
    const ticket = await TicketRepository.findById(id);
    if (!ticket) {
      this.throwError("Ticket not found", 404);
    }
    return ticket;
  }

  createTicket(data) {
    return TicketRepository.create(data);
  }

  async updateTicket(id, data) {
    await this.getTicketById(id);
    return TicketRepository.update(id, data);
  }

  async deleteTicket(id) {
    await this.getTicketById(id);
    return TicketRepository.delete(id);
  }

  throwError(message, statusCode = 400) {
    const err = new Error(message);
    err.statusCode = statusCode;
    throw err;
  }
}

export default new TicketService();
