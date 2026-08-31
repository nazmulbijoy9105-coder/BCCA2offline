import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  app.disable("x-powered-by");

  app.use(express.json({
    limit: "1mb",
  }));

  app.use(cookieParser());

  /*
   * Identity/security middleware is intentionally applied
   * before identity routes.
   */
  const { enforceTrustedOrigin } =
    await import("./server/middleware/security");

  app.use("/api", enforceTrustedOrigin);

  app.get("/api/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
    });
  });

  const { default: authRouter } =
    await import("./server/routes/auth");

  app.use("/api/auth", authRouter);

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
      },
      appType: "spa",
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");

    app.use(express.static(distPath));

    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(
      `Server running on http://0.0.0.0:${PORT}`,
    );
  });
}

startServer().catch((error) => {
  console.error("Fatal server startup error:", error);
  process.exit(1);
});
