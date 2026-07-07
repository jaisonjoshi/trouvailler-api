import mongoose from "mongoose";
import dotenv from "dotenv";
import Location from "../models/Location.js";
import Category from "../models/Category.js";
import Package from "../models/Package.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB.");

    // Find or create location Kashmir
    let kashmir = await Location.findOne({ slug: "kashmir" });
    if (!kashmir) {
      kashmir = new Location({
        name: "Kashmir",
        slug: "kashmir",
        shortDescription: "Paradise on Earth",
        description: "Explore the breathtaking snow-covered valleys, serene houseboats, and colorful meadows of Kashmir.",
        image: "https://images.unsplash.com/photo-1566837430227-72377b63d919?auto=format&fit=crop&w=800&q=80",
        level: "destination",
        isActive: true,
      });
      await kashmir.save();
      console.log("Created Kashmir location.");
    }

    // Find some categories to associate
    const categories = await Category.find({ isDeleted: false }).limit(2);
    const categoryIds = categories.map(c => c._id);

    // Delete existing package if it has same slug to prevent duplicate key errors
    await Package.deleteOne({ slug: "magical-kashmir-getaway" });

    const kashmirPackage = new Package({
      title: "Magical Kashmir Getaway",
      slug: "magical-kashmir-getaway",
      status: "published",
      mainLocation: kashmir._id,
      locations: [kashmir._id],
      coverImage: "https://images.unsplash.com/photo-1566837430227-72377b63d919?auto=format&fit=crop&w=1200&q=80",
      galleryImages: [
        "https://images.unsplash.com/photo-1598302872786-82552046522a?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1615966650071-855b15f29ad1?auto=format&fit=crop&w=800&q=80",
      ],
      description: "Experience the paradise on earth with this hand-crafted Kashmir getaway. Enjoy serene stays in Srinagar's houseboats, marvel at Gulmarg's snow-clad valleys, and explore the breathtaking meadows of Pahalgam.",
      price: 17763,
      originalPrice: 24500,
      days: 6,
      nights: 5,
      highlights: [
        { icon: "houseboat", title: "Deluxe Houseboat Stay" },
        { icon: "gondola", title: "Gulmarg Gondola Ride" },
        { icon: "lake", title: "Shikara Ride on Dal Lake" }
      ],
      schedule: [
        {
          title: "Arrival in Srinagar & Shikara Ride",
          description: "Arrive at Srinagar Airport. Meet our representative and transfer to your Deluxe Houseboat on Dal Lake. In the evening, enjoy a relaxing Shikara ride across the serene waters.",
          activities: [
            { name: "Srinagar Airport Pickup", description: "Private airport transfer to Dal Lake", isIncluded: true },
            { name: "Dal Lake Shikara Ride", description: "1-hour traditional Shikara boat ride", isIncluded: true }
          ]
        },
        {
          title: "Srinagar Local Sightseeing",
          description: "Explore the beautiful Mughal Gardens including Nishat Bagh (Garden of Pleasure), Shalimar Bagh (Abode of Love), and the historical Shankaracharya Temple offering panoramic city views.",
          activities: [
            { name: "Mughal Gardens Tour", description: "Guided tour of Shalimar & Nishat gardens", isIncluded: true },
            { name: "Shankaracharya Temple Visit", description: "Visit to the historic hilltop temple", isIncluded: true }
          ]
        },
        {
          title: "Srinagar to Pahalgam (Valley of Shepherds)",
          description: "Drive to Pahalgam. Enroute visit the saffron fields of Pampore and the ancient Awantipora ruins. Check in to your hotel and enjoy the rest of the day at leisure along the Lidder River.",
          activities: [
            { name: "Saffron Fields Visit", description: "Stop at Pampore saffron farms", isIncluded: true },
            { name: "Awantipora Ruins Visit", description: "Explore the 9th-century temple ruins", isIncluded: true }
          ]
        },
        {
          title: "Explore Pahalgam & Lidder Valley",
          description: "Spend the day exploring Pahalgam. Visit the scenic Aru Valley, Betaab Valley (named after the Bollywood movie Betaab), and Chandanwari, the starting point of the holy Amarnath Yatra.",
          activities: [
            { name: "Aru & Betaab Valley Sightseeing", description: "Scenic valley excursion by local Union cab", isIncluded: true }
          ]
        },
        {
          title: "Pahalgam to Gulmarg (Meadow of Flowers)",
          description: "Transfer to Gulmarg. Famous for its ski slopes and golf course. Ride the famous Gulmarg Gondola (one of the highest in the world) to Phase 1 (Kongdori) for breathtaking views.",
          activities: [
            { name: "Gulmarg Gondola Ride", description: "Phase 1 gondola tickets included", isIncluded: true }
          ]
        },
        {
          title: "Gulmarg to Srinagar & Departure",
          description: "After breakfast, check out and drive back to Srinagar. Transfer to Srinagar Airport for your onward flight back home with beautiful memories.",
          activities: [
            { name: "Airport Dropoff", description: "Private drop to Srinagar Airport", isIncluded: true }
          ]
        }
      ],
      inclusions: [
        "05 Nights accommodation (1N Houseboat, 2N Pahalgam, 1N Gulmarg, 1N Srinagar)",
        "Daily Breakfast & Dinner at all hotels",
        "Private AC Sedan/SUV for all sightseeing and airport transfers",
        "1-Hour Shikara ride on Dal Lake",
        "Gulmarg Gondola Phase 1 tickets"
      ],
      exclusions: [
        "Airfare/Train tickets",
        "Lunch and snacks",
        "Entry fees to monuments/gardens",
        "Tips and personal expenses"
      ],
      categories: categoryIds
    });

    await kashmirPackage.save();
    console.log("Successfully imported Magical Kashmir Getaway package!");
  } catch (error) {
    console.error("Error during import:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

run();
