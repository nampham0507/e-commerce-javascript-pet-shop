require("dotenv").config({ path: ".env" });
const mongoose = require("mongoose");
const Product = require("./src/models/Product");
const Brand = require("./src/models/Brand");

const formatName = (value) => value?.trim() || "";

const ensureBrandsFromProducts = async () => {
  const existingBrandNames = new Set(
    (await Brand.find({}).select("name").lean()).map((brand) => brand.name),
  );
  console.log("Existing brands:", Array.from(existingBrandNames));

  const productBrands = await Product.distinct("brand", {
    brand: { $exists: true, $ne: "" },
  });
  console.log("Distinct product brands:", productBrands);

  const normalizedProductBrands = [...new Set(
    productBrands
      .map((name) => formatName(name))
      .filter(Boolean),
  )];

  const newBrands = normalizedProductBrands
    .filter((name) => !existingBrandNames.has(name))
    .map((name) => ({ name }));

  console.log("New brands to insert:", newBrands);

  if (newBrands.length > 0) {
    try {
      await Brand.insertMany(newBrands);
      console.log("Insert success!");
    } catch (err) {
      console.error("Insert failed:", err);
    }
  }
};

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log("Connected to MongoDB");
    await ensureBrandsFromProducts();
    const allBrands = await Brand.find({}).lean();
    console.log("All brands after ensure:", allBrands);
    process.exit(0);
  })
  .catch(err => {
    console.error("MongoDB connect error:", err);
    process.exit(1);
  });
