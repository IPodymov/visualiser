import { PrismaClient } from '@prisma/client';
import '../src/config/env';

const prisma = new PrismaClient();

const groups = [
  {
    code: 'CURRICULAR_REPORT',
    name: 'Curricular report',
    values: ['CE', 'CS', 'CSEC', 'IS', 'IT', 'SE', 'DS'],
  },
  {
    code: 'COMPUTING_AREA',
    name: 'Computing area',
    values: [
      'Hardware',
      'Software',
      'Security',
      'IT Platforms and Infrastructure',
      'Digital Transformation and Intelligence',
    ],
  },
  {
    code: 'COMPUTING_LAYER',
    name: 'Computing layer',
    values: ['Computing Foundations', 'Computing Technology'],
  },
  {
    code: 'ORIENTATION_AXIS',
    name: 'Orientation axis',
    values: ['Domain Activity Enabled by Computing', 'Organizational Needs'],
  },
];

const main = async () => {
  for (const group of groups) {
    const createdGroup = await prisma.classificationGroup.upsert({
      where: { code: group.code },
      create: { code: group.code, name: group.name },
      update: { name: group.name },
    });

    for (const value of group.values) {
      await prisma.classificationValue.upsert({
        where: {
          groupId_code: {
            groupId: createdGroup.id,
            code: value,
          },
        },
        create: {
          groupId: createdGroup.id,
          code: value,
          name: value,
        },
        update: { name: value },
      });
    }
  }
};

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
