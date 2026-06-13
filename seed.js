require("dotenv").config();
const mongoose = require("mongoose");
const bcryptjs = require("bcryptjs");
const Product = require("./src/models/Product");
const Brand = require("./src/models/Brand");
const User = require("./src/models/User");
const Review = require("./src/models/Review");
const Order = require("./src/models/Order");
const Cart = require("./src/models/Cart");
const CartItem = require("./src/models/CartItem");
const Reply = require("./src/models/Reply");

const reviewTexts = [
  {
    title: "Sản phẩm tuyệt vời!",
    content: "Bé mèo nhà mình rất thích, sẽ tiếp tục ủng hộ shop.",
  },
  {
    title: "Chất lượng tốt, giao hàng nhanh",
    content: "Đóng gói cẩn thận, hàng đúng như mô tả. Rất hài lòng.",
  },
  {
    title: "Đáng tiền",
    content: "Giá hợp lý, mèo nhà mình hợp với sản phẩm này.",
  },
];

const demoProducts = [
  {
    name: "Royal Canin Feline Health Nutrition",
    description: "Thức ăn hạt cao cấp cho mèo khỏe mạnh",
    category: "food",
    price: 350000,
    quantity: 25,
    image: "../uploads/royal_canin_feline_adult_1780378370693.png",
    brand: "Royal Canin",
    weight: "2kg",
    lifeStage: "Adult",
    flavor: "Mix",
    detailedDescription: "Royal Canin Feline Health Nutrition là dòng thức ăn hạt cao cấp được nghiên cứu chuyên sâu, cung cấp dinh dưỡng cân bằng giúp mèo trưởng thành duy trì sức khỏe toàn diện. Công thức kết hợp protein chất lượng cao, chất xơ prebiotic và các dưỡng chất thiết yếu hỗ trợ hệ tiêu hóa, hệ miễn dịch và làn da, bộ lông khỏe mạnh.",
    benefits: ["Hỗ trợ tiêu hóa khỏe mạnh","Duy trì cân nặng lý tưởng","Lông mượt, da khỏe"],
    ingredients: ["Thịt gà tươi","Gạo và ngũ cốc nguyên hạt","Dầu cá Omega-3","Vitamin & khoáng chất tổng hợp"],
    origin: "Pháp",
  },
  {
    name: "Me-O Premium Cat Food",
    description: "Thức ăn hạt Me-O với vitamin tổng hợp",
    category: "food",
    price: 250000,
    quantity: 30,
    image: "../uploads/meo_premium_cat_food_1780378391329.png",
    brand: "Me-O",
    weight: "1.2kg",
    lifeStage: "Adult",
    flavor: "Chicken & Fish",
    detailedDescription: "Me-O Premium Cat Food là thức ăn hạt khô được chế biến từ thịt gà và cá biển tươi, bổ sung vitamin tổng hợp giúp mèo phát triển toàn diện. Hạt thức ăn có kích thước phù hợp, giúp làm sạch răng tự nhiên trong quá trình nhai.",
    benefits: ["Tăng cường hệ miễn dịch","Hỗ trợ tiêu hóa tốt","Giúp răng miệng sạch khỏe"],
    ingredients: ["Thịt gà","Cá biển","Ngũ cốc","Taurine","Vitamin tổng hợp"],
    origin: "Thái Lan",
  },
  {
    name: "Pate Gourmet Gold Savoury Cake",
    description: "Pate cao cấp với thịt và rau",
    category: "pate",
    price: 35000,
    quantity: 50,
    image: "../uploads/gourmet_gold_pate_1780378474959.png",
    brand: "Gourmet",
    weight: "85g",
    lifeStage: "Adult",
    flavor: "Beef & Vegetables",
    detailedDescription: "Pate Gourmet Gold Savoury Cake mang đến hương vị thơm ngon hấp dẫn với thịt bò mềm hòa cùng rau củ tươi, được chế biến dạng pate mịn dễ ăn. Sản phẩm bổ sung độ ẩm cần thiết, thích hợp dùng làm bữa chính hoặc bữa phụ cho mèo mọi lứa tuổi.",
    benefits: ["Hương vị thơm ngon hấp dẫn","Bổ sung độ ẩm cho cơ thể","Giàu protein từ thịt bò"],
    ingredients: ["Thịt bò","Rau củ tươi","Nước dùng tự nhiên","Vitamin E"],
    origin: "Pháp",
  },
  {
    name: "Catsrang Tuna Pate",
    description: "Pate cá ngừ tươi cho mèo",
    category: "pate",
    price: 28000,
    quantity: 40,
    image: "../uploads/catsrang_tuna_pate_1780378492411.png",
    brand: "Catsrang",
    weight: "80g",
    lifeStage: "Adult",
    flavor: "Tuna",
    detailedDescription: "Catsrang Tuna Pate được làm từ cá ngừ tươi nguyên chất, giàu Omega-3 giúp lông mượt và da khỏe. Kết cấu pate mềm mịn, dễ tiêu hóa, phù hợp cho cả mèo con và mèo trưởng thành.",
    benefits: ["Giàu Omega-3 cho lông mượt","Hương vị cá ngừ thơm ngon","Dễ tiêu hóa, phù hợp mọi lứa tuổi"],
    ingredients: ["Cá ngừ tươi","Dầu cá hồi","Taurine","Vitamin tổng hợp"],
    origin: "Hàn Quốc",
  },
  {
    name: "Snack Cá Hồi Sấy Khô",
    description: "Snack cá hồi tự nhiên, giàu omega-3",
    category: "snack",
    price: 120000,
    quantity: 20,
    image: "../uploads/salmon_freeze_dried_1780378512128.png",
    brand: "Pet Love",
    weight: "100g",
    lifeStage: "All",
    flavor: "Salmon",
    detailedDescription: "Snack Cá Hồi Sấy Khô được làm 100% từ cá hồi tươi, sấy khô tự nhiên giữ nguyên hương vị và dưỡng chất. Đây là món ăn vặt lành mạnh, giàu Omega-3, giúp lông mèo bóng mượt và hỗ trợ sức khỏe tim mạch.",
    benefits: ["Giàu Omega-3 tốt cho da và lông","Ít calo, không lo tăng cân","Hương vị thơm ngon tự nhiên"],
    ingredients: ["Cá hồi tươi 100%","Không chất bảo quản","Không phụ gia tạo màu"],
    origin: "Việt Nam",
  },
  {
    name: "Bánh Thưởng Crispy Bites",
    description: "Bánh thưởng giòn ngon, ít calo",
    category: "snack",
    price: 45000,
    quantity: 35,
    image: "../uploads/crispy_bites_chicken_1780535352826.png",
    brand: "Pet Joy",
    weight: "60g",
    lifeStage: "Adult",
    flavor: "Chicken",
    detailedDescription: "Bánh Thưởng Crispy Bites có lớp vỏ giòn tan kết hợp nhân mềm bên trong, hương vị gà thơm lừng kích thích vị giác của mèo. Sản phẩm phù hợp dùng để huấn luyện hoặc làm phần thưởng hàng ngày.",
    benefits: ["Giòn tan, kích thích thú vui ăn vặt","Hỗ trợ làm sạch răng miệng","Ít calo, phù hợp làm phần thưởng"],
    ingredients: ["Thịt gà","Bột yến mạch","Vitamin tổng hợp"],
    origin: "Việt Nam",
  },
  {
    name: "Sữa Cat Milk Standard",
    description: "Sữa đặc biệt dành cho mèo con",
    category: "milk",
    price: 85000,
    quantity: 15,
    image: "../uploads/beaphar_cat_milk_1780535372124.png",
    brand: "Pet Care",
    weight: "400ml",
    lifeStage: "Kitten",
    flavor: "Original",
    detailedDescription: "Sữa Cat Milk Standard được thiết kế đặc biệt cho mèo con, đã loại bỏ lactose giúp hệ tiêu hóa non nớt dễ hấp thụ. Bổ sung canxi, DHA và vitamin D3 hỗ trợ phát triển xương và trí não toàn diện.",
    benefits: ["Bổ sung canxi cho xương chắc khỏe","Không chứa lactose, dễ tiêu hóa","Hỗ trợ phát triển trí não"],
    ingredients: ["Sữa bột tách lactose","Canxi","DHA","Vitamin D3"],
    origin: "Hà Lan",
  },
  {
    name: "Sữa Goat Milk Premium",
    description: "Sữa dê cao cấp cho mèo nhạy cảm",
    category: "milk",
    price: 150000,
    quantity: 10,
    image: "../uploads/sua_goat_milk_premium_1780537481940.jpg",
    brand: "Premium Pet",
    weight: "500ml",
    lifeStage: "All",
    flavor: "Pure",
    detailedDescription: "Sữa Goat Milk Premium được chiết xuất từ sữa dê nguyên chất, dễ tiêu hóa hơn sữa bò và phù hợp với mèo có hệ tiêu hóa nhạy cảm. Bổ sung probiotic giúp cân bằng hệ vi sinh đường ruột.",
    benefits: ["Dễ tiêu hóa hơn sữa bò","Giàu dưỡng chất tự nhiên","Phù hợp cho mèo nhạy cảm"],
    ingredients: ["Sữa dê nguyên chất","Probiotic","Vitamin tổng hợp"],
    origin: "New Zealand",
  },
  {
    name: "Cát Vệ Sinh Bentonite",
    description: "Cát vệ sinh thần kỳ, khử mùi tốt",
    category: "accessories",
    price: 180000,
    quantity: 12,
    image: "../uploads/bentonite_cat_litter_1780535386342.png",
    brand: "Clean Paws",
    weight: "5kg",
    lifeStage: "All",
    flavor: "Lavender",
    detailedDescription: "Cát Vệ Sinh Bentonite được làm từ khoáng bentonite tự nhiên, có khả năng vón cục nhanh và khử mùi hiệu quả lên đến 24 giờ. Hương lavender dịu nhẹ giúp không gian luôn thơm mát, an toàn cho cả mèo và người sử dụng.",
    benefits: ["Khử mùi hiệu quả tới 24 giờ","Vón cục nhanh, dễ vệ sinh","An toàn cho mèo và người dùng"],
    ingredients: ["Bentonite tự nhiên 100%","Hương lavender dịu nhẹ","Không chứa bụi"],
    origin: "Thái Lan",
  },
  {
    name: "Cây Tựa Mèo 5 Tầng",
    description: "Cây tựa cao, thiết kế hiện đại",
    category: "accessories",
    price: 890000,
    quantity: 5,
    image: "../uploads/cat_tree_5_tier_1780535397792.png",
    brand: "Pet Furniture",
    weight: "15kg",
    lifeStage: "All",
    flavor: "Gray",
    detailedDescription: "Cây Tựa Mèo 5 Tầng có thiết kế hiện đại với nhiều tầng leo, khoang nghỉ và cột mài vuốt bằng sợi sisal tự nhiên. Sản phẩm giúp mèo vận động, giải tỏa năng lượng và có không gian riêng để nghỉ ngơi, thư giãn.",
    benefits: ["Giúp mèo vận động và mài vuốt","Tạo không gian nghỉ ngơi riêng","Khung chắc chắn, an toàn"],
    ingredients: ["Khung gỗ ép cao cấp","Thảm lót êm ái","Cột sisal tự nhiên"],
    origin: "Việt Nam",
  },
  {
    name: "Đồ Chơi Chuột Bấm Tiếng",
    description: "Đồ chơi tương tác, kích thích trí thông minh",
    category: "accessories",
    price: 65000,
    quantity: 25,
    image: "../uploads/squeaky_mouse_toy_1780535411925.png",
    brand: "Fun Pets",
    weight: "50g",
    lifeStage: "All",
    flavor: "Multicolor",
    detailedDescription: "Đồ Chơi Chuột Bấm Tiếng mô phỏng hình dáng chuột với âm thanh kêu thú vị khi bóp, kích thích bản năng săn mồi tự nhiên của mèo. Chất liệu an toàn, bền chắc, giúp mèo vui chơi và rèn luyện phản xạ.",
    benefits: ["Kích thích bản năng săn mồi","Giúp mèo vận động, giảm stress","Chất liệu an toàn, bền chắc"],
    ingredients: ["Vải nhung mềm","Bộ phát âm thanh an toàn","Bông nhồi không độc hại"],
    origin: "Trung Quốc",
  },
  {
    name: "Vòng Cổ GPS Theo Dõi",
    description: "Vòng cổ thông minh với định vị GPS",
    category: "accessories",
    price: 1200000,
    quantity: 3,
    image: "../uploads/gps_cat_collar_1780535424066.png",
    brand: "Tech Pet",
    weight: "80g",
    lifeStage: "Adult",
    flavor: "Black",
    detailedDescription: "Vòng Cổ GPS Theo Dõi giúp bạn xác định vị trí của mèo theo thời gian thực qua ứng dụng trên điện thoại. Thiết kế nhỏ gọn, nhẹ, chống nước, mang lại sự an tâm tuyệt đối khi mèo ra ngoài khám phá.",
    benefits: ["Định vị vị trí mèo theo thời gian thực","Thiết kế nhẹ, chống nước","Pin sử dụng lâu dài"],
    ingredients: ["Module GPS tích hợp","Dây đai chống nước","Pin sạc dung lượng cao"],
    origin: "Trung Quốc",
  },
  {
    name: "Khay Ăn Inox Cao Cấp",
    description: "Bộ 2 khay ăn chất liệu inox",
    category: "accessories",
    price: 280000,
    quantity: 18,
    image: "../uploads/khay_an_inox_cao_cap_1780537482364.jpg",
    brand: "Pet Home",
    weight: "500g",
    lifeStage: "All",
    flavor: "Silver",
    detailedDescription: "Bộ Khay Ăn Inox Cao Cấp gồm 2 khay với chất liệu inox 304 không gỉ, dễ vệ sinh và an toàn cho sức khỏe của mèo. Thiết kế đáy chống trượt giúp khay luôn cố định trong quá trình ăn uống.",
    benefits: ["Chất liệu inox an toàn, không gỉ","Dễ vệ sinh, chống ố mùi","Đáy chống trượt ổn định"],
    ingredients: ["Inox 304 cao cấp","Đế cao su chống trượt"],
    origin: "Việt Nam",
  },
  {
    name: "Bàn Chải Lông Chuyên Dụng",
    description: "Bàn chải xỉa lông hiệu quả",
    category: "accessories",
    price: 95000,
    quantity: 22,
    image: "../uploads/ban_chai_long_chuyen_dung_1780537482482.jpg",
    brand: "Grooming Pro",
    weight: "200g",
    lifeStage: "All",
    flavor: "Blue",
    detailedDescription: "Bàn Chải Lông Chuyên Dụng có thiết kế răng lược mềm, loại bỏ lông rụng và bụi bẩn hiệu quả mà không gây đau hay tổn thương da. Tay cầm ergonomic giúp cầm nắm thoải mái trong suốt quá trình chải lông.",
    benefits: ["Loại bỏ lông rụng hiệu quả","Massage da nhẹ nhàng","Tay cầm chống trượt thoải mái"],
    ingredients: ["Răng lược thép không gỉ","Tay cầm cao su mềm"],
    origin: "Việt Nam",
  },
  {
    name: "Khăn Tắm Mèo Siêu Thấm",
    description: "Khăn tắm cao cấp, thấm nước nhanh",
    category: "accessories",
    price: 120000,
    quantity: 16,
    image: "../uploads/khan_tam_meo_sieu_tham_1780537507782.jpg",
    brand: "Cozy Pet",
    weight: "300g",
    lifeStage: "All",
    flavor: "Pink",
    detailedDescription: "Khăn Tắm Mèo Siêu Thấm được làm từ sợi microfiber cao cấp, có khả năng thấm hút nước nhanh gấp nhiều lần khăn thông thường. Giúp làm khô lông mèo nhanh chóng sau khi tắm, hạn chế cảm lạnh.",
    benefits: ["Thấm hút nước siêu nhanh","Mềm mại, không gây kích ứng da","Nhanh khô, dễ giặt sạch"],
    ingredients: ["Sợi microfiber cao cấp","Viền khâu chắc chắn"],
    origin: "Việt Nam",
  },
  {
    name: "Túi Vận Chuyển Mèo",
    description: "Túi chuyên dụng để đi khám bệnh",
    category: "accessories",
    price: 450000,
    quantity: 8,
    image: "../uploads/tui_van_chuyen_meo_1780537483481.jpg",
    brand: "Travel Pet",
    weight: "600g",
    lifeStage: "All",
    flavor: "Cream",
    detailedDescription: "Túi Vận Chuyển Mèo có thiết kế chắc chắn, thông thoáng với lưới thoáng khí và đệm lót êm ái bên trong, giúp mèo cảm thấy an toàn và thoải mái trong suốt quá trình di chuyển hoặc đi khám bệnh.",
    benefits: ["Thiết kế thông thoáng, an toàn","Đệm lót êm ái, thoải mái","Gọn nhẹ, dễ mang theo"],
    ingredients: ["Vải oxford chống thấm","Lưới thoáng khí","Đệm lót có thể giặt"],
    origin: "Việt Nam",
  },
  {
    name: "Thuốc Tẩy Giun An Toàn",
    description: "Thuốc tẩy giun lớn cho mèo",
    category: "food",
    price: 75000,
    quantity: 14,
    image: "../uploads/thuoc_tay_giun_an_toan_1780537483788.jpg",
    brand: "Vet Care",
    weight: "10ml",
    lifeStage: "All",
    flavor: "Orange",
    detailedDescription: "Thuốc Tẩy Giun An Toàn giúp loại bỏ các loại giun sán phổ biến ở mèo, công thức dịu nhẹ không gây tác dụng phụ. Sản phẩm được khuyến nghị sử dụng định kỳ để bảo vệ sức khỏe đường ruột cho mèo.",
    benefits: ["Loại bỏ giun sán hiệu quả","Công thức dịu nhẹ, an toàn","Dễ sử dụng, hấp thu nhanh"],
    ingredients: ["Praziquantel","Pyrantel","Tá dược an toàn"],
    origin: "Việt Nam",
  },
  {
    name: "Vitamin Tổng Hợp A-Z",
    description: "Vitamin đầy đủ dinh dưỡng cho mèo",
    category: "food",
    price: 180000,
    quantity: 11,
    image: "../uploads/vitamin_tong_hop_a_z_1780537483899.jpg",
    brand: "Pet Health",
    weight: "100g",
    lifeStage: "All",
    flavor: "Chicken",
    detailedDescription: "Vitamin Tổng Hợp A-Z bổ sung đầy đủ các vitamin và khoáng chất thiết yếu, giúp tăng cường sức đề kháng, hỗ trợ lông mượt và xương khớp chắc khỏe cho mèo mọi lứa tuổi.",
    benefits: ["Tăng cường sức đề kháng","Hỗ trợ lông mượt, da khỏe","Bổ sung dưỡng chất toàn diện"],
    ingredients: ["Vitamin A, D, E, B-complex","Canxi & Phospho","Kẽm và Taurine"],
    origin: "Việt Nam",
  },
  {
    name: "Dầu Gió Hỗ Trợ Tiêu Hóa",
    description: "Dầu cá omega-3 cho mèo khỏe mạnh",
    category: "food",
    price: 220000,
    quantity: 9,
    image: "../uploads/dau_gio_ho_tro_tieu_hoa_1780537484065.jpg",
    brand: "Premium Care",
    weight: "250ml",
    lifeStage: "Adult",
    flavor: "Fish",
    detailedDescription: "Dầu Gió Hỗ Trợ Tiêu Hóa được chiết xuất từ dầu cá giàu Omega-3, giúp cải thiện chức năng tiêu hóa, giảm tình trạng táo bón và hỗ trợ hấp thu dưỡng chất tốt hơn. Chỉ cần trộn vài giọt vào thức ăn hàng ngày.",
    benefits: ["Hỗ trợ tiêu hóa khỏe mạnh","Giàu Omega-3 cho lông mượt","Dễ sử dụng, hấp thu nhanh"],
    ingredients: ["Dầu cá Omega-3","Vitamin E","Chất chống oxy hóa tự nhiên"],
    origin: "Việt Nam",
  },
  {
    name: "Bàn Nước Uống Tự Động",
    description: "Bàn uống nước chạy điện, giữ nước sạch",
    category: "accessories",
    price: 650000,
    quantity: 6,
    image: "../uploads/ban_nuoc_uong_tu_dong_1780537484198.jpg",
    brand: "Pet Tech",
    weight: "800g",
    lifeStage: "All",
    flavor: "White",
    detailedDescription: "Bàn Nước Uống Tự Động sử dụng bơm tuần hoàn êm ái, tạo dòng nước chảy liên tục giúp kích thích mèo uống nước nhiều hơn. Hệ thống lọc 3 lớp đảm bảo nguồn nước luôn sạch và tươi mới.",
    benefits: ["Kích thích thú cưng uống nhiều nước hơn","Hệ thống lọc 3 lớp giữ nước sạch","Hoạt động êm ái, tiết kiệm điện"],
    ingredients: ["Bơm tuần hoàn siêu êm","Lõi lọc than hoạt tính","Thân nhựa ABS an toàn"],
    origin: "Trung Quốc",
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
    await Brand.deleteMany({});
    await User.deleteMany({});
    await Review.deleteMany({});
    await Order.deleteMany({});
    await Cart.deleteMany({});
    await CartItem.deleteMany({});
    await Reply.deleteMany({});
    console.log("✓ Cleared existing data");

    // Seed products
    const createdProducts = await Product.insertMany(demoProducts);
    console.log(`✓ Created ${createdProducts.length} demo products`);

    const uniqueBrandNames = [
      ...new Set(demoProducts.map((product) => product.brand).filter(Boolean)),
    ];
    const createdBrands = await Brand.insertMany(
      uniqueBrandNames.map((name) => ({ name }))
    );
    console.log(`✓ Created ${createdBrands.length} demo brands`);

    // Hash passwords and seed users
    const usersWithHashedPasswords = await Promise.all(
      demoUsers.map(async (user) => {
        const hashedPassword = await bcryptjs.hash(user.password, 10);
        return { ...user, password: hashedPassword };
      })
    );

    const createdUsers = await User.insertMany(usersWithHashedPasswords);
    console.log(`✓ Created ${createdUsers.length} demo users`);

    // Seed reviews (each review needs a backing "delivered" order)
    const customers = createdUsers.filter((u) => u.role === "customer");
    let reviewCount = 0;
    let orderCounter = 1;
    for (const product of createdProducts) {
      // Create 1-3 random reviews per product
      const numReviews = Math.floor(Math.random() * 3) + 1;
      const reviewerIds = new Set();
      for (let i = 0; i < numReviews; i++) {
        const customer = customers[(orderCounter + i) % customers.length];
        if (reviewerIds.has(String(customer._id))) continue;
        reviewerIds.add(String(customer._id));

        const order = await Order.create({
          orderNumber: `SEED-${Date.now()}-${orderCounter}`,
          user: customer._id,
          products: [
            { product: product._id, quantity: 1, price: product.price },
          ],
          totalPrice: product.price,
          status: "delivered",
          shippingAddress: {
            fullName: customer.fullName,
            address: "123 Đường Demo, Quận 1",
            city: "TP. Hồ Chí Minh",
            phone: customer.phone || "0900000000",
          },
          paymentMethod: "cod",
          paymentStatus: "paid",
        });
        orderCounter++;

        const text =
          reviewTexts[Math.floor(Math.random() * reviewTexts.length)];
        await Review.create({
          product: product._id,
          user: customer._id,
          order: order._id,
          rating: Math.floor(Math.random() * 2) + 4, // 4 or 5 stars
          title: text.title,
          content: text.content,
          images: [],
          isVerifiedPurchase: true,
        });
        reviewCount++;
      }

      // Update product average rating based on its reviews
      const productReviews = await Review.find({ product: product._id });
      const avg =
        productReviews.reduce((sum, r) => sum + r.rating, 0) /
        productReviews.length;
      await Product.findByIdAndUpdate(product._id, {
        rating: Math.round(avg * 10) / 10,
      });
    }
    console.log(`✓ Created ${reviewCount} demo reviews with backing orders`);
    console.log(`✓ Updated product average ratings`);

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
