export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Curricula Visualiser API',
    version: '1.0.0',
    description: 'Backend API for visualization and comparison of curricula.',
  },
  servers: [{ url: '/api' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  paths: {
    '/auth/register': { post: { summary: 'Register user', tags: ['Auth'] } },
    '/auth/login': { post: { summary: 'Login user', tags: ['Auth'] } },
    '/auth/me': { get: { summary: 'Current user', tags: ['Auth'], security: [{ bearerAuth: [] }] } },
    '/curricula': { get: { summary: 'List curricula', tags: ['Curricula'] } },
    '/curricula/{id}': { get: { summary: 'Get curriculum', tags: ['Curricula'] } },
    '/curricula/{id}/disciplines': {
      get: { summary: 'Get curriculum disciplines', tags: ['Curricula'] },
    },
    '/curricula/{id}/validation': {
      get: { summary: 'Validate imported curriculum structure and data', tags: ['Curricula'] },
    },
    '/curricula/import-fit': {
      post: { summary: 'Import curricula from FIT folder', tags: ['Curricula'] },
    },
    '/specialities': { get: { summary: 'List specialities', tags: ['Specialities'] } },
    '/specialities/{id}': { get: { summary: 'Get speciality', tags: ['Specialities'] } },
    '/comparison': { get: { summary: 'Compare two curricula', tags: ['Comparison'] } },
    '/profile/favorites': { get: { summary: 'Get favorites', tags: ['Profile'] } },
    '/profile/favorites/{curriculumId}': {
      post: { summary: 'Add favorite', tags: ['Profile'] },
      delete: { summary: 'Remove favorite', tags: ['Profile'] },
    },
    '/profile/history': { get: { summary: 'Get view history', tags: ['Profile'] } },
    '/downloads/curricula/{id}': { get: { summary: 'Download source plan', tags: ['Downloads'] } },
    '/downloads/curricula/{id}/discipline-map': {
      get: { summary: 'Get discipline map JSON', tags: ['Downloads'] },
    },
    '/downloads/comparison': {
      get: { summary: 'Get comparison JSON', tags: ['Downloads'] },
    },
  },
};
