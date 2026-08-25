import swaggerJSDoc from "swagger-jsdoc";


const options: swaggerJSDoc.Options = {
    definition: {
        openapi: "3.0.3",

        info: {
            title: "Redmit API",
            version: "1.0.0",
            description:
                "API documentation for the Redmit digital marketplace.",
        },

        servers: [
            {
                url: "http://localhost:5000",
                description: "Development server",
            },
        ],

        tags: [
            {
                name: "Authentication",
                description: "Authentication and account access",
            },
            {
                name: "Users",
                description: "User profile management",
            },
            {
                name: "Digital Products",
                description: "Digital product marketplace",
            },
            {
                name: "Digital Assets",
                description: "Digital asset marketplace",
            },
            {
                name: "Digital Access",
                description: "Digital access services",
            },
            {
                name: "Digital Growth",
                description: "Digital growth and advertising services",
            },
        ],

        components: {
            schemas: {
                RegisterRequest: {
                    type: "object",
                    required: [
                        "email",
                        "username",
                        "password",
                    ],
                    properties: {
                        email: {
                            type: "string",
                            format: "email",
                            example: "john@example.com",
                        },

                        username: {
                            type: "string",
                            example: "john",
                        },

                        password: {
                            type: "string",
                            format: "password",
                            example: "Password123!",
                        },

                        displayName: {
                            type: "string",
                            example: "John Doe",
                        },
                    },
                },

                User: {
                    type: "object",
                    properties: {
                        id: {
                            type: "string",
                            format: "uuid",
                        },

                        email: {
                            type: "string",
                            format: "email",
                        },

                        username: {
                            type: "string",
                        },

                        displayName: {
                            type: "string",
                            nullable: true,
                        },

                        avatarUrl: {
                            type: "string",
                            nullable: true,
                        },

                        role: {
                            type: "string",
                            enum: ["USER", "ADMIN"],
                        },

                        isVerified: {
                            type: "boolean",
                        },

                        isActive: {
                            type: "boolean",
                        },

                        createdAt: {
                            type: "string",
                            format: "date-time",
                        },
                    },
                },
            },
        },
    },

    apis: [
        "./src/modules/**/*.routes.ts",
        "./src/modules/**/*.controller.ts",
    ],
};

export const swaggerSpec = swaggerJSDoc(options);