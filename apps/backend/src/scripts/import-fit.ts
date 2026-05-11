import { prisma } from '../config/prisma';
import { importFitCurricula } from '../modules/curricula/fit-importer.service';

const main = async () => {
  const result = await importFitCurricula();
  console.log(JSON.stringify(result, null, 2));
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
