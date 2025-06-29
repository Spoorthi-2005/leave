import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeDemoData } from "./demo-data";
import { initializeUniversityData } from "./university-data";
import { securityConfig } from "./security";

const app = express();

// Enhanced security headers
app.use(securityConfig.middleware.headers);

// Rate limiting for general requests
app.use(securityConfig.rateLimits.general);

// Enhanced CORS configuration to fix DOMException
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'Set-Cookie'],
  exposedHeaders: ['Set-Cookie']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Input sanitization for all requests
app.use(securityConfig.middleware.sanitizeInput);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  
  // Graceful shutdown handling to prevent EADDRINUSE
  process.on('SIGTERM', () => {
    server.close(() => {
      console.log('Server closed gracefully');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    server.close(() => {
      console.log('Server closed gracefully');
      process.exit(0);
    });
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} is busy, retrying in 2 seconds...`);
      setTimeout(() => {
        server.close();
        server.listen(port, "0.0.0.0", async () => {
          log(`serving on port ${port}`);
          await initializeDemoData();
        });
      }, 2000);
    } else {
      console.error('Server error:', err);
    }
  });

  server.listen(port, "0.0.0.0", async () => {
    log(`serving on port ${port}`);
    // Initialize demo data after server starts
    await initializeDemoData();
  });
})();
