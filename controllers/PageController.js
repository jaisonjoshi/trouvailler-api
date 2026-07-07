import PageService from "../services/PageService.js";

class PageController {
  async getAll(req, res, next) {
    try {
      const filters = {};
      if (req.query.slug) {
        filters.slug = req.query.slug;
      }
      if (req.query.type) {
        if (req.query.type === "system") {
          filters.$or = [{ type: "system" }, { type: { $exists: false } }];
        } else {
          filters.type = req.query.type;
        }
      }
      const options = {
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder,
      };
      const pages = await PageService.getAllPages(filters, options);
      res.status(200).json(pages);
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const page = await PageService.getPageById(id);
      res.status(200).json(page);
    } catch (err) {
      next(err);
    }
  }

  async getPublishedBySlug(req, res, next) {
    try {
      const { slug } = req.params;
      const page = await PageService.getPublishedPageBySlug(slug);
      res.status(200).json(page);
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const page = await PageService.createPage(req.body);
      res.status(201).json(page);
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const page = await PageService.updatePage(id, req.body);
      res.status(200).json(page);
    } catch (err) {
      next(err);
    }
  }

  async updateBySlug(req, res, next) {
    try {
      const { slug } = req.params;
      const page = await PageService.updatePageBySlug(slug, req.body);
      res.status(200).json(page);
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      await PageService.deletePage(id);
      res.status(200).json({ success: true, message: "Page deleted successfully" });
    } catch (err) {
      next(err);
    }
  }
}

export default new PageController();
