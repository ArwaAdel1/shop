require("dotenv").config();
const connectDB = require("./db");
const Category = require("../models/Category");
const Admin = require("../models/Admin");
const SiteSettings = require("../models/SiteSettings");

const categories = [
  {
    name_ar: "الإلكترونيات", name_en: "Electronics", slug: "electronics", icon: "📱", order: 1,
    subcategories: [
      { name_ar: "الهواتف الذكية", slug: "smartphones" },
      { name_ar: "التابلت", slug: "tablets" },
      { name_ar: "اللابتوبات", slug: "laptops" },
      { name_ar: "أجهزة الكمبيوتر", slug: "computers" },
      { name_ar: "الشاشات", slug: "monitors" },
      { name_ar: "الطابعات", slug: "printers" },
      { name_ar: "السماعات", slug: "headphones" },
      { name_ar: "الساعات الذكية", slug: "smartwatches" },
      { name_ar: "الكاميرات", slug: "cameras" },
      { name_ar: "ملحقات الهواتف", slug: "phone-accessories" },
      { name_ar: "ملحقات الكمبيوتر", slug: "computer-accessories" },
    ],
  },
  {
    name_ar: "المنزل والمطبخ", name_en: "Home & Kitchen", slug: "home-kitchen", icon: "🏠", order: 2,
    subcategories: [
      { name_ar: "أدوات المطبخ", slug: "kitchen-tools" },
      { name_ar: "الأجهزة المنزلية", slug: "home-appliances" },
    ],
  },
  {
    name_ar: "الأزياء والموضة", name_en: "Fashion", slug: "fashion", icon: "👗", order: 3,
    subcategories: [
      { name_ar: "رجال", slug: "men" },
      { name_ar: "نساء", slug: "women" },
      { name_ar: "أطفال", slug: "kids" },
    ],
  },
  {
    name_ar: "الجمال والعناية", name_en: "Beauty", slug: "beauty", icon: "✨", order: 4,
    subcategories: [
      { name_ar: "العناية بالبشرة والشعر", slug: "skin-hair" },
      { name_ar: "العطور", slug: "perfumes" },
    ],
  },
  {
    name_ar: "المواد الغذائية", name_en: "Food", slug: "food", icon: "🍯", order: 5,
    subcategories: [
      { name_ar: "زيت زيتون", slug: "olive-oil" },
      { name_ar: "عسل نحل", slug: "honey" },
      { name_ar: "تلبينة", slug: "talbina" },
    ],
  },
  {
    name_ar: "الألعاب والترفيه", name_en: "Toys", slug: "toys", icon: "🎮", order: 6,
    subcategories: [
      { name_ar: "ألعاب تعليمية", slug: "educational" },
      { name_ar: "ألعاب ذكاء", slug: "intelligence" },
      { name_ar: "ألعاب خارجية", slug: "outdoor" },
    ],
  },
  {
    name_ar: "المكتبة", name_en: "Library", slug: "library", icon: "📚", order: 7,
    subcategories: [
      { name_ar: "كتب دينية", slug: "religious-books" },
      { name_ar: "كتب تعليمية", slug: "educational-books" },
      { name_ar: "روايات", slug: "novels" },
      { name_ar: "أدوات مكتبية", slug: "stationery" },
      { name_ar: "مستلزمات الدراسة", slug: "study-supplies" },
    ],
  },
  {
    name_ar: "الهدايا والمناسبات", name_en: "Gifts", slug: "gifts", icon: "🎁", order: 8,
    subcategories: [
      { name_ar: "هدايا رجالية", slug: "mens-gifts" },
      { name_ar: "هدايا نسائية", slug: "womens-gifts" },
      { name_ar: "هدايا الأطفال", slug: "kids-gifts" },
    ],
  },
];

