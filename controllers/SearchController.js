import LocationService from "../services/LocationService.js";
import CategoryService from "../services/CategoryService.js";

class SearchController {
  async search(req, res, next) {
    try {
      const q = req.query.q || "";
      if (!q.trim()) {
        return res.status(200).json({ locations: [], categories: [] });
      }

      const [locations, categories] = await Promise.all([
        LocationService.getAllLocations({ search: q }),
        CategoryService.getAllCategories({ search: q }),
      ]);

      return res.status(200).json({ locations, categories });
    } catch (err) {
      return next(err);
    }
  }
}

export default new SearchController();
