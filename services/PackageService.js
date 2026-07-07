import mongoose from "mongoose";
import PackageRepository from "../repositories/PackageRepository.js";
import LocationRepository from "../repositories/LocationRepository.js";
import CategoryRepository from "../repositories/CategoryRepository.js";
import { createPackageSchema, updatePackageSchema } from "../validation/PackageValidation.js";
import { generateSlug } from "../utils/slug.js";
import PackageSection from "../models/PackageSection.js";

const PACKAGE_RECO_CONFIG = Object.freeze({
  W_CAT: 40.0,
  W_LOC: 40.0,
  W_DUR: 10.0,
  W_PRICE: 10.0,
  W_ITINERARY: 0.7,
  W_HIERARCHY: 0.3,
  GEO_SAME_DEST: 1.0,
  GEO_SAME_STATE: 0.8,
  GEO_SAME_COUNTRY: 0.1,
  DUR_WEEKEND: 3,
  DUR_SHORT: 6,
  DUR_MEDIUM: 10,
  PRICE_BUDGET: 20000,
  PRICE_STANDARD: 75000,
  PRICE_PREMIUM: 200000,
  STATE_CAP: 3,
  LOCATION_CAP: 3,
});

class PackageService {
  async getAllPackages(filters = {}, options = {}) {
    const query = {};
    if (filters.categories && Array.isArray(filters.categories) && filters.categories.length > 0) {
      query.categories = { $in: filters.categories };
    }
    const targetLoc = filters.mainLocation;
    if (targetLoc) {
      query.$or = [
        { mainLocation: targetLoc },
        { locations: targetLoc }
      ];
    }
    if (filters.locations) {
      query.locations = {
        $in: Array.isArray(filters.locations) ? filters.locations : [filters.locations],
      };
    }
    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.minPrice || filters.maxPrice) {
      query.price = {};
      if (filters.minPrice !== undefined) {query.price.$gte = Number(filters.minPrice);}
      if (filters.maxPrice !== undefined) {query.price.$lte = Number(filters.maxPrice);}
    }
    if (filters.minDays || filters.maxDays) {
      query.days = {};
      if (filters.minDays !== undefined) {query.days.$gte = Number(filters.minDays);}
      if (filters.maxDays !== undefined) {query.days.$lte = Number(filters.maxDays);}
    }
    if (filters.search) {
      query.title = { $regex: filters.search, $options: "i" };
    }
    
    const packages = await PackageRepository.findAll(query, options);
    
    if (targetLoc) {
      packages.sort((a, b) => {
        const aIsPrimary = a.mainLocation && a.mainLocation.toString() === targetLoc.toString();
        const bIsPrimary = b.mainLocation && b.mainLocation.toString() === targetLoc.toString();
        if (aIsPrimary && !bIsPrimary) {return -1;}
        if (!aIsPrimary && bIsPrimary) {return 1;}
        return 0;
      });
    }
    
