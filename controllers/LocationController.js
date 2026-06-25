import LocationService from "../services/LocationService.js";

class LocationController {
  async getAll(req, res, next) {
    try {
      const filters = {};
      if (req.query.level) {
        filters.level = req.query.level;
      }
      if (req.query.parentLocation) {
        filters.parentLocation = req.query.parentLocation === "null" ? null : req.query.parentLocation;
      }
      if (req.query.search) {
        filters.search = req.query.search;
      }
      const options = {
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder
      };
      const locations = await LocationService.getAllLocations(filters, options);
      res.status(200).json(locations);
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const location = await LocationService.getLocationById(id);
      res.status(200).json(location);
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const newLocation = await LocationService.createLocation(req.body);
      res.status(201).json(newLocation);
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const updatedLocation = await LocationService.updateLocation(id, req.body);
      res.status(200).json(updatedLocation);
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      await LocationService.deleteLocation(id);
      res.status(200).json({
        success: true,
        message: "Location deleted successfully"
      });
    } catch (err) {
      next(err);
    }
  }
}

export default new LocationController();
