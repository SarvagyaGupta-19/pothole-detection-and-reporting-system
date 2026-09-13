git add services/ml-inference/
git commit -m "Add ML pothole detection"
git push -u origin main

git add web/src/app/api/auth/
git commit -m "Add authentication API routes"
git push origin main

git add web/src/app/api/reports/
git commit -m "Create report API endpoints"
git push origin main

git add web/src/app/api/upload/
git commit -m "Implement S3 image upload"
git push origin main

git add web/prisma/ web/src/lib/prisma.ts
git commit -m "Setup Postgres schema"
git push origin main

git add web/src/components/
git commit -m "Build shared UI components"
git push origin main

git add web/src/app/page.tsx web/src/app/login/
git commit -m "Create app landing page"
git push origin main

git add web/src/app/report/
git commit -m "Implement pothole reporting"
git push origin main

git add web/src/app/dashboard/ web/src/lib/email.ts
git commit -m "Add dashboard and email logic"
git push origin main

git add web/
git commit -m "Add frontend configs and layouts"
git push origin main

git add .
git commit -m "Add project configurations"
git push origin main
