import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import argon2 from "argon2";

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

// ─── helpers ───────────────────────────────────────────────────────────────────
const slug = (s: string) => s.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");

async function main() {
    console.log("🌱 Seeding database...\n");

    // ── 1. USERS ────────────────────────────────────────────────────────────────
    const adminHash = await argon2.hash("Admin123!");
    const userHash = await argon2.hash("User123!");

    const admin = await prisma.user.upsert({
        where: { email: "admin@redmit.com" },
        update: {},
        create: {
            email: "admin@redmit.com",
            phone: "+251900000001",
            username: "redmit_admin",
            passwordHash: adminHash,
            fullName: "Redmit Admin",
            role: "ADMIN",
            isVerified: true,
            isActive: true,
        },
    });

    const seller = await prisma.user.upsert({
        where: { email: "seller@redmit.com" },
        update: {},
        create: {
            email: "seller@redmit.com",
            phone: "+251900000002",
            username: "redmit_seller",
            passwordHash: userHash,
            fullName: "Demo Seller",
            role: "USER",
            isVerified: true,
            isActive: true,
        },
    });

    const buyer = await prisma.user.upsert({
        where: { email: "buyer@redmit.com" },
        update: {},
        create: {
            email: "buyer@redmit.com",
            phone: "+251900000003",
            username: "redmit_buyer",
            passwordHash: userHash,
            fullName: "Demo Buyer",
            role: "USER",
            isVerified: true,
            isActive: true,
        },
    });

    console.log("✅ Users:", admin.email, seller.email, buyer.email);

    // ── 2. CATEGORIES ──────────────────────────────────────────────────────────
    const catSoftware = await prisma.category.upsert({
        where: { slug: "software-tools" },
        update: {},
        create: {
            name: "Software & Tools",
            slug: "software-tools",
            description: "Apps, plugins, scripts and developer tools.",
            isActive: true,
        },
    });

    const catDesign = await prisma.category.upsert({
        where: { slug: "design-templates" },
        update: {},
        create: {
            name: "Design & Templates",
            slug: "design-templates",
            description: "UI kits, Figma templates, logo packs and more.",
            isActive: true,
        },
    });

    const catCourses = await prisma.category.upsert({
        where: { slug: "online-courses" },
        update: {},
        create: {
            name: "Online Courses",
            slug: "online-courses",
            description: "Video courses and educational content.",
            isActive: true,
        },
    });

    console.log("✅ Categories:", catSoftware.name, catDesign.name, catCourses.name);

    // ── 3. DIGITAL PRODUCTS ────────────────────────────────────────────────────
    const product1 = await prisma.digitalProduct.upsert({
        where: { slug: "react-dashboard-kit" },
        update: {},
        create: {
            name: "React Dashboard Kit",
            slug: "react-dashboard-kit",
            shortDescription: "A complete React admin dashboard starter kit.",
            description: "Includes 30+ components, dark mode, Tailwind CSS, and full TypeScript support.",
            price: 29.99,
            currency: "USD",
            categoryId: catSoftware.id,
            sellerId: seller.id,
            isActive: true,
        },
    });

    const product2 = await prisma.digitalProduct.upsert({
        where: { slug: "figma-ui-kit-pro" },
        update: {},
        create: {
            name: "Figma UI Kit Pro",
            slug: "figma-ui-kit-pro",
            shortDescription: "2000+ Figma components for modern web apps.",
            description: "Covers forms, tables, cards, navigation, and more. Auto-layout ready.",
            price: 19.99,
            currency: "USD",
            categoryId: catDesign.id,
            sellerId: seller.id,
            isActive: true,
        },
    });

    console.log("✅ Digital Products:", product1.name, product2.name);

    // ── 4. DIGITAL ASSETS ──────────────────────────────────────────────────────
    const asset1 = await prisma.digitalAsset.upsert({
        where: { slug: "tech-instagram-page-50k" },
        update: {},
        create: {
            name: "Tech Instagram Page — 50K Followers",
            slug: "tech-instagram-page-50k",
            type: "SOCIAL_MEDIA_ACCOUNT",
            description: "Engaged tech-niche Instagram page with 50K real followers and 4% engagement rate.",
            price: 350.00,
            currency: "USD",
            sellerId: seller.id,
            isActive: true,
            isSold: false,
        },
    });

    // Create the social media details for asset1
    await prisma.socialMediaAsset.upsert({
        where: { assetId: asset1.id },
        update: {},
        create: {
            assetId: asset1.id,
            platform: "INSTAGRAM",
            username: "techworld_updates",
            followers: 50000,
            following: 1200,
            posts: 430,
            country: "Ethiopia",
            niche: "Technology",
            engagementRate: 4.2,
        },
    });

    const asset2 = await prisma.digitalAsset.upsert({
        where: { slug: "youtube-channel-finance-10k" },
        update: {},
        create: {
            name: "Finance YouTube Channel — 10K Subs",
            slug: "youtube-channel-finance-10k",
            type: "SOCIAL_MEDIA_ACCOUNT",
            description: "Monetized YouTube channel in the personal finance niche with consistent monthly revenue.",
            price: 800.00,
            currency: "USD",
            sellerId: seller.id,
            isActive: true,
            isSold: false,
        },
    });

    await prisma.socialMediaAsset.upsert({
        where: { assetId: asset2.id },
        update: {},
        create: {
            assetId: asset2.id,
            platform: "YOUTUBE",
            username: "SmartFinanceET",
            followers: 10000,
            posts: 85,
            views: 850000,
            country: "Ethiopia",
            niche: "Personal Finance",
            monthlyRevenue: 120.00,
            revenueCurrency: "USD",
        },
    });

    console.log("✅ Digital Assets:", asset1.name, asset2.name);

    // ── 5. DIGITAL ACCESS ──────────────────────────────────────────────────────
    const access1 = await prisma.digitalAccess.upsert({
        where: { slug: "nodejs-mastery-course" },
        update: {},
        create: {
            name: "Node.js Mastery Course",
            slug: "nodejs-mastery-course",
            type: "ONLINE_COURSE",
            description: "Complete Node.js course covering REST APIs, authentication, databases, and deployment.",
            price: 49.99,
            currency: "USD",
            providerId: seller.id,
            isActive: true,
        },
    });

    const access2 = await prisma.digitalAccess.upsert({
        where: { slug: "adobe-creative-cloud-1yr" },
        update: {},
        create: {
            name: "Adobe Creative Cloud — 1 Year",
            slug: "adobe-creative-cloud-1yr",
            type: "SOFTWARE_SUBSCRIPTION",
            description: "Full Adobe Creative Cloud subscription for 1 year including Photoshop, Illustrator, Premiere Pro.",
            price: 89.99,
            currency: "USD",
            providerId: seller.id,
            isActive: true,
        },
    });

    console.log("✅ Digital Access:", access1.name, access2.name);

    // ── 6. DIGITAL GROWTH ──────────────────────────────────────────────────────
    const growth1 = await prisma.digitalGrowth.upsert({
        where: { slug: "instagram-promotion-10k-reach" },
        update: {},
        create: {
            name: "Instagram Promotion — 10K Reach",
            slug: "instagram-promotion-10k-reach",
            type: "INSTAGRAM_ADS",
            description: "Targeted Instagram promotion reaching 10,000 accounts in your niche within 7 days.",
            price: 25.00,
            currency: "USD",
            providerId: seller.id,
            isActive: true,
        },
    });

    const growth2 = await prisma.digitalGrowth.upsert({
        where: { slug: "tiktok-monetization-setup" },
        update: {},
        create: {
            name: "TikTok Monetization Setup",
            slug: "tiktok-monetization-setup",
            type: "SOCIAL_MEDIA_MONETIZATION",
            description: "Full TikTok account monetization setup service — eligibility check, strategy, and content plan.",
            price: 40.00,
            currency: "USD",
            providerId: seller.id,
            isActive: true,
        },
    });

    console.log("✅ Digital Growth:", growth1.name, growth2.name);

    // ── 7. BANK ACCOUNTS ───────────────────────────────────────────────────────
    const bank1 = await prisma.bankAccount.upsert({
        where: { id: "00000000-0000-0000-0000-000000000001" },
        update: {},
        create: {
            id: "00000000-0000-0000-0000-000000000001",
            bankName: "Commercial Bank of Ethiopia",
            accountName: "Redmit Market PLC",
            accountNumber: "1000123456789",
            phoneNumber: "+251911000001",
            accountType: "Business",
            instructions: "Transfer the exact amount and include your order number as the reference.",
            isActive: true,
        },
    });

    const bank2 = await prisma.bankAccount.upsert({
        where: { id: "00000000-0000-0000-0000-000000000002" },
        update: {},
        create: {
            id: "00000000-0000-0000-0000-000000000002",
            bankName: "Awash Bank",
            accountName: "Redmit Market PLC",
            accountNumber: "0142345678901",
            phoneNumber: "+251911000002",
            accountType: "Business",
            instructions: "Use your order number as the payment reference.",
            isActive: true,
        },
    });

    console.log("✅ Bank Accounts:", bank1.bankName, bank2.bankName);

    // ── 8. ORDERS ──────────────────────────────────────────────────────────────
    const order1 = await prisma.order.upsert({
        where: { orderNumber: "ORD-SEED-000001" },
        update: {},
        create: {
            orderNumber: "ORD-SEED-000001",
            buyerId: buyer.id,
            subtotal: 29.99,
            discount: 0,
            tax: 0,
            total: 29.99,
            currency: "USD",
            status: "PENDING",
            items: {
                create: [
                    {
                        type: "DIGITAL_PRODUCT",
                        name: product1.name,
                        quantity: 1,
                        unitPrice: 29.99,
                        totalPrice: 29.99,
                        currency: "USD",
                        digitalProductId: product1.id,
                    },
                ],
            },
        },
    });

    const order2 = await prisma.order.upsert({
        where: { orderNumber: "ORD-SEED-000002" },
        update: {},
        create: {
            orderNumber: "ORD-SEED-000002",
            buyerId: buyer.id,
            subtotal: 49.99,
            discount: 0,
            tax: 0,
            total: 49.99,
            currency: "USD",
            status: "CONFIRMED",
            items: {
                create: [
                    {
                        type: "DIGITAL_ACCESS",
                        name: access1.name,
                        quantity: 1,
                        unitPrice: 49.99,
                        totalPrice: 49.99,
                        currency: "USD",
                        digitalAccessId: access1.id,
                    },
                ],
            },
        },
    });

    console.log("✅ Orders:", order1.orderNumber, order2.orderNumber);

    // ── 9. PAYMENTS ────────────────────────────────────────────────────────────
    const payment1 = await prisma.payment.upsert({
        where: { paymentNumber: "PAY-SEED-000001" },
        update: {},
        create: {
            paymentNumber: "PAY-SEED-000001",
            orderId: order1.id,
            userId: buyer.id,
            method: "MANUAL_BANK_TRANSFER",
            status: "PROCESSING",
            amount: 29.99,
            currency: "USD",
            bankAccountId: bank1.id,
            manualStatus: "PENDING_VERIFICATION",
        },
    });

    const payment2 = await prisma.payment.upsert({
        where: { paymentNumber: "PAY-SEED-000002" },
        update: {},
        create: {
            paymentNumber: "PAY-SEED-000002",
            orderId: order2.id,
            userId: buyer.id,
            method: "MANUAL_BANK_TRANSFER",
            status: "COMPLETED",
            amount: 49.99,
            currency: "USD",
            bankAccountId: bank2.id,
            manualStatus: "VERIFIED",
            transactionReference: "TXN-SEED-AWASH-001",
            verifiedById: admin.id,
            verifiedAt: new Date(),
            paidAt: new Date(),
        },
    });

    console.log("✅ Payments:", payment1.paymentNumber, payment2.paymentNumber);

    // ── 10. OPPORTUNITIES ──────────────────────────────────────────────────────
    const opp1 = await prisma.opportunity.upsert({
        where: { slug: "erasmus-mundus-scholarship-2026" },
        update: {},
        create: {
            title: "Erasmus Mundus Scholarship 2026",
            slug: "erasmus-mundus-scholarship-2026",
            type: "SCHOLARSHIP",
            description: "Fully funded master's scholarship program offered by the European Union to students worldwide. Covers tuition, travel, and living expenses.",
            organization: "European Commission",
            location: "Europe (Multiple Countries)",
            eligibility: "Open to all nationalities. Bachelor's degree required.",
            requirements: "CV, motivation letter, academic transcripts, two reference letters.",
            benefits: "Full tuition waiver, monthly stipend of €1,000, travel allowance.",
            sourceUrl: "https://erasmus-plus.ec.europa.eu",
            applicationUrl: "https://erasmus-plus.ec.europa.eu/apply",
            deadline: new Date("2026-01-31"),
            isPublished: true,
        },
    });

    const opp2 = await prisma.opportunity.upsert({
        where: { slug: "google-summer-of-code-2026" },
        update: {},
        create: {
            title: "Google Summer of Code 2026",
            slug: "google-summer-of-code-2026",
            type: "INTERNSHIP",
            description: "A global program focused on bringing more student developers into open source software development. Work remotely with a mentoring organization.",
            organization: "Google",
            location: "Remote",
            eligibility: "Open to students 18+ enrolled in a post-secondary academic program.",
            requirements: "Application form, project proposal, coding background.",
            benefits: "Stipend between $1,500–$6,600 depending on country.",
            sourceUrl: "https://summerofcode.withgoogle.com",
            applicationUrl: "https://summerofcode.withgoogle.com/register",
            deadline: new Date("2026-04-02"),
            isPublished: true,
        },
    });

    const opp3 = await prisma.opportunity.upsert({
        where: { slug: "african-union-youth-fellowship" },
        update: {},
        create: {
            title: "African Union Youth Volunteer Corps",
            slug: "african-union-youth-fellowship",
            type: "FELLOWSHIP",
            description: "The AU Youth Volunteer Corps deploys young Africans to support development projects across the continent.",
            organization: "African Union Commission",
            location: "Various African Countries",
            eligibility: "African nationals aged 18–35 with a university degree.",
            requirements: "Application form, CV, motivational essay.",
            benefits: "Monthly living allowance, accommodation, health insurance.",
            sourceUrl: "https://au.int/en/youth-volunteers",
            applicationUrl: "https://youth.au.int/volunteers/apply",
            deadline: new Date("2026-06-30"),
            isPublished: true,
        },
    });

    console.log("✅ Opportunities:", opp1.title, opp2.title, opp3.title);

    console.log("\n🎉 Seeding complete!");
    console.log("─────────────────────────────────────────");
    console.log("  Admin:   admin@redmit.com  /  Admin123!");
    console.log("  Seller:  seller@redmit.com /  User123!");
    console.log("  Buyer:   buyer@redmit.com  /  User123!");
    console.log("─────────────────────────────────────────");
}

main()
    .catch((error) => {
        console.error("❌ Seed failed:", error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
