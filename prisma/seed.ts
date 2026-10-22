import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { seedRoles } from "./seeds/roles";

// engineType = "client" (see schema.prisma) has no built-in query engine, so
// the client needs the same driver adapter as the app's src/server/db -- a
// bare `new PrismaClient()` throws at runtime. DATABASE_URL comes from
// whichever env file the calling script sourced (.env or .env.production).
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  await seedRoles(prisma);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
