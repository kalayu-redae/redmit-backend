import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.js";
import path from "path";
import authRoutes from "./modules/auth/auth.routes.js";
import fileRoutes from "./modules/file/file.routes.js";
import userRoutes from "./modules/user/user.routes.js";
import categoryRoutes from "./modules/category/category.routes.js";
import productRoutes from "./modules/digitalProduct/product.routes.js";
import assetRoutes from "./modules/digitalAsset/asset.routes.js";
import accessRoutes from "./modules/digitalAccess/access.routes.js";
import growthRoutes from "./modules/digitalGrowth/growth.routes.js";
import orderRoutes from "./modules/order/order.routes.js";
import accountRoutes from "./modules/bankAccount/account.routes.js";
import paymentRoutes from "./modules/payment/payment.routes.js";
import opportunityRoutes from "./modules/digitalOpportunity/opportunity.routes.js";
const app = express();
// ── CORS ───────────────────────────────────────────────────────────────────────
// Allows the frontend (any kalayuredae.com subdomain or localhost) to call the API
const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://redmit.kalayuredae.com",
    "https://www.redmit.kalayuredae.com",
    "https://redmitapi.kalayuredae.com",
    "https://redmitters.com",
    "https://www.redmitters.com",
];
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, Swagger UI)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes(origin))
            return callback(null, true);
        callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.get("/", (_req, res) => {
    res.status(200).json({
        status: 1,
        message: "Welcome to Redmit API v1.0.0",
    });
});
app.use("/api/auth", authRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/access", accessRoutes);
app.use("/api/growth", growthRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/bank-accounts", accountRoutes);
app.use("/api/opportunities", opportunityRoutes);
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
export default app;
