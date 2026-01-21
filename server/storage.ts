import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { eq, and, desc, sql } from "drizzle-orm";
import { 
  users, products, shifts, transactions, transactionItems, categories,
  type User, type InsertUser,
  type Product, type InsertProduct, type UpdateProduct,
  type Shift, type InsertShift,
  type Transaction, type InsertTransaction,
  type TransactionItem, type InsertTransactionItem,
  type Category, type InsertCategory
} from "@shared/schema";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
});

export const db = drizzle(pool);

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: UpdateProduct): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;
  
  // Shifts
  getShift(id: string): Promise<Shift | undefined>;
  getActiveShift(userId: string): Promise<Shift | undefined>;
  getUserShifts(userId: string): Promise<Shift[]>;
  createShift(shift: InsertShift): Promise<Shift>;
  closeShift(id: string, endCash: string): Promise<Shift | undefined>;
  
  // Transactions
  createTransaction(transaction: InsertTransaction, items: InsertTransactionItem[]): Promise<Transaction>;
  getTransactions(limit?: number): Promise<Transaction[]>;
  getTransactionsByShift(shiftId: string): Promise<Transaction[]>;
  
  // Dashboard
  getSalesStats(days?: number): Promise<any>;
  getWeeklySales(): Promise<any[]>;
  getCategorySales(): Promise<any[]>;
  
  // Transaction Items
  getTransactionItems(transactionId: string): Promise<TransactionItem[]>;
  
  // Categories
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  deleteCategory(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async getProducts(): Promise<Product[]> {
    return await db.select().from(products).orderBy(desc(products.createdAt));
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
    return result[0];
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const result = await db.insert(products).values(product).returning();
    return result[0];
  }

  async updateProduct(id: string, product: UpdateProduct): Promise<Product | undefined> {
    const result = await db
      .update(products)
      .set({ ...product, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return result[0];
  }

  async deleteProduct(id: string): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id)).returning();
    return result.length > 0;
  }

  async getShift(id: string): Promise<Shift | undefined> {
    const result = await db.select().from(shifts).where(eq(shifts.id, id)).limit(1);
    return result[0];
  }

  async getActiveShift(userId: string): Promise<Shift | undefined> {
    const result = await db
      .select()
      .from(shifts)
      .where(and(eq(shifts.userId, userId), eq(shifts.status, "open")))
      .limit(1);
    return result[0];
  }

  async getUserShifts(userId: string): Promise<Shift[]> {
    return await db
      .select()
      .from(shifts)
      .where(eq(shifts.userId, userId))
      .orderBy(desc(shifts.startTime));
  }

  async createShift(shift: InsertShift): Promise<Shift> {
    const result = await db.insert(shifts).values(shift).returning();
    return result[0];
  }

  async closeShift(id: string, endCash: string): Promise<Shift | undefined> {
    const result = await db
      .update(shifts)
      .set({
        status: "closed",
        endTime: new Date(),
        endCash,
      })
      .where(eq(shifts.id, id))
      .returning();
    return result[0];
  }

  async createTransaction(
    transaction: InsertTransaction,
    items: InsertTransactionItem[]
  ): Promise<Transaction> {
    const result = await db.transaction(async (tx) => {
      // Insert transaction
      const [newTransaction] = await tx.insert(transactions).values(transaction).returning();

      // Insert transaction items
      if (items.length > 0) {
        const itemsWithTransactionId = items.map((item) => ({
          ...item,
          transactionId: newTransaction.id,
        }));
        await tx.insert(transactionItems).values(itemsWithTransactionId);
      }

      // Update shift totals
      await tx
        .update(shifts)
        .set({
          totalSales: sql`${shifts.totalSales} + ${transaction.total}`,
          transactionCount: sql`${shifts.transactionCount} + 1`,
        })
        .where(eq(shifts.id, transaction.shiftId));

      // Update product stock
      for (const item of items) {
        await tx
          .update(products)
          .set({
            stock: sql`${products.stock} - ${item.quantity}`,
          })
          .where(eq(products.id, item.productId));
      }

      return newTransaction;
    });

    return result;
  }

  async getTransactions(limit: number = 50): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .orderBy(desc(transactions.createdAt))
      .limit(limit);
  }

  async getTransactionsByShift(shiftId: string): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.shiftId, shiftId))
      .orderBy(desc(transactions.createdAt));
  }

  async getSalesStats(days: number = 7): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result = await db
      .select({
        total: sql<number>`COALESCE(SUM(CAST(${transactions.total} AS DECIMAL)), 0)`,
        count: sql<number>`COUNT(${transactions.id})`,
      })
      .from(transactions)
      .where(sql`${transactions.createdAt} >= ${startDate}`);

    return result[0];
  }

  async getWeeklySales(): Promise<any[]> {
    const result = await db
      .select({
        date: sql<string>`TO_CHAR(${transactions.createdAt}, 'YYYY-MM-DD')`,
        sales: sql<number>`COALESCE(SUM(CAST(${transactions.total} AS DECIMAL)), 0)`,
      })
      .from(transactions)
      .where(sql`${transactions.createdAt} >= NOW() - INTERVAL '7 days'`)
      .groupBy(sql`TO_CHAR(${transactions.createdAt}, 'YYYY-MM-DD')`)
      .orderBy(sql`TO_CHAR(${transactions.createdAt}, 'YYYY-MM-DD')`);

    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const weekData = [];
    const resultMap = new Map(result.map((r: any) => [r.date, Number(r.sales)]));
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const dayName = days[date.getDay()];
      weekData.push({
        name: dayName,
        sales: resultMap.get(dateStr) || 0,
      });
    }
    return weekData;
  }

  async getCategorySales(): Promise<any[]> {
    const result = await db
      .select({
        category: transactionItems.productName,
        total: sql<number>`COALESCE(SUM(CAST(${transactionItems.total} AS DECIMAL)), 0)`,
      })
      .from(transactionItems)
      .groupBy(transactionItems.productName)
      .orderBy(sql`SUM(CAST(${transactionItems.total} AS DECIMAL)) DESC`)
      .limit(5);

    return result.map((r: any) => ({
      name: r.category,
      sales: parseFloat(r.total),
    }));
  }

  async getTransactionItems(transactionId: string): Promise<TransactionItem[]> {
    return await db
      .select()
      .from(transactionItems)
      .where(eq(transactionItems.transactionId, transactionId));
  }

  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(categories.name);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const result = await db.insert(categories).values(category).returning();
    return result[0];
  }

  async deleteCategory(id: string): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id)).returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
