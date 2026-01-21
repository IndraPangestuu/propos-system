import { db } from "./storage";
import { users, products } from "@shared/schema";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("🌱 Seeding database...");

  // Create demo users
  const hashedAdminPassword = await bcrypt.hash("admin123", 10);
  const hashedEmployeePassword = await bcrypt.hash("kasir123", 10);

  const demoUsers = [
    {
      email: "admin@pos.com",
      password: hashedAdminPassword,
      name: "Admin User",
      role: "admin",
    },
    {
      email: "kasir@pos.com",
      password: hashedEmployeePassword,
      name: "Cashier 01",
      role: "employee",
    },
  ];

  console.log("Creating demo users...");
  for (const user of demoUsers) {
    try {
      await db.insert(users).values(user).onConflictDoNothing();
    } catch (error) {
      console.log(`User ${user.email} might already exist, skipping...`);
    }
  }

  // Create demo products
  const demoProducts = [
    {
      name: "Espresso Intenso",
      category: "Coffee",
      price: "3.50",
      stock: 45,
      image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&q=80",
    },
    {
      name: "Cappuccino Royale",
      category: "Coffee",
      price: "4.50",
      stock: 28,
      image: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&q=80",
    },
    {
      name: "Matcha Green Tea Latte",
      category: "Tea",
      price: "5.00",
      stock: 15,
      image: "https://images.unsplash.com/photo-1515825838458-f2a94b20105a?w=400&q=80",
    },
    {
      name: "Blueberry Muffin",
      category: "Bakery",
      price: "3.25",
      stock: 12,
      image: "https://images.unsplash.com/photo-1558303420-f814d8a590f5?w=400&q=80",
    },
    {
      name: "Chocolate Croissant",
      category: "Bakery",
      price: "3.75",
      stock: 8,
      image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&q=80",
    },
    {
      name: "Iced Caramel Macchiato",
      category: "Cold Drinks",
      price: "5.50",
      stock: 50,
      image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&q=80",
    },
    {
      name: "Avocado Toast",
      category: "Food",
      price: "8.50",
      stock: 10,
      image: "https://images.unsplash.com/photo-1588137372308-15f75323ca8d?w=400&q=80",
    },
    {
      name: "Berry Smoothie Bowl",
      category: "Food",
      price: "9.00",
      stock: 5,
      image: "https://images.unsplash.com/photo-1626078436812-780c13e094d4?w=400&q=80",
    },
    {
      name: "Mineral Water",
      category: "Cold Drinks",
      price: "1.50",
      stock: 100,
      image: "https://images.unsplash.com/photo-1564414277413-4a0b22f60579?w=400&q=80",
    },
    {
      name: "Fresh Orange Juice",
      category: "Cold Drinks",
      price: "4.00",
      stock: 20,
      image: "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400&q=80",
    },
  ];

  console.log("Creating demo products...");
  for (const product of demoProducts) {
    try {
      await db.insert(products).values(product).onConflictDoNothing();
    } catch (error) {
      console.log(`Product ${product.name} might already exist, skipping...`);
    }
  }

  console.log("✅ Seeding complete!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("❌ Seeding failed:", error);
  process.exit(1);
});
