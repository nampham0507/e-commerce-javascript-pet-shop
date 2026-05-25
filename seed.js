require("dotenv").config();
const mongoose = require("mongoose");
const bcryptjs = require("bcryptjs");
const Product = require("./src/models/Product");
const User = require("./src/models/User");

const demoProducts = [
  {
    name: "Royal Canin Feline Health Nutrition",
    description: "Thức ăn hạt cao cấp cho mèo khỏe mạnh",
    category: "food",
    price: 350000,
    quantity: 25,
    image: "https://via.placeholder.com/300?text=Royal+Canin",
    brand: "Royal Canin",
    weight: "2kg",
    lifeStage: "Adult",
    flavor: "Mix",
  },
  {
    name: "Me-O Premium Cat Food",
    description: "Thức ăn hạt Me-O với vitamin tổng hợp",
    category: "food",
    price: 250000,
    quantity: 30,
    image: "https://via.placeholder.com/300?text=Me-O+Premium",
    brand: "Me-O",
    weight: "1.2kg",
    lifeStage: "Adult",
    flavor: "Chicken & Fish",
  },
  {
    name: "Pate Gourmet Gold Savoury Cake",
    description: "Pate cao cấp với thịt và rau",
    category: "pate",
    price: 35000,
    quantity: 50,
    image: "https://via.placeholder.com/300?text=Pate+Gourmet",
    brand: "Gourmet",
    weight: "85g",
    lifeStage: "Adult",
    flavor: "Beef & Vegetables",
  },
  {
    name: "Catsrang Tuna Pate",
    description: "Pate cá ngừ tươi cho mèo",
    category: "pate",
    price: 28000,
    quantity: 40,
    image: "https://via.placeholder.com/300?text=Catsrang+Tuna",
    brand: "Catsrang",
    weight: "80g",
    lifeStage: "Adult",
    flavor: "Tuna",
  },
  {
    name: "Snack Cá Hồi Sấy Khô",
    description: "Snack cá hồi tự nhiên, giàu omega-3",
    category: "snack",
    price: 120000,
    quantity: 20,
    image: "https://via.placeholder.com/300?text=Salmon+Snack",
    brand: "Pet Love",
    weight: "100g",
    lifeStage: "All",
    flavor: "Salmon",
  },
  {
    name: "Bánh Thưởng Crispy Bites",
    description: "Bánh thưởng giòn ngon, ít calo",
    category: "snack",
    price: 45000,
    quantity: 35,
    image: "https://via.placeholder.com/300?text=Crispy+Bites",
    brand: "Pet Joy",
    weight: "60g",
    lifeStage: "Adult",
    flavor: "Chicken",
  },
  {
    name: "Sữa Cat Milk Standard",
    description: "Sữa đặc biệt dành cho mèo con",
    category: "milk",
    price: 85000,
    quantity: 15,
    image: "https://via.placeholder.com/300?text=Cat+Milk",
    brand: "Pet Care",
    weight: "400ml",
    lifeStage: "Kitten",
    flavor: "Original",
  },
  {
    name: "Sữa Goat Milk Premium",
    description: "Sữa dê cao cấp cho mèo nhạy cảm",
    category: "milk",
    price: 150000,
    quantity: 10,
    image: "https://via.placeholder.com/300?text=Goat+Milk",
    brand: "Premium Pet",
    weight: "500ml",
    lifeStage: "All",
    flavor: "Pure",
  },
  {
    name: "Cát Vệ Sinh Bentonite",
    description: "Cát vệ sinh thần kỳ, khử mùi tốt",
    category: "accessories",
    price: 180000,
    quantity: 12,
    image: "https://via.placeholder.com/300?text=Cat+Litter",
    brand: "Clean Paws",
    weight: "5kg",
    lifeStage: "All",
    flavor: "Lavender",
  },
  {
    name: "Cây Tựa Mèo 5 Tầng",
    description: "Cây tựa cao, thiết kế hiện đại",
    category: "accessories",
    price: 890000,
    quantity: 5,
    image: "https://via.placeholder.com/300?text=Cat+Tree",
    brand: "Pet Furniture",
    weight: "15kg",
    lifeStage: "All",
    flavor: "Gray",
  },
  {
    name: "Đồ Chơi Chuột Bấm Tiếng",
    description: "Đồ chơi tương tác, kích thích trí thông minh",
    category: "accessories",
    price: 65000,
    quantity: 25,
    image: "https://via.placeholder.com/300?text=Interactive+Toy",
    brand: "Fun Pets",
    weight: "50g",
    lifeStage: "All",
    flavor: "Multicolor",
  },
  {
    name: "Vòng Cổ GPS Theo Dõi",
    description: "Vòng cổ thông minh với định vị GPS",
    category: "accessories",
    price: 1200000,
    quantity: 3,
    image: "https://via.placeholder.com/300?text=GPS+Collar",
    brand: "Tech Pet",
    weight: "80g",
    lifeStage: "Adult",
    flavor: "Black",
  },
  {
    name: "Khay Ăn Inox Cao Cấp",
    description: "Bộ 2 khay ăn chất liệu inox",
    category: "accessories",
    price: 280000,
    quantity: 18,
    image: "https://via.placeholder.com/300?text=Stainless+Bowl",
    brand: "Pet Home",
    weight: "500g",
    lifeStage: "All",
    flavor: "Silver",
  },
  {
    name: "Bàn Chải Lông Chuyên Dụng",
    description: "Bàn chải xỉa lông hiệu quả",
    category: "accessories",
    price: 95000,
    quantity: 22,
    image: "https://via.placeholder.com/300?text=Pet+Brush",
    brand: "Grooming Pro",
    weight: "200g",
    lifeStage: "All",
    flavor: "Blue",
  },
  {
    name: "Khăn Tắm Mèo Siêu Thấm",
    description: "Khăn tắm cao cấp, thấm nước nhanh",
    category: "accessories",
    price: 120000,
    quantity: 16,
    image: "https://via.placeholder.com/300?text=Pet+Towel",
    brand: "Cozy Pet",
    weight: "300g",
    lifeStage: "All",
    flavor: "Pink",
  },
  {
    name: "Túi Vận Chuyển Mèo",
    description: "Túi chuyên dụng để đi khám bệnh",
    category: "accessories",
    price: 450000,
    quantity: 8,
    image: "https://via.placeholder.com/300?text=Pet+Carrier",
    brand: "Travel Pet",
    weight: "600g",
    lifeStage: "All",
    flavor: "Cream",
  },
  {
    name: "Thuốc Tẩy Giun An Toàn",
    description: "Thuốc tẩy giun lớn cho mèo",
    category: "food",
    price: 75000,
    quantity: 14,
    image: "https://via.placeholder.com/300?text=Dewormer",
    brand: "Vet Care",
    weight: "10ml",
    lifeStage: "All",
    flavor: "Orange",
  },
  {
    name: "Vitamin Tổng Hợp A-Z",
    description: "Vitamin đầy đủ dinh dưỡng cho mèo",
    category: "food",
    price: 180000,
    quantity: 11,
    image: "https://via.placeholder.com/300?text=Vitamin+Complex",
    brand: "Pet Health",
    weight: "100g",
    lifeStage: "All",
    flavor: "Chicken",
  },
  {
    name: "Dầu Gió Hỗ Trợ Tiêu Hóa",
    description: "Dầu cá omega-3 cho mèo khỏe mạnh",
    category: "food",
    price: 220000,
    quantity: 9,
    image: "https://via.placeholder.com/300?text=Fish+Oil",
    brand: "Premium Care",
    weight: "250ml",
    lifeStage: "Adult",
    flavor: "Fish",
  },
  {
    name: "Bàn Nước Uống Tự Động",
    description: "Bàn uống nước chạy điện, giữ nước sạch",
    category: "accessories",
    price: 650000,
    quantity: 6,
    image: "https://via.placeholder.com/300?text=Water+Fountain",
    brand: "Pet Tech",
    weight: "800g",
    lifeStage: "All",
    flavor: "White",
  },
];

