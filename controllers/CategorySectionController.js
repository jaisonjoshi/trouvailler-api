import CategorySectionService from "../services/CategorySectionService.js";

class CategorySectionController {
  async getAll(req, res, next) {
    try {
      const filters = {};
      if (req.query.isActive !== undefined) {
        filters.isActive = req.query.isActive === "true";
      }

      const options = {
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder,
      };

      const sections = await CategorySectionService.getAllSections(filters, options);
      res.status(200).json(sections);
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const section = await CategorySectionService.getSectionById(id);
      res.status(200).json(section);
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const newSection = await CategorySectionService.createSection(req.body);
      res.status(201).json(newSection);
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const updatedSection = await CategorySectionService.updateSection(id, req.body);
      res.status(200).json(updatedSection);
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      await CategorySectionService.deleteSection(id);
      res.status(200).json({ success: true, message: "Category Carousel deleted successfully." });
    } catch (err) {
      next(err);
    }
  }
}

export default new CategorySectionController();
