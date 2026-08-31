import swaggerJSDoc from "swagger-jsdoc";

const options: swaggerJSDoc.Options = {
    definition: {
        openapi: "3.0.3",

        info: {
            title: "Redmit API",
            version: "1.0.0",
            description: "API documentation for the Redmit digital marketplace.",
        },

        servers: [
            {
                url: process.env.API_URL || "http://localhost:5000",
                description: "API server",
            },
        ],

        tags: [
            { name: "Authentication", description: "Register, login, and manage your own account" },
            { name: "Users", description: "Admin — user management" },
            { name: "Files", description: "File upload and retrieval" },
            { name: "Categories", description: "Product categories" },
            { name: "Digital Products", description: "Digital product listings" },
            { name: "Digital Assets", description: "Digital asset marketplace (social accounts, websites, etc.)" },
            { name: "Digital Access", description: "Digital access service listings" },
            { name: "Digital Growth", description: "Digital growth and advertising service listings" },
            { name: "Orders", description: "Order management" },
            { name: "Payments", description: "Payment processing" },
            { name: "Bank Accounts", description: "Admin — bank account management for manual transfers" },
            { name: "Opportunities", description: "Scholarships, jobs, internships and other opportunities" },
        ],

        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                    description: "Enter your JWT token: Bearer <token>",
                },
            },

            schemas: {
                // ── Shared ────────────────────────────────────────────────
                Pagination: {
                    type: "object",
                    properties: {
                        total: { type: "integer", example: 100 },
                        page: { type: "integer", example: 1 },
                        limit: { type: "integer", example: 10 },
                        totalPages: { type: "integer", example: 10 },
                    },
                },

                File: {
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        filename: { type: "string" },
                        originalName: { type: "string" },
                        mimeType: { type: "string" },
                        size: { type: "integer" },
                        url: { type: "string" },
                        createdAt: { type: "string", format: "date-time" },
                    },
                },

                // ── Auth ──────────────────────────────────────────────────
                RegisterRequest: {
                    type: "object",
                    required: ["email", "phone", "username", "password", "fullName"],
                    properties: {
                        email: { type: "string", format: "email", example: "john@example.com" },
                        phone: { type: "string", example: "+1234567890" },
                        username: { type: "string", example: "john_doe" },
                        password: { type: "string", format: "password", example: "Password123!" },
                        fullName: { type: "string", example: "John Doe" },
                        avatar: { type: "string", format: "binary", description: "Optional profile picture" },
                    },
                },

                LoginRequest: {
                    type: "object",
                    required: ["password"],
                    description: "Provide one of email, phone, or username.",
                    properties: {
                        email: { type: "string", format: "email", example: "john@example.com" },
                        username: { type: "string", example: "john_doe" },
                        phone: { type: "string", example: "+1234567890" },
                        password: { type: "string", format: "password", example: "Password123!" },
                    },
                },

                // ── User ──────────────────────────────────────────────────
                User: {
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        email: { type: "string", format: "email" },
                        phone: { type: "string" },
                        username: { type: "string" },
                        fullName: { type: "string", nullable: true },
                        avatarUrl: { type: "string", nullable: true },
                        role: { type: "string", enum: ["USER", "ADMIN"] },
                        isVerified: { type: "boolean" },
                        isActive: { type: "boolean" },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" },
                    },
                },

                // ── Category ──────────────────────────────────────────────
                Category: {
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        name: { type: "string" },
                        slug: { type: "string" },
                        description: { type: "string", nullable: true },
                        isActive: { type: "boolean" },
                        image: { $ref: "#/components/schemas/File", nullable: true },
                        createdAt: { type: "string", format: "date-time" },
                    },
                },

                // ── Bank Account ──────────────────────────────────────────
                BankAccount: {
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        bankName: { type: "string" },
                        accountName: { type: "string" },
                        accountNumber: { type: "string" },
                        phoneNumber: { type: "string", nullable: true },
                        accountType: { type: "string", nullable: true },
                        instructions: { type: "string", nullable: true },
                        logoUrl: { type: "string", nullable: true },
                        isActive: { type: "boolean" },
                        createdAt: { type: "string", format: "date-time" },
                    },
                },

                // ── Order ─────────────────────────────────────────────────
                CreateOrderRequest: {
                    type: "object",
                    required: ["items"],
                    properties: {
                        currency: { type: "string", example: "USD", default: "USD" },
                        items: {
                            type: "array",
                            minItems: 1,
                            items: {
                                type: "object",
                                required: ["type", "id"],
                                properties: {
                                    type: { type: "string", enum: ["DIGITAL_PRODUCT", "DIGITAL_ASSET", "DIGITAL_ACCESS", "DIGITAL_GROWTH"] },
                                    id: { type: "string", format: "uuid" },
                                    quantity: { type: "integer", minimum: 1, default: 1 },
                                },
                            },
                        },
                    },
                },

                Order: {
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        orderNumber: { type: "string", example: "ORD-1234567890-ABCDEF" },
                        status: { type: "string", enum: ["PENDING", "CONFIRMED", "CANCELLED"] },
                        subtotal: { type: "number" },
                        discount: { type: "number" },
                        tax: { type: "number" },
                        total: { type: "number" },
                        currency: { type: "string", example: "USD" },
                        createdAt: { type: "string", format: "date-time" },
                    },
                },

                // ── Opportunity ──────────────────────────────────────────
                Opportunity: {
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        title: { type: "string" },
                        slug: { type: "string" },
                        type: {
                            type: "string",
                            enum: [
                                "SCHOLARSHIP",
                                "JOB",
                                "INTERNSHIP",
                                "FELLOWSHIP",
                                "COMPETITION",
                                "GRANT",
                                "TRAINING",
                                "VOLUNTEER",
                            ],
                        },
                        description: { type: "string" },
                        organization: { type: "string", nullable: true },
                        location: { type: "string", nullable: true },
                        eligibility: { type: "string", nullable: true },
                        requirements: { type: "string", nullable: true },
                        benefits: { type: "string", nullable: true },
                        sourceUrl: { type: "string", nullable: true },
                        applicationUrl: { type: "string" },
                        deadline: { type: "string", format: "date-time", nullable: true },
                        isPublished: { type: "boolean" },
                        thumbnail: {
                            nullable: true,
                            allOf: [{ $ref: "#/components/schemas/File" }],
                        },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" },
                    },
                },

                // ── Payment ───────────────────────────────────────────────
                Payment: {
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        paymentNumber: { type: "string", example: "PAY-1234567890-ABCDEF" },
                        status: { type: "string", enum: ["PENDING", "PROCESSING", "COMPLETED", "FAILED", "CANCELLED"] },
                        manualStatus: { type: "string", enum: ["NOT_REQUIRED", "PENDING_VERIFICATION", "VERIFIED", "REJECTED"] },
                        method: { type: "string", enum: ["MANUAL_BANK_TRANSFER"] },
                        amount: { type: "number" },
                        currency: { type: "string", example: "USD" },
                        transactionReference: { type: "string", nullable: true },
                        rejectionReason: { type: "string", nullable: true },
                        createdAt: { type: "string", format: "date-time" },
                    },
                },
            },
        },
    },

    apis: ["./src/modules/**/*.routes.ts"],
};

export const swaggerSpec = swaggerJSDoc(options);
