import PackageService from "../services/PackageService.js";
import CloudinaryService from "../services/CloudinaryService.js";

class PackageController {
  async getAll(req, res, next) {
    try {
      const filters = {
        categories: req.query.categories
          ? Array.isArray(req.query.categories)
            ? req.query.categories
            : [req.query.categories]
          : undefined,
        mainLocation: req.query.mainLocation,
        locations: req.query.locations
          ? Array.isArray(req.query.locations)
            ? req.query.locations
            : [req.query.locations]
          : undefined,
        status: req.query.status,
        search: req.query.search,
      };
      const options = {
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder,
      };
      const packages = await PackageService.getAllPackages(filters, options);
      res.status(200).json(packages);
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const pkg = await PackageService.getPackageById(id);
      res.status(200).json(pkg);
    } catch (err) {
      next(err);
    }
  }

  async getBySlug(req, res, next) {
    try {
      const { slug } = req.params;
      const pkg = await PackageService.getPackageBySlug(slug);
      res.status(200).json(pkg);
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const newPackage = await PackageService.createPackage(req.body);
      res.status(201).json(newPackage);
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const updatedPackage = await PackageService.updatePackage(id, req.body);
      res.status(200).json(updatedPackage);
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      await PackageService.deletePackage(id);
      res
        .status(200)
        .json({ success: true, message: "Package successfully deleted" });
    } catch (err) {
      next(err);
    }
  }

  async deleteMedia(req, res, next) {
    try {
      const result = await CloudinaryService.deleteImages(req.body.urls);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}

export default new PackageController();
