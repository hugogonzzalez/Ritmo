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
          required: ['title', 'venue', 'city', 'date', 'price'],
          properties: {
            _id: { type: 'string' },
            title: { type: 'string', maxLength: 120 },
            venue: { type: 'string', maxLength: 120 },
            city: { type: 'string', maxLength: 80 },
            date: { type: 'string', format: 'date-time' },
            price: { type: 'number', minimum: 0 },
            description: { type: 'string', maxLength: 500 },
            slug: { type: 'string' },
            status: { type: 'string', example: 'public' },
            isActive: { type: 'boolean', example: true },
            deletedAt: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time', nullable: true },
            __v: { type: 'number' }
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