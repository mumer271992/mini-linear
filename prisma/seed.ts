import { PrismaClient } from "../src/generated/prisma/client";
import { seedRoles } from "./seeds/roles";

const prisma = new PrismaClient();

async function main() {
  await seedRoles(prisma);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