    return packages;
  }

  async getPackageById(id) {
    const pkg = await PackageRepository.findById(id);
    if (!pkg) {
      this.throwError("Package not found", 404);
    }
    return pkg;
  }

  async getPackageBySlug(slug) {
    const pkg = await PackageRepository.findBySlug(slug);
    if (!pkg) {
      this.throwError("Package not found", 404);
    }
    return pkg;
  }

  async createPackage(data) {
    const validatedData = createPackageSchema.parse(data);

    this.validateMainLocation(validatedData.mainLocation, validatedData.locations);
    await this.validateReferencedLocations(validatedData.mainLocation, validatedData.locations);

    if (validatedData.categories && validatedData.categories.length > 0) {
      await this.validateReferencedCategories(validatedData.categories);
    }

    const slug = generateSlug(validatedData.title);
    await this._ensureUniqueSlug(slug);
    validatedData.slug = slug;

    return PackageRepository.create(validatedData);
  }

  async updatePackage(id, data) {
    const validatedData = updatePackageSchema.parse(data);
    const pkg = await this.getPackageById(id);

    const finalMainLocation =
      validatedData.mainLocation !== undefined ? validatedData.mainLocation : pkg.mainLocation;
    const finalLocations =
      validatedData.locations !== undefined ? validatedData.locations : pkg.locations;

    this.validateMainLocation(finalMainLocation, finalLocations);

    if (validatedData.mainLocation !== undefined || validatedData.locations !== undefined) {
      await this.validateReferencedLocations(finalMainLocation, finalLocations);
    }

    if (validatedData.categories !== undefined && validatedData.categories.length > 0) {
      await this.validateReferencedCategories(validatedData.categories);
    }

    if (
      validatedData.title !== undefined &&
      validatedData.title.toLowerCase() !== pkg.title.toLowerCase()
    ) {
      const slug = generateSlug(validatedData.title);
      await this._ensureUniqueSlug(slug, id);
      validatedData.slug = slug;
    }

    return PackageRepository.update(id, validatedData);
  }

  async deletePackage(id) {
    await this.getPackageById(id);
    const result = await PackageRepository.delete(id);

    // Pull the deleted package ID from all sections
    await PackageSection.updateMany(
      { packages: id },
      { $pull: { packages: id } }
    );

    // Deactivate sections that have no packages left
    await PackageSection.updateMany(
      { packages: { $size: 0 } },
      { $set: { isActive: false } }
    );

    return result;
  }

  throwError(message, statusCode = 400) {
    const error = new Error(message);
    error.statusCode = statusCode;
    throw error;
  }

  async _ensureUniqueSlug(slug, excludeId) {
    const existing = await PackageRepository.findBySlug(slug);
    if (existing && (!excludeId || existing._id.toString() !== excludeId)) {
      this.throwError("A package with the same title already exists.");
    }
  }

  async _resolveTargetPackage(idOrSlug) {
    const isObjectId = mongoose.Types.ObjectId.isValid(idOrSlug);
    const targetPkg = isObjectId
      ? await PackageRepository.findById(idOrSlug)
      : await PackageRepository.findBySlug(idOrSlug);

    if (!targetPkg) {
      this.throwError("Package not found", 404);
    }
    return targetPkg;
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

  _getDurationBand(days) {
    if (days <= PACKAGE_RECO_CONFIG.DUR_WEEKEND) {return "WEEKEND";}
    if (days <= PACKAGE_RECO_CONFIG.DUR_SHORT) {return "SHORT";}
    if (days <= PACKAGE_RECO_CONFIG.DUR_MEDIUM) {return "MEDIUM";}
    return "LONG";
  }

  _getPriceBand(price) {
    if (price <= PACKAGE_RECO_CONFIG.PRICE_BUDGET) {return "BUDGET";}
    if (price <= PACKAGE_RECO_CONFIG.PRICE_STANDARD) {return "STANDARD";}
    if (price <= PACKAGE_RECO_CONFIG.PRICE_PREMIUM) {return "PREMIUM";}
    return "LUXURY";
  }

  _scoreRelatedPackages(allPackages, targetPkg, targetHierarchy, targetCats, targetCatsSize, targetLocs, targetLocsSize, targetDurBand, targetPriceBand, getCachedHierarchy) {
    return allPackages
      .filter((p) => p._id.toString() !== targetPkg._id.toString())
      .map((cand) => {
        const candCats = cand.categories.map((c) => c.toString());
        const catOverlap = candCats.filter((c) => targetCats.has(c)).length;
        const catSimilarity = targetCatsSize > 0 ? (catOverlap / targetCatsSize) : 0.0;

        const candLocs = [cand.mainLocation?.toString(), ...(cand.locations || []).map((l) => l.toString())].filter(Boolean);
        const locOverlap = candLocs.filter((l) => targetLocs.has(l)).length;
        const itinerarySimilarity = targetLocsSize > 0 ? (locOverlap / targetLocsSize) : 0.0;

        let hierarchyScore = 0.0;
        let isSameState = false;
        let isSameCountry = false;

        if (cand.mainLocation && targetPkg.mainLocation) {
          const candHierarchy = getCachedHierarchy(cand.mainLocation);
          if (targetPkg.mainLocation.toString() === cand.mainLocation.toString()) {
            hierarchyScore = PACKAGE_RECO_CONFIG.GEO_SAME_DEST;
            isSameState = true;
            isSameCountry = true;
          } else if (targetHierarchy.stateId && targetHierarchy.stateId === candHierarchy.stateId) {
            hierarchyScore = PACKAGE_RECO_CONFIG.GEO_SAME_STATE;
            isSameState = true;
            isSameCountry = true;
          } else if (targetHierarchy.countryId && targetHierarchy.countryId === candHierarchy.countryId) {
            hierarchyScore = PACKAGE_RECO_CONFIG.GEO_SAME_COUNTRY;
            isSameCountry = true;
          }
        }

        const geoSimilarity = (itinerarySimilarity * PACKAGE_RECO_CONFIG.W_ITINERARY) + (hierarchyScore * PACKAGE_RECO_CONFIG.W_HIERARCHY);

        const candDurBand = this._getDurationBand(cand.days);
        const durSimilarity = (candDurBand === targetDurBand) ? 1.0 : 0.0;

        const candPriceBand = this._getPriceBand(cand.price);
        const priceSimilarity = (candPriceBand === targetPriceBand) ? 1.0 : 0.0;

        const score = (catSimilarity * PACKAGE_RECO_CONFIG.W_CAT) +
                      (geoSimilarity * PACKAGE_RECO_CONFIG.W_LOC) +
                      (durSimilarity * PACKAGE_RECO_CONFIG.W_DUR) +
                      (priceSimilarity * PACKAGE_RECO_CONFIG.W_PRICE);

        return {
          pkg: cand,
          score,
          catSimilarity,
          geoSimilarity,
          overlap: catOverlap,
          locOverlap,
          isSameState,
          isSameCountry,
        };
      });
  }

  _sortRelatedPackages(candidates) {
    return candidates.sort((a, b) => {
      if (Math.abs(b.score - a.score) > 0.0001) {return b.score - a.score;}
      if (b.catSimilarity !== a.catSimilarity) {return b.catSimilarity - a.catSimilarity;}
      if (b.locOverlap !== a.locOverlap) {return b.locOverlap - a.locOverlap;}
      const titleComp = a.pkg.title.localeCompare(b.pkg.title);
      if (titleComp !== 0) {return titleComp;}
      return a.pkg._id.toString().localeCompare(b.pkg._id.toString());
    });
  }

  _sortFallbackPackages(candidates) {
    return candidates.sort((a, b) => {
      if (Math.abs(b.score - a.score) > 0.0001) {return b.score - a.score;}
      return a.pkg.title.localeCompare(b.pkg.title);
    });
  }

  _applyPackageDiversityFilter(scoredCandidates, getCachedHierarchy) {
    const stateCounts = new Map();
    const locationCounts = new Map();
    const result = [];

    for (const item of scoredCandidates) {
      const mainLocId = item.pkg.mainLocation ? item.pkg.mainLocation.toString() : "none";
      const candHierarchy = item.pkg.mainLocation ? getCachedHierarchy(item.pkg.mainLocation) : { stateId: "stateless" };
      const stateId = candHierarchy.stateId || "stateless";
      const currentStateCount = stateCounts.get(stateId) || 0;
      const currentLocationCount = locationCounts.get(mainLocId) || 0;

      if (
        currentStateCount < PACKAGE_RECO_CONFIG.STATE_CAP &&
        currentLocationCount < PACKAGE_RECO_CONFIG.LOCATION_CAP
      ) {
        result.push(item.pkg);
        stateCounts.set(stateId, currentStateCount + 1);
        locationCounts.set(mainLocId, currentLocationCount + 1);
      }

      if (result.length >= 10) {break;}
    }

    return result;
  }

  _fillRemainingPackageSlots(result, scoredCandidates) {
    if (result.length >= 10) {return result;}
    for (const item of scoredCandidates) {
      if (!result.some((r) => r._id.toString() === item.pkg._id.toString())) {
        result.push(item.pkg);
      }
      if (result.length >= 10) {break;}
    }
    return result;
  }

  _generateFallbackRecommendations(allPackages, targetPkg, targetDurBand, targetPriceBand, getCachedHierarchy) {
    const fallbackScored = allPackages
      .filter((p) => p._id.toString() !== targetPkg._id.toString())
      .map((p) => {
        const candDurBand = this._getDurationBand(p.days);
        const candPriceBand = this._getPriceBand(p.price);
        const durSimilarity = (candDurBand === targetDurBand) ? 1.0 : 0.0;
        const priceSimilarity = (candPriceBand === targetPriceBand) ? 1.0 : 0.0;
        const score = (durSimilarity * PACKAGE_RECO_CONFIG.W_DUR) + (priceSimilarity * PACKAGE_RECO_CONFIG.W_PRICE);

        return { pkg: p, score, catSimilarity: 0.0, locOverlap: 0, isSameState: false, isSameCountry: false };
      });

    this._sortFallbackPackages(fallbackScored);

    let result = this._applyPackageDiversityFilter(fallbackScored, getCachedHierarchy);
    result = this._fillRemainingPackageSlots(result, fallbackScored);
    return result;
  }

  validateMainLocation(mainLocation, locations) {
    const locationsStr = locations.map((loc) => loc.toString());
    if (!locationsStr.includes(mainLocation.toString())) {
      this.throwError(
        "Primary destination (mainLocation) must be included in the destinations covered (locations) array",
      );
    }
  }

  async validateReferencedLocations(mainLocation, locations) {
    const allIds = [mainLocation.toString(), ...locations.map((loc) => loc.toString())];
    const uniqueIds = [...new Set(allIds)];
    const existingLocations = await LocationRepository.findByIds(uniqueIds);
    const existingIds = new Set(existingLocations.map((loc) => loc._id.toString()));

    const missingIds = uniqueIds.filter((id) => !existingIds.has(id));
    if (missingIds.length > 0) {
      if (missingIds.includes(mainLocation.toString())) {
        this.throwError("Selected primary location does not exist.");
      }
      this.throwError("One or more selected locations do not exist.");
    }
  }

  async validateReferencedCategories(categories) {
    const existingCategories = await CategoryRepository.findByIds(categories);
    const existingIds = new Set(existingCategories.map((cat) => cat._id.toString()));

    const missingIds = categories.filter((id) => !existingIds.has(id.toString()));
    if (missingIds.length > 0) {
      this.throwError("One or more selected categories do not exist.");
    }

    for (const cat of existingCategories) {
      if (!cat.appliesTo || !cat.appliesTo.includes("package")) {
        this.throwError(`Category "${cat.name}" does not apply to packages`);
      }
    }
  }

  async getRelatedPackages(idOrSlug) {
    const targetPkg = await this._resolveTargetPackage(idOrSlug);
    const allLocations = await LocationRepository.findAll({ isActive: true });
    const { getCachedHierarchy } = this._buildHierarchyResolver(allLocations);

    const targetHierarchy = targetPkg.mainLocation
      ? getCachedHierarchy(targetPkg.mainLocation)
      : { stateId: null, countryId: null };

    const targetCats = new Set(targetPkg.categories.map((c) => c.toString()));
    const targetCatsSize = targetCats.size;
    const targetLocs = new Set(
      [targetPkg.mainLocation?.toString(), ...(targetPkg.locations || []).map((l) => l.toString())].filter(Boolean),
    );
    const targetLocsSize = targetLocs.size;
    const targetDurBand = this._getDurationBand(targetPkg.days);
    const targetPriceBand = this._getPriceBand(targetPkg.price);

    const allPackages = await PackageRepository.findAll({ status: "published" });

    const scored = this._scoreRelatedPackages(
      allPackages, targetPkg, targetHierarchy,
      targetCats, targetCatsSize, targetLocs, targetLocsSize,
      targetDurBand, targetPriceBand, getCachedHierarchy,
    );
    this._sortRelatedPackages(scored);

    let result = this._applyPackageDiversityFilter(scored, getCachedHierarchy);
    result = this._fillRemainingPackageSlots(result, scored);

    if (result.length === 0) {
      result = this._generateFallbackRecommendations(allPackages, targetPkg, targetDurBand, targetPriceBand, getCachedHierarchy);
    }

    return result;
  }
}

export default new PackageService();
