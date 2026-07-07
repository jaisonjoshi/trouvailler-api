import LocationSectionRepository from "../repositories/LocationSectionRepository.js";
import LocationRepository from "../repositories/LocationRepository.js";

class LocationSectionService {
  getAllSections(filters = {}, options = {}) {
    return LocationSectionRepository.findAll(filters, options);
  }

  async getSectionById(id) {
    const section = await LocationSectionRepository.findById(id);
    if (!section) {
      this.throwError("Location Carousel not found", 404);
    }
    return section;
  }

  async createSection(data) {
    await this._ensureUniqueTitle(data.title);
    await this._ensureLocationsExist(data.locations);
    this._applyEmptyLocationsConstraint(data);

    return LocationSectionRepository.create(data);
  }

  async updateSection(id, data) {
    const section = await this.getSectionById(id);

    if (data.title && data.title.toLowerCase() !== section.title.toLowerCase()) {
      await this._ensureUniqueTitle(data.title);
    }

    if (data.locations) {
      await this._ensureLocationsExist(data.locations);
      this._applyEmptyLocationsConstraint(data);
    }

    return LocationSectionRepository.update(id, data);
  }

  async deleteSection(id) {
    await this.getSectionById(id);
    return LocationSectionRepository.delete(id);
  }

  throwError(message, statusCode = 400) {
    const error = new Error(message);
    error.statusCode = statusCode;
    throw error;
  }

  async _ensureUniqueTitle(title) {
    const existing = await LocationSectionRepository.findByTitle(title);
    if (existing) {
      this.throwError("A location carousel with the same title already exists.");
    }
  }

  _applyEmptyLocationsConstraint(data) {
    if (data.locations && data.locations.length === 0) {
      data.isActive = false;
    }
  }

  async _ensureLocationsExist(locationIds) {
    const results = await Promise.all(
      locationIds.map((id) => LocationRepository.findById(id)),
    );
    for (let i = 0; i < locationIds.length; i++) {
      if (!results[i]) {
        this.throwError(`Referenced location ID ${locationIds[i]} does not exist.`);
      }
    }
  }
}

export default new LocationSectionService();
