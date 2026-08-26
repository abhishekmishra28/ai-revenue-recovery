import "dotenv/config";
import { prisma } from "../src/lib/prisma";

const main = async () => {
  const event =
    await prisma.revenueEvent.findUnique({
      where: {
        id: "a2a47de9-6658-4397-990b-121a7fc74a42",
      },
      select: {
        id: true,
        processedAt: true,
        recoveryCases: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

  console.log("Revenue Event:");
  console.dir(event, { depth: null });

  if (event?.recoveryCases[0]) {
    const audits =
      await prisma.auditEvent.findMany({
        where: {
          recoveryCaseId:
            event.recoveryCases[0].id,
        },
        orderBy: {
          createdAt: "asc",
        },
      });

    console.log("\nAudit Events:");
    console.dir(audits, { depth: null });
  }

  await prisma.$disconnect();
};

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});