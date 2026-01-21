import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProductSchema, insertShiftSchema, insertTransactionSchema, insertTransactionItemSchema, insertCategorySchema } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { pushToGitHub, getGitHubUser } from "./github";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // ===== PRODUCTS =====
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      console.error("Get products error:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Get product error:", error);
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const validated = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validated);
      res.status(201).json(product);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: fromZodError(error).toString() });
      }
      console.error("Create product error:", error);
      res.status(500).json({ error: "Failed to create product" });
    }
  });

  app.patch("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.updateProduct(req.params.id, req.body);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Update product error:", error);
      res.status(500).json({ error: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const success = await storage.deleteProduct(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Delete product error:", error);
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  // ===== SHIFTS =====
  app.get("/api/shifts/active", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const shift = await storage.getActiveShift(req.user.id);
      res.json(shift || null);
    } catch (error) {
      console.error("Get active shift error:", error);
      res.status(500).json({ error: "Failed to fetch active shift" });
    }
  });

  app.get("/api/shifts", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const shifts = await storage.getUserShifts(req.user.id);
      res.json(shifts);
    } catch (error) {
      console.error("Get shifts error:", error);
      res.status(500).json({ error: "Failed to fetch shifts" });
    }
  });

  app.post("/api/shifts", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      // Check if user already has an open shift
      const existing = await storage.getActiveShift(req.user.id);
      if (existing) {
        return res.status(400).json({ error: "You already have an open shift" });
      }

      const validated = insertShiftSchema.parse({
        ...req.body,
        userId: req.user.id,
      });
      
      const shift = await storage.createShift(validated);
      res.status(201).json(shift);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: fromZodError(error).toString() });
      }
      console.error("Create shift error:", error);
      res.status(500).json({ error: "Failed to open shift" });
    }
  });

  app.post("/api/shifts/:id/close", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const { endCash } = req.body;
      if (!endCash) {
        return res.status(400).json({ error: "End cash amount is required" });
      }

      // Verify shift belongs to user and is open
      const existingShift = await storage.getShift(req.params.id);
      if (!existingShift) {
        return res.status(404).json({ error: "Shift not found" });
      }
      if (existingShift.userId !== req.user.id) {
        return res.status(403).json({ error: "You can only close your own shift" });
      }
      if (existingShift.status !== 'open') {
        return res.status(400).json({ error: "Shift is already closed" });
      }

      const shift = await storage.closeShift(req.params.id, endCash);
      res.json(shift);
    } catch (error) {
      console.error("Close shift error:", error);
      res.status(500).json({ error: "Failed to close shift" });
    }
  });

  // ===== TRANSACTIONS =====
  app.post("/api/transactions", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { transaction, items } = req.body;
      
      // Verify shift belongs to user and is open
      const shift = await storage.getShift(transaction.shiftId);
      if (!shift) {
        return res.status(404).json({ error: "Shift not found" });
      }
      if (shift.userId !== req.user.id) {
        return res.status(403).json({ error: "Shift does not belong to you" });
      }
      if (shift.status !== 'open') {
        return res.status(400).json({ error: "Cannot add transactions to a closed shift" });
      }

      // Validate stock availability
      for (const item of items) {
        const product = await storage.getProduct(item.productId);
        if (!product) {
          return res.status(400).json({ error: `Product ${item.productId} not found` });
        }
        if (product.stock < item.quantity) {
          return res.status(400).json({ error: `Insufficient stock for ${product.name}` });
        }
      }

      const validatedTransaction = insertTransactionSchema.parse({
        ...transaction,
        userId: req.user.id,
      });
      
      const validatedItems = z.array(insertTransactionItemSchema).parse(items);
      
      const newTransaction = await storage.createTransaction(validatedTransaction, validatedItems);
      res.status(201).json(newTransaction);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: fromZodError(error).toString() });
      }
      console.error("Create transaction error:", error);
      res.status(500).json({ error: "Failed to create transaction" });
    }
  });

  app.get("/api/transactions", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const transactions = await storage.getTransactions(limit);
      res.json(transactions);
    } catch (error) {
      console.error("Get transactions error:", error);
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  app.get("/api/transactions/shift/:shiftId", async (req, res) => {
    try {
      const transactions = await storage.getTransactionsByShift(req.params.shiftId);
      res.json(transactions);
    } catch (error) {
      console.error("Get shift transactions error:", error);
      res.status(500).json({ error: "Failed to fetch shift transactions" });
    }
  });

  app.get("/api/transactions/:id/items", async (req, res) => {
    try {
      const items = await storage.getTransactionItems(req.params.id);
      res.json(items);
    } catch (error) {
      console.error("Get transaction items error:", error);
      res.status(500).json({ error: "Failed to fetch transaction items" });
    }
  });

  // ===== DASHBOARD STATS =====
  app.get("/api/stats", async (req, res) => {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 7;
      const stats = await storage.getSalesStats(days);
      res.json(stats);
    } catch (error) {
      console.error("Get stats error:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.get("/api/stats/weekly", async (req, res) => {
    try {
      const weeklyData = await storage.getWeeklySales();
      res.json(weeklyData);
    } catch (error) {
      console.error("Get weekly stats error:", error);
      res.status(500).json({ error: "Failed to fetch weekly stats" });
    }
  });

  app.get("/api/stats/categories", async (req, res) => {
    try {
      const categoryData = await storage.getCategorySales();
      res.json(categoryData);
    } catch (error) {
      console.error("Get category stats error:", error);
      res.status(500).json({ error: "Failed to fetch category stats" });
    }
  });

  // ===== CATEGORIES =====
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Get categories error:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const validated = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(validated);
      res.status(201).json(category);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: fromZodError(error).toString() });
      }
      if (error.code === '23505') {
        return res.status(400).json({ error: "Category already exists" });
      }
      console.error("Create category error:", error);
      res.status(500).json({ error: "Failed to create category" });
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    try {
      const success = await storage.deleteCategory(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Delete category error:", error);
      res.status(500).json({ error: "Failed to delete category" });
    }
  });

  // ===== GITHUB =====
  app.get("/api/github/user", async (req, res) => {
    try {
      const user = await getGitHubUser();
      res.json({ login: user.login, name: user.name, avatar_url: user.avatar_url });
    } catch (error) {
      console.error("Get GitHub user error:", error);
      res.status(500).json({ error: "Failed to get GitHub user" });
    }
  });

  app.post("/api/github/push", async (req, res) => {
    try {
      const { repoName, description, isPrivate } = req.body;
      if (!repoName) {
        return res.status(400).json({ error: "Repository name is required" });
      }
      const result = await pushToGitHub(
        repoName || 'propos-app',
        description || 'ProPOS - Professional Point of Sale System',
        isPrivate || false
      );
      res.json(result);
    } catch (error: any) {
      console.error("Push to GitHub error:", error);
      res.status(500).json({ error: error.message || "Failed to push to GitHub" });
    }
  });

  return httpServer;
}