const demoUsers = [
  {
    fullName: "Phạm Đình Nam",
    email: "admin1@example.com",
    password: "123456",
    phone: "0123456789",
    role: "admin",
  },
  {
    fullName: "Nguyễn Thị Hương",
    email: "admin2@example.com",
    password: "123456",
    phone: "0987654321",
    role: "admin",
  },
  {
    fullName: "Trần Văn Kiên",
    email: "customer1@example.com",
    password: "123456",
    phone: "0912345678",
    role: "customer",
  },
  {
    fullName: "Lê Thị Mai",
    email: "customer2@example.com",
    password: "123456",
    phone: "0923456789",
    role: "customer",
  },
  {
    fullName: "Hoàng Minh Tuan",
    email: "customer3@example.com",
    password: "123456",
    phone: "0934567890",
    role: "customer",
  },
  {
    fullName: "Phạm Anh Thy",
    email: "customer4@example.com",
    password: "123456",
    phone: "0945678901",
    role: "customer",
  },
  {
    fullName: "Đặng Thị Hồng",
    email: "customer5@example.com",
    password: "123456",
    phone: "0956789012",
    role: "customer",
  },
  {
    fullName: "Vũ Văn Hùng",
    email: "customer6@example.com",
    password: "123456",
    phone: "0967890123",
    role: "customer",
  },
  {
    fullName: "Trịnh Thị Linh",
    email: "customer7@example.com",
    password: "123456",
    phone: "0978901234",
    role: "customer",
  },
  {
    fullName: "Bùi Văn Định",
    email: "customer8@example.com",
    password: "123456",
    phone: "0989012345",
    role: "customer",
  },
  {
    fullName: "Tô Thị Thu Hà",
    email: "customer9@example.com",
    password: "123456",
    phone: "0990123456",
    role: "customer",
  },
  {
    fullName: "Lương Minh Đức",
    email: "customer10@example.com",
    password: "123456",
    phone: "0901234567",
    role: "customer",
  },
  {
    fullName: "Ngô Thị Bích",
    email: "customer11@example.com",
    password: "123456",
    phone: "0912345670",
    role: "customer",
  },
  {
    fullName: "Phan Văn Tùng",
    email: "customer12@example.com",
    password: "123456",
    phone: "0923456780",
    role: "customer",
  },
  {
    fullName: "Võ Thị Huyền",
    email: "customer13@example.com",
    password: "123456",
    phone: "0934567891",
    role: "customer",
  },
  {
    fullName: "Đinh Văn Long",
    email: "customer14@example.com",
    password: "123456",
    phone: "0945678902",
    role: "customer",
  },
  {
    fullName: "Đoàn Thị Nha",
    email: "customer15@example.com",
    password: "123456",
    phone: "0956789013",
    role: "customer",
  },
  {
    fullName: "Hồ Minh Quân",
    email: "customer16@example.com",
    password: "123456",
    phone: "0967890124",
    role: "customer",
  },
  {
    fullName: "Lại Thị Khánh",
    email: "customer17@example.com",
    password: "123456",
    phone: "0978901235",
    role: "customer",
  },
  {
    fullName: "Dương Văn Sơn",
    email: "customer18@example.com",
    password: "123456",
    phone: "0989012346",
    role: "customer",
  },
];

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✓ MongoDB connected");

    // Clear existing data
    await Product.deleteMany({});
    await User.deleteMany({});
    console.log("✓ Cleared existing data");

    // Seed products
    const createdProducts = await Product.insertMany(demoProducts);
    console.log(`✓ Created ${createdProducts.length} demo products`);

    // Hash passwords and seed users
    const usersWithHashedPasswords = await Promise.all(
      demoUsers.map(async (user) => {
        const hashedPassword = await bcryptjs.hash(user.password, 10);
        return { ...user, password: hashedPassword };
      })
    );

    const createdUsers = await User.insertMany(usersWithHashedPasswords);
    console.log(`✓ Created ${createdUsers.length} demo users`);

    console.log("\n✓ Database seeded successfully!");
    console.log("\n Admin accounts:");
    demoUsers
      .filter((u) => u.role === "admin")
      .forEach((user) => {
        console.log(`  - Email: ${user.email}, Password: ${user.password}`);
      });

    console.log("\n Customer sample accounts:");
    demoUsers
      .filter((u) => u.role === "customer")
      .slice(0, 3)
      .forEach((user) => {
        console.log(`  - Email: ${user.email}, Password: ${user.password}`);
      });

    process.exit(0);
  } catch (error) {
    console.error("✗ Error seeding database:", error);
    process.exit(1);
  }
}

seedDatabase();
