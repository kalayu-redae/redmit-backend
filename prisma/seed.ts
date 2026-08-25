import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import argon2 from "argon2";

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
    adapter,
});

async function main() {
    const passwordHash = await argon2.hash(
        "Admin123!"
    );

    const admin = await prisma.user.upsert({

        where: {
            email: "admin@redmit.com",
        },
        update: {},
        create: {
            email: "admin@redmit.com",
            phone: "+251943662611",
            username: "admin",
            passwordHash,
            fullName: "Redmit Admin",
            role: "ADMIN",
            isVerified: true,
            isActive: true,
        },
    });

    console.log("Admin created:", admin.email);
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });