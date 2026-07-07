import PackageSectionService from "../services/PackageSectionService.js";

class PackageSectionController {
  async getAll(req, res, next) {
    try {
      const filters = {};
      if (req.query.isActive !== undefined) {
        filters.isActive = req.query.isActive === "true";
      }
      const options = {
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder,
        showDeleted: req.query.showDeleted === "true",
      };
      const sections = await PackageSectionService.getAll(filters, options);
      res.status(200).json(sections);
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const section = await PackageSectionService.getById(id);
      res.status(200).json(section);
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const section = await PackageSectionService.create(req.body);
      res.status(201).json(section);
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const section = await PackageSectionService.update(id, req.body);
      res.status(200).json(section);
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      await PackageSectionService.delete(id);
      res.status(200).json({ success: true, message: "Package carousel section deleted successfully" });
    } catch (err) {
      next(err);
    }
  }
}

export default new PackageSectionController();
