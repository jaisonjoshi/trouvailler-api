import PageRepository from "../repositories/PageRepository.js";
import PageService from "./PageService.js";

const HOME_SECTIONS = [
  { type: "navbar", title: "Navbar Header", isVisible: true, order: 0 },
  { type: "hero-header", title: "Hero Header Banner", isVisible: true, order: 1 },
  { type: "footer", title: "Footer layout", isVisible: true, order: 2 },
];

class BootstrapService {
  async run() {
    await this.ensureHomePageExists();
  }

  async ensureHomePageExists() {
    const existing = await PageRepository.findBySlug("home");
    if (existing) {
      return;
    }

    await PageService.createPage({
      title: "Home Page",
      slug: "home",
      isActive: true,
      type: "system",
      sections: HOME_SECTIONS,
    });
  }
}

export default new BootstrapService();
