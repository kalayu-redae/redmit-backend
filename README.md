# Redmit App built in usign modern technologies nodejs,express,postgress and prisma

# a. commands used for redmit app
npm run dev- start the server 
npx prisma studio-show prisma database
npx prisma generate-

# b. The Development Order
    1. User & Authentication 
    2. User profile
    3. Digital Products
    4. Digital Assets
    5. Digital Access
    6. Digital Growth
    7. Redmit Opportunity
    8. Orders
    9. Payments
    10. Reviews
    11. Notifications
    12. Search & filtering
    13. Admin management
    14. Security & optimization

# c. work flows
    1. Design models & Prisma schema ( on schema.prisma)
    2. Migration (npx prisma migrate dev --name create_users)
    3. Prisma generate (npx prisma generate)
    4. Seeder(npx prisma db seed)(on seed.ts)

    5. Validation
    6. Service
    7. Controller
    8. Routes
    
    9. Swagger documentation
    10. Test API
# c. deploy to server
    1. Check development version on local device-clean local project
        npx prisma validate
        npx prisma generate
        npm run build
    2. commit and push the working version to github
        git status
        git add .
        git commit -m "Complete core redmit system"
        git push origin main
    3. deploy to server production always make changes locally-push to github-pull server-run migratio/build/restart
    4. check production environment
        check production server has the required env. for Prisma 7 and prisma.config.ts to configure database url
        do not commit .env
        .gitignore should contain at least (node_modules/,.env,.env.*,!.env.example,uploads,dist)
        careful with uploads/ for storing uploaded files there

    5. Production deployment
        git pull origin main
        npm install
        npx prisma generate
        npx prisma migrate deploy
        npm run build

        pm2 restart redmit-backend or 
        pm2 start dist/server.js --name redmit-backend

        npx prisma migrate deploy
   
# 1. Pull latest code
git pull

# 2. Install ALL dependencies (types are now in dependencies, not devDependencies)
npm install

# 3. Build TypeScript → dist/
npm run build

# 4. Run migrations (never use migrate dev on production)
npx prisma migrate deploy

# 5. Generate Prisma client
npx prisma generate

# 6. Start the server
npm start
