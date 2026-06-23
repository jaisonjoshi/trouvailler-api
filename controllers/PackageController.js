import PackageService from "../services/PackageService.js";
import crypto from "crypto";

class PackageController {
  async getAll(req, res, next) {
    try {
      const filters = {
        destinationId: req.query.destinationId,
        category: req.query.category,
        search: req.query.search
      };
      const options = {
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder
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

  async deleteMedia(req, res, next) {
    try {
      const { urls } = req.body;
      if (!urls || !Array.isArray(urls) || urls.length === 0) {
        return res.status(400).json({ success: false, message: "urls (array) is required" });
      }

      const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "dihrq9pgs";
      const apiKey = process.env.CLOUDINARY_API_KEY;
      const apiSecret = process.env.CLOUDINARY_API_SECRET;

      if (!apiKey || !apiSecret) {
        console.warn("Cloudinary API credentials missing. Skipping deletion.");
        return res.status(200).json({ 
          success: false, 
          message: "Cloudinary credentials not configured on backend. Skipping delete." 
        });
      }

      const getPublicIdFromUrl = (url) => {
        if (!url.includes("res.cloudinary.com")) return null;
        try {
          const parts = url.split("/upload/");
          if (parts.length < 2) return null;
          const pathAfterUpload = parts[1];
          const withoutVersion = pathAfterUpload.replace(/^v\d+\//, "");
          const lastDotIndex = withoutVersion.lastIndexOf(".");
          return lastDotIndex !== -1 ? withoutVersion.substring(0, lastDotIndex) : withoutVersion;
        } catch (e) {
          return null;
        }
      };

      const publicIds = urls
        .map(getPublicIdFromUrl)
        .filter(Boolean);

      if (publicIds.length === 0) {
        return res.status(200).json({ success: true, message: "No valid Cloudinary public IDs found." });
      }

      const results = [];
      for (const publicId of publicIds) {
        const timestamp = Math.round(new Date().getTime() / 1000);
        const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
        const signature = crypto
          .createHash("sha1")
          .update(stringToSign)
          .digest("hex");

        const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`;

        const response = await fetch(cloudinaryUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            public_id: publicId,
            api_key: apiKey,
            timestamp: timestamp,
            signature: signature,
          }),
        });

        const data = await response.json();
        results.push({ publicId, result: data.result || data.error?.message });
      }

      res.status(200).json({ success: true, results });
    } catch (err) {
      next(err);
    }
  }
}

export default new PackageController();
