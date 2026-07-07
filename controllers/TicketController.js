import TicketService from "../services/TicketService.js";

class TicketController {
  async getAll(req, res, next) {
    try {
      const filters = {
        status: req.query.status,
        search: req.query.search,
      };
      const options = {
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder,
      };
      const tickets = await TicketService.getAllTickets(filters, options);
      res.status(200).json(tickets);
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const ticket = await TicketService.getTicketById(id);
      res.status(200).json(ticket);
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const ticket = await TicketService.createTicket(req.body);
      res.status(201).json(ticket);
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const ticket = await TicketService.updateTicket(id, req.body);
      res.status(200).json(ticket);
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      await TicketService.deleteTicket(id);
      res.status(200).json({ message: "Ticket deleted successfully" });
    } catch (err) {
      next(err);
    }
  }
}

export default new TicketController();
