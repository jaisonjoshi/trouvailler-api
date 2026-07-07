import Page from "../models/Page.js";

class PageRepository {
  findAll(filters = {}, options = {}) {
    const sortBy = options.sortBy || "createdAt";
    const sortOrder = options.sortOrder === "asc" ? 1 : -1;

    const sortOption = {};
    sortOption[sortBy] = sortOrder;

    const query = { isDeleted: { $ne: true } };
    Object.assign(query, filters);

    return Page.find(query).sort(sortOption);
  }

  findById(id, includeDeleted = false) {
    const query = { _id: id };
    if (!includeDeleted) {
      query.isDeleted = { $ne: true };
    }
    return Page.findOne(query);
  }

  findBySlug(slug, includeDeleted = false) {
    const query = { slug: slug.toLowerCase() };
    if (!includeDeleted) {
      query.isDeleted = { $ne: true };
    }
    return Page.findOne(query);
  }

  create(data) {
    const newPage = new Page(data);
    return newPage.save();
  }

  update(id, data) {
    return Page.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      { $set: data },
      { new: true, runValidators: true },
    );
  }

  delete(id) {
    return Page.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      { $set: { isDeleted: true } },
      { new: true },
    );
  }
}

export default new PageRepository();
