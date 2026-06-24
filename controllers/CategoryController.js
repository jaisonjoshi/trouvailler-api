import CategoryService from "../services/CategoryService.js";

class CategoryController {
  async getAll(req, res, next) {
    try {
      const filters = {};
      const options = {
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder
      };
      const categories = await CategoryService.getAllCategories(filters, options);
      res.status(200).json(categories);
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const category = await CategoryService.getCategoryById(id);
      res.status(200).json(category);
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const newCategory = await CategoryService.createCategory(req.body);
      res.status(201).json(newCategory);
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const updatedCategory = await CategoryService.updateCategory(id, req.body);
      res.status(200).json(updatedCategory);
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      await CategoryService.deleteCategory(id);
      res.status(200).json({
        success: true,
        message: "Category deleted successfully"
      });
    } catch (err) {
      next(err);
    }
  }
}

export default new CategoryController();