const seed = async () => {
  await connectDB();
  try {
    // Categories
    await Category.deleteMany({});
    await Category.insertMany(categories);
    console.log("✅ Categories seeded");

    // Admin
    await Admin.deleteMany({});
    await Admin.create({ username: "admin", password: "admin123", role: "superadmin" });
    console.log("✅ Admin: admin / admin123");

    // Settings - على ضمانتي
    await SiteSettings.deleteMany({});
    const s = new SiteSettings({
      siteName_ar: "على ضمانتي",
      siteName_en: "Ala Damanty",
      heroTitle_ar: "على ضمانتي",
      heroSubtitle_ar: "مشترياتك على ضمانتي (أبوعبدالملك) وأسعارنا تنافسية",
      aboutUs_ar: "متجر على ضمانتي - نوفر لكم أفضل المنتجات بأسعار تنافسية مع ضمان الجودة",
      footerText_ar: "جميع الحقوق محفوظة © 2025 | على ضمانتي | للشكاوى: 201144586660+",
    });
    s.contact.phone = "01144586660";
    s.contact.whatsapp = "201144586660";
    s.contact.email = "fares.alandals@gmail.com";
    s.contact.address_ar = "مصر";
    s.contact.facebook = "https://facebook.com";
    s.contact.instagram = "https://instagram.com";
    s.contact.tiktok = "https://t.me/MS_Acountant";
    s.payment.vodafoneCash = { number: "01029121146", name: "أبوعبدالملك", isActive: true };
    s.payment.etisalatCash = { number: "01144586660", name: "أبوعبدالملك", isActive: true };
    s.payment.fawry = { code: "01144586660", instructions_ar: "اذهب لأي فرع فوري وادفع برقم 01144586660", isActive: true };
    s.payment.instaPay = { username: "msabouzeidmsr", instructions_ar: "حول على instapay واكتب اسمك في الملاحظات — الرابط: https://ipn.eg/S/msabouzeidmsr/instapay/72fAcU", isActive: true };
    await s.save();
    console.log("✅ Settings: على ضمانتي");


    // Sample Products
    const Category2 = require("../models/Category");
    const Product = require("../models/Product");
    
    await Product.deleteMany({});
    const cats = await Category2.find({});
    const getCat = (slug) => cats.find(c => c.slug === slug)?._id;

    const sampleProducts = [
      {
        name_ar: "سماعة بلوتوث لاسلكية",
        name_en: "Wireless Bluetooth Headphones",
        description_ar: "سماعة بلوتوث عالية الجودة مع صوت نقي وبطارية تدوم 24 ساعة",
        price: 350, oldPrice: 500, stock: 15,
        category: getCat("electronics"), subcategorySlug: "headphones",
        images: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500"],
        isFeatured: true, isActive: true, brand: "Samsung",
      },
      {
        name_ar: "ساعة ذكية مقاومة للماء",
        name_en: "Smart Watch Waterproof",
        description_ar: "ساعة ذكية متعددة المزايا مع متابعة الصحة وقياس ضغط الدم",
        price: 850, oldPrice: 1200, stock: 8,
        category: getCat("electronics"), subcategorySlug: "smartwatches",
        images: [
          "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500",
          "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=500",
        ],
        isFeatured: true, isActive: true, brand: "Xiaomi",
      },
      {
        name_ar: "هاتف ذكي 128GB",
        name_en: "Smartphone 128GB",
        description_ar: "هاتف ذكي بشاشة AMOLED وكاميرا 108 ميجابكسل وبطارية 5000 مللي أمبير",
        price: 4500, oldPrice: 5500, stock: 5,
        category: getCat("electronics"), subcategorySlug: "smartphones",
        images: [
          "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500",
          "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=500",
          "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500",
        ],
        isFeatured: true, isActive: true, brand: "Samsung",
      },
      {
        name_ar: "خلاط كهربائي متعدد السرعات",
        name_en: "Electric Blender",
        description_ar: "خلاط قوي 1000 واط لتحضير العصائر والمشروبات بسرعات متعددة",
        price: 280, oldPrice: 380, stock: 20,
        category: getCat("home-kitchen"), subcategorySlug: "kitchen-tools",
        images: ["https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=500"],
        isActive: true, brand: "Philips",
      },
      {
        name_ar: "إدناء ماليزي محجبات",
        description_ar: "إدناء محجبات ماليزي ضبل 4 قطع بيزيك كم + خمار ضبل مثلث + نقاب استك + شريط للجبهة",
        price: 120, oldPrice: 180, stock: 30,
        category: getCat("fashion"), subcategorySlug: "women",
        images: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500"],
        isActive: true,
      },
      {
        name_ar: "عسل نحل طبيعي 500جم",
        description_ar: "عسل نحل طبيعي 100% من مناحل مصرية أصيلة، غني بالفيتامينات والمعادن",
        price: 180, stock: 50,
        category: getCat("food"), subcategorySlug: "honey",
        images: ["https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=500"],
        isActive: true,
      },
      {
        name_ar: "قهوة بلاك DXN جانوديرما",
        description_ar: "قهوة صحية فاخرة مع خلاصة الجانوديرما من DXN - 30 كيس",
        price: 220, oldPrice: 280, stock: 25,
        category: getCat("food"),
        images: ["https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=500"],
        isFeatured: true, isActive: true, brand: "DXN",
      },
      {
        name_ar: "لعبة ذكاء للأطفال",
        description_ar: "لعبة تعليمية لتنمية مهارات التفكير والإبداع للأطفال من 3-10 سنوات",
        price: 95, oldPrice: 130, stock: 40,
        category: getCat("toys"), subcategorySlug: "educational",
        images: ["https://images.unsplash.com/photo-1558618047-f4e90e8be949?w=500"],
        isActive: true,
      },
      {
        name_ar: "كتاب سطر آخر - أبوعبدالملك",
        description_ar: "كتاب يأخذك نحو التغيير للمؤلف أبوعبدالملك - طبعة جديدة منقحة",
        price: 75, stock: 100,
        category: getCat("library"), subcategorySlug: "novels",
        images: ["https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500"],
        isFeatured: true, isActive: true,
      },
      {
        name_ar: "زيت زيتون بكر ممتاز 750مل",
        description_ar: "زيت زيتون بكر ممتاز عصر بارد من أجود أصناف الزيتون المصري",
        price: 160, oldPrice: 200, stock: 35,
        category: getCat("food"), subcategorySlug: "olive-oil",
        images: ["https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500"],
        isActive: true,
      },
      {
        name_ar: "حقيبة يد نسائية جلد",
        description_ar: "حقيبة يد نسائية من الجلد الطبيعي، تصميم عصري أنيق بألوان متعددة",
        price: 320, oldPrice: 450, stock: 12,
        category: getCat("fashion"), subcategorySlug: "women",
        images: ["https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500"],
        isActive: true,
      },
      {
        name_ar: "تلبينة شعير طبيعية",
        description_ar: "تلبينة شعير طبيعية 100% غذاء النبي ﷺ - 400 جرام",
        price: 85, stock: 60,
        category: getCat("food"), subcategorySlug: "talbina",
        images: ["https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=500"],
        isActive: true,
      },
    ];

    await Product.insertMany(sampleProducts);
    console.log("✅ " + sampleProducts.length + " sample products added");

    console.log("🎉 Done!");
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
  process.exit();
};

seed();