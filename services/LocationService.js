import mongoose from "mongoose";
import LocationRepository from "../repositories/LocationRepository.js";
import CategoryRepository from "../repositories/CategoryRepository.js";
import { generateSlug } from "../utils/slug.js";
import PageService from "./PageService.js";
import LocationSection from "../models/LocationSection.js";

const RECOMMENDATION_CONFIG = {
  W_CAT: 85.0,
  W_GEO: 15.0,
  GEO_SAME_STATE: 1.0,
  GEO_SAME_COUNTRY: 0.4,
  GEO_DIFF_COUNTRY: 0.0,
  STATE_CAP: 3,
  COUNTRY_CAP: 5,
};

class LocationService {
  getAllLocations(filters = {}, options = {}) {
    const query = {};
    if (filters.level) {
      query.level = filters.level;
    }
    if (filters.parentLocation !== undefined) {
      query.parentLocation = filters.parentLocation;
    }
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: "i" } },
        { shortDescription: { $regex: filters.search, $options: "i" } },
      ];
    }
    return LocationRepository.findAll(query, options);
  }

  async getLocationById(id) {
    const location = await LocationRepository.findById(id);
    if (!location) {
      this.throwError("Location not found", 404);
    }
    return location;
  }

  async getLocationBySlug(slug) {
    const location = await LocationRepository.findBySlug(slug);
    if (!location) {
      this.throwError("Location not found", 404);
    }
    return location;
  }

  async createLocation(data) {
    await this._ensureUniqueName(data.name);

    const slug = generateSlug(data.name);
    await this._ensureUniqueSlug(slug);
    data.slug = slug;

    await this.validateParentLocation(data.level, data.parentLocation);
    await this.validateCategories(data.categories);

    if (data.parentLocation === "") {
      data.parentLocation = null;
    }

    const location = await LocationRepository.create(data);

    try {
      await PageService.createPage({
        title: `${location.name} Landing Page`,
        slug: `location-${location.slug}`,
        type: "location",
        isActive: true,
        sections: [
          { type: "navbar", title: "Navbar Header", isVisible: true, order: 0 },
          { type: "hero-header", title: `${location.name} Banner`, isVisible: true, order: 1 },
          { type: "footer", title: "Footer layout", isVisible: true, order: 2 },
        ],
      });
    } catch (err) {
      console.warn("Failed to auto-create landing page for location:", err);
    }

    return location;
  }

  async updateLocation(id, data) {
    const location = await this.getLocationById(id);

    if (data.name && data.name.toLowerCase() !== location.name.toLowerCase()) {
      await this._ensureUniqueName(data.name);

      const newSlug = generateSlug(data.name);
      await this._ensureUniqueSlug(newSlug, id);
      data.slug = newSlug;
    }

    const currentLevel = data.level !== undefined ? data.level : location.level;
    let currentParent = data.parentLocation;
    if (currentParent === undefined) {
      currentParent = location.parentLocation;
    } else if (currentParent === "" || currentParent === null) {
      currentParent = null;
    }

    await this.validateParentLocation(currentLevel, currentParent, id);

    if (data.categories !== undefined) {
      await this.validateCategories(data.categories);
    }

    if (data.parentLocation === "") {
      data.parentLocation = null;
    }

    return LocationRepository.update(id, data);
  }

  async deleteLocation(id) {
    const location = await this.getLocationById(id);
    const result = await LocationRepository.delete(id);

    try {
      const page = await PageService.getPageBySlug(`location-${location.slug}`);
      if (page) {
        await PageService.deletePage(page._id);
      }
    } catch (err) {
      console.warn("Failed to auto-delete landing page for location:", err);
    }

    try {
      await LocationSection.updateMany(
        { locations: id },
        { $pull: { locations: id } }
      );
      await LocationSection.updateMany(
        { locations: { $size: 0 } },
        { $set: { isActive: false } }
      );
    } catch (err) {
      console.warn("Failed to pull location from location carousels on deletion:", err);
    }

    return result;
  }

  throwError(message, statusCode = 400) {
    const error = new Error(message);
    error.statusCode = statusCode;
    throw error;
  }

  async _ensureUniqueName(name) {
    const existing = await LocationRepository.findByName(name);
    if (existing) {
      this.throwError("A location with the same name already exists.");
    }
  }

  async _ensureUniqueSlug(slug, excludeId) {
    const existing = await LocationRepository.findBySlug(slug);
    if (existing && (!excludeId || existing._id.toString() !== excludeId)) {
      this.throwError("A location with the same slug already exists.");
    }
  }

  async _resolveTargetLocation(idOrSlug) {
    const isObjectId = mongoose.Types.ObjectId.isValid(idOrSlug);
    const targetLoc = isObjectId
      ? await LocationRepository.findById(idOrSlug)
      : await LocationRepository.findBySlug(idOrSlug);

    if (!targetLoc) {
      this.throwError("Location not found", 404);
    }
    return targetLoc;
  }

  _buildHierarchyResolver(allLocations) {
    const locationMap = new Map(allLocations.map((loc) => [loc._id.toString(), loc]));
    const hierarchyCache = new Map();

    const resolveHierarchyPath = (locId) => {
      let stateId = null;
      let countryId = null;
      let current = locationMap.get(locId.toString());

      while (current) {
        if (current.level === "state" && !stateId) {
          stateId = current._id.toString();
        }
        if (current.level === "country" && !countryId) {
          countryId = current._id.toString();
        }
        if (!current.parentLocation) {break;}
        current = locationMap.get(current.parentLocation.toString());
      }
      return { stateId, countryId };
    };

    const getCachedHierarchy = (locId) => {
      const idStr = locId.toString();
      if (!hierarchyCache.has(idStr)) {
        hierarchyCache.set(idStr, resolveHierarchyPath(locId));
      }
      return hierarchyCache.get(idStr);
    };

    return { getCachedHierarchy };
  }

  _scoreRelatedCandidates(allLocations, targetLoc, targetHierarchy, targetCats, targetCatsSize, getCachedHierarchy, includeCategoryScore) {
    return allLocations
      .filter((cand) => cand._id.toString() !== targetLoc._id.toString() && cand.level === "destination")
      .map((cand) => {
        const candHierarchy = getCachedHierarchy(cand._id);
        const candCats = cand.categories.map((c) => c.toString());
        const overlap = candCats.filter((c) => targetCats.has(c)).length;
        const catSimilarity = targetCatsSize > 0 ? (overlap / targetCatsSize) : 0.0;

        let geoScore = RECOMMENDATION_CONFIG.GEO_DIFF_COUNTRY;
        let isSameState = false;
        let isSameCountry = false;

        if (targetHierarchy.stateId && targetHierarchy.stateId === candHierarchy.stateId) {
          geoScore = RECOMMENDATION_CONFIG.GEO_SAME_STATE;
          isSameState = true;
          isSameCountry = true;
        } else if (targetHierarchy.countryId && targetHierarchy.countryId === candHierarchy.countryId) {
          geoScore = RECOMMENDATION_CONFIG.GEO_SAME_COUNTRY;
          isSameCountry = true;
        }

        const catComponent = includeCategoryScore ? catSimilarity * RECOMMENDATION_CONFIG.W_CAT : 0;
        const score = catComponent + (geoScore * RECOMMENDATION_CONFIG.W_GEO);

        return { location: cand, score, overlap, isSameState, isSameCountry };
      });
  }

  _sortRelatedCandidates(candidates) {
    return candidates.sort((a, b) => {
      if (Math.abs(b.score - a.score) > 0.0001) {return b.score - a.score;}
      if (b.overlap !== a.overlap) {return b.overlap - a.overlap;}
      if (a.isSameState !== b.isSameState) {return a.isSameState ? -1 : 1;}
      if (a.isSameCountry !== b.isSameCountry) {return a.isSameCountry ? -1 : 1;}
      const nameComp = a.location.name.localeCompare(b.location.name);
      if (nameComp !== 0) {return nameComp;}
      return a.location._id.toString().localeCompare(b.location._id.toString());
    });
  }

  _sortFallbackCandidates(candidates) {
    return candidates.sort((a, b) => {
      if (Math.abs(b.score - a.score) > 0.0001) {return b.score - a.score;}
      if (a.isSameState !== b.isSameState) {return a.isSameState ? -1 : 1;}
      if (a.isSameCountry !== b.isSameCountry) {return a.isSameCountry ? -1 : 1;}
      return a.location.name.localeCompare(b.location.name);
    });
  }

  _applyDiversityFilter(scoredCandidates, getCachedHierarchy) {
    const stateCounts = new Map();
    const countryCounts = new Map();
    const result = [];

    for (const item of scoredCandidates) {
      const candHierarchy = getCachedHierarchy(item.location._id);
      const stateId = candHierarchy.stateId || "stateless";
      const countryId = candHierarchy.countryId || "global";
      const currentStateCount = stateCounts.get(stateId) || 0;
      const currentCountryCount = countryCounts.get(countryId) || 0;

      if (
        currentStateCount < RECOMMENDATION_CONFIG.STATE_CAP &&
        currentCountryCount < RECOMMENDATION_CONFIG.COUNTRY_CAP
      ) {
        result.push(item.location);
        stateCounts.set(stateId, currentStateCount + 1);
        countryCounts.set(countryId, currentCountryCount + 1);
      }

      if (result.length >= 10) {break;}
    }

    return result;
  }

  _fillRemainingSlots(result, scoredCandidates) {
    if (result.length >= 10) {return result;}
    for (const item of scoredCandidates) {
      if (!result.some((r) => r._id.toString() === item.location._id.toString())) {
        result.push(item.location);
      }
      if (result.length >= 10) {break;}
    }
    return result;
  }

  async validateParentLocation(level, parentLocationId, currentLocationId = null) {
    if (
      parentLocationId &&
      currentLocationId &&
      parentLocationId.toString() === currentLocationId.toString()
    ) {
      this.throwError("A location cannot be its own parent");
    }

    if (level === "country") {
      if (parentLocationId) {
        this.throwError("A country cannot have a parent location");
      }
      return;
    }

    if (!parentLocationId) {
      if (level === "state") {
        this.throwError("A state must have a parent country location");
      }
      return;
    }

    const parentLocation = await LocationRepository.findById(parentLocationId);
    if (!parentLocation) {
      this.throwError("Parent location not found");
    }

    if (level === "state") {
      if (parentLocation.level !== "country") {
        this.throwError("A state's parent must be a country");
      }
    }

    if (level === "destination") {
      if (parentLocation.level !== "country" && parentLocation.level !== "state") {
        this.throwError("A destination's parent must be a country or a state");
      }
    }
  }

  async validateCategories(categoryIds) {
    if (!categoryIds || categoryIds.length === 0) {
      return;
    }

    const existingCategories = await CategoryRepository.findByIds(categoryIds);
    const existingIds = new Set(existingCategories.map((cat) => cat._id.toString()));

    const missingIds = categoryIds.filter((id) => !existingIds.has(id.toString()));
    if (missingIds.length > 0) {
      this.throwError("One or more selected categories do not exist.");
    }

    for (const cat of existingCategories) {
      if (!cat.appliesTo || !cat.appliesTo.includes("location")) {
        this.throwError(`Category "${cat.name}" does not apply to locations`);
      }
    }
  }

  async getRelatedLocations(idOrSlug) {
    const targetLoc = await this._resolveTargetLocation(idOrSlug);
    const allLocations = await LocationRepository.findAll({ isActive: true });
    const { getCachedHierarchy } = this._buildHierarchyResolver(allLocations);

    const targetHierarchy = getCachedHierarchy(targetLoc._id);
    const targetCats = new Set(targetLoc.categories.map((c) => c.toString()));
    const targetCatsSize = targetCats.size;

    const scored = this._scoreRelatedCandidates(allLocations, targetLoc, targetHierarchy, targetCats, targetCatsSize, getCachedHierarchy, true);
    this._sortRelatedCandidates(scored);

    let result = this._applyDiversityFilter(scored, getCachedHierarchy);
    result = this._fillRemainingSlots(result, scored);

    if (result.length === 0) {
      const fallbackScored = this._scoreRelatedCandidates(allLocations, targetLoc, targetHierarchy, new Set(), 0, getCachedHierarchy, false);
      this._sortFallbackCandidates(fallbackScored);
      result = this._applyDiversityFilter(fallbackScored, getCachedHierarchy);
      result = this._fillRemainingSlots(result, fallbackScored);
    }

    return result;
  }
}

export default new LocationService();
