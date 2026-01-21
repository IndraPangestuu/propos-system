import type { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import type { User } from "@shared/schema";
import MemoryStore from "memorystore";

const MemoryStoreSession = MemoryStore(session);

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export function setupAuth(app: Express) {
  // Session middleware
  app.use(
    session({
      store: new MemoryStoreSession({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
      secret: process.env.SESSION_SECRET || "propos-secret-key-change-in-production",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      },
    })
  );

  // Login route
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Store user in session (exclude password)
      const { password: _, ...userWithoutPassword } = user;
      (req.session as any).user = userWithoutPassword;

      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Logout route
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Get current user
  app.get("/api/auth/me", (req: Request, res: Response) => {
    const user = (req.session as any).user;
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    res.json({ user });
  });

  // Middleware to check authentication
  app.use((req: Request, res: Response, next: NextFunction) => {
    const user = (req.session as any).user;
    if (user) {
      req.user = user;
    }
    next();
  });
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}
