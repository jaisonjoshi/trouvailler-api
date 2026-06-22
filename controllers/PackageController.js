import PackageService from "../services/PackageService.js";

class PackageController {
  async getAll(req, res, next) {
    try {
      const filters = {
        destinationId: req.query.destinationId,
        category: req.query.category,
        search: req.query.search
      };
      const packages = await PackageService.getAllPackages(filters);
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
      res.status(200).json({ success: true, message: "Package successfully deleted" });
    } catch (err) {
      next(err);
    }
  }
}

export default new PackageController();
