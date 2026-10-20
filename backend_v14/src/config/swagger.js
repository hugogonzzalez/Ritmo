const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de conciertos',
      version: '1.0.0',
      description: 'API REST para consultar y gestionar conciertos'
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`
      }
    ],
    components: {
      schemas: {
        Concert: {
          type: 'object',
          required: ['title'],
          properties: {
            _id: { type: 'string' },
            title: { type: 'string', maxLength: 120 },
            description: { type: 'string', maxLength: 500 },
            slug: { type: 'string' },
            status: { type: 'string', example: 'public' },
            artistIds: { type: 'array', items: { type: 'string' } },
            categoryIds: { type: 'array', items: { type: 'string' } },
            isActive: { type: 'boolean', example: true },
            deletedAt: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time', nullable: true },
            __v: { type: 'number' }
          }
        },
        Performance: {
          type: 'object',
          required: ['concertId', 'venueId', 'city', 'startsAt', 'price'],
          properties: {
            _id: { type: 'string' },
            concertId: { type: 'string' },
            slug: { type: 'string' },
            venueId: { type: 'string' },
            city: { type: 'string', maxLength: 80 },
            startsAt: { type: 'string', format: 'date-time' },
            endsAt: { type: 'string', format: 'date-time', nullable: true },
            price: { type: 'number', minimum: 0 },
            bookedParticipants: { type: 'integer', minimum: 0 },
            status: { type: 'string', enum: ['scheduled', 'full', 'cancelled', 'completed'] },
            artistIds: { type: 'array', items: { type: 'string' } },
            isActive: { type: 'boolean', example: true },
            deletedAt: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time', nullable: true }
          }
        },
        Venue: {
          type: 'object',
          required: ['name', 'address', 'city', 'capacity'],
          properties: {
            _id: { type: 'string' },
            name: { type: 'string', maxLength: 120 },
            slug: { type: 'string' },
            description: { type: 'string', maxLength: 500 },
            address: { type: 'string', maxLength: 200 },
            city: { type: 'string', maxLength: 80 },
            capacity: { type: 'integer', minimum: 1 },
            images: { type: 'array', items: { type: 'string' }, description: 'Ids de imágenes' },
            website: { type: 'string' },
            status: { type: 'string', enum: ['active', 'maintenance', 'closed'] },
            isActive: { type: 'boolean', example: true },
            deletedAt: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time', nullable: true }
          }
        },
        ValidationErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error de validación' },
            errors: {
              type: 'array',
              items: { type: 'object' }
            }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js']
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;