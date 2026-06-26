import crypto from "crypto";

class CloudinaryService {
  get cloudName() {
    return process.env.CLOUDINARY_CLOUD_NAME || "dihrq9pgs";
  }

  get apiKey() {
    return process.env.CLOUDINARY_API_KEY;
  }

  get apiSecret() {
    return process.env.CLOUDINARY_API_SECRET;
  }

  isConfigured() {
    return !!(this.apiKey && this.apiSecret);
  }

  extractPublicId(url) {
    if (!url.includes("res.cloudinary.com")) return null;
    try {
      const parts = url.split("/upload/");
      if (parts.length < 2) return null;
      const pathAfterUpload = parts[1];
      const withoutVersion = pathAfterUpload.replace(/^v\d+\//, "");
      const lastDotIndex = withoutVersion.lastIndexOf(".");
      return lastDotIndex !== -1 ? withoutVersion.substring(0, lastDotIndex) : withoutVersion;
    } catch {
      return null;
    }
  }

  extractPublicIds(urls) {
    return [...new Set(urls.map(url => this.extractPublicId(url)).filter(Boolean))];
  }

  generateSignature(publicId, timestamp) {
    const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${this.apiSecret}`;
    return crypto.createHash("sha1").update(stringToSign).digest("hex");
  }

  async deleteImage(publicId) {
    const timestamp = Math.round(Date.now() / 1000);
    const signature = this.generateSignature(publicId, timestamp);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${this.cloudName}/image/destroy`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            public_id: publicId,
            api_key: this.apiKey,
            timestamp,
            signature
          })
        }
      );

      if (!response.ok) {
        let message = `Cloudinary returned ${response.status}`;
        try {
          const errorBody = await response.json();
          if (errorBody?.error?.message) {
            message = errorBody.error.message;
          }
        } catch {}
        return { publicId, result: message };
      }

      const data = await response.json();
      return { publicId, result: data.result || data.error?.message };
    } catch {
      return { publicId, result: "Cloudinary request failed" };
    }
  }

  async deleteImages(urls) {
    if (!this.isConfigured()) {
      return {
        success: false,
        message: "Cloudinary credentials not configured on backend. Skipping delete."
      };
    }

    const publicIds = this.extractPublicIds(urls);
    if (publicIds.length === 0) {
      return { success: true, message: "No valid Cloudinary public IDs found." };
    }

    const results = await Promise.all(
      publicIds.map(publicId => this.deleteImage(publicId))
    );

    return { success: true, results };
  }
}

export default new CloudinaryService();
