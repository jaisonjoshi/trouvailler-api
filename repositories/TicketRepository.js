import Ticket from "../models/Ticket.js";

const ALLOWED_SORT_FIELDS = ["createdAt", "updatedAt", "name", "status", "email"];

class TicketRepository {
  findAll(filters = {}, options = {}) {
    const sortBy = ALLOWED_SORT_FIELDS.includes(options.sortBy) ? options.sortBy : "createdAt";
    const sortOrder = options.sortOrder === "asc" ? 1 : -1;

    const sortOption = {};
    sortOption[sortBy] = sortOrder;

    return Ticket.find(filters).sort(sortOption);
  }

  findById(id) {
    return Ticket.findById(id);
  }

  create(data) {
    const newTicket = new Ticket(data);
    return newTicket.save();
  }

  update(id, data) {
    return Ticket.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );
  }

  delete(id) {
    return Ticket.findByIdAndDelete(id);
  }
}

export default new TicketRepository();
