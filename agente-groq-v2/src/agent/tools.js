import { obtenerTiempo } from '../services/tiempo.service.js';

// HERRAMIENTAS: funciones que el agente puede decidir usar
// Cada herramienta tiene 2 partes:
//   1) "definicion": se la enviamos a la IA para que sepa que existe
//   2) "ejecutar":   el código real que se ejecuta en nuestro servidor

export const herramientas = {
  obtener_fecha_hora: {
    definicion: {
      type: 'function',
      function: {
        name: 'obtener_fecha_hora',
        description: 'Devuelve la fecha y hora actual en España',
        parameters: { type: 'object', properties: {} },
      },
    },
    ejecutar: () => {
      return new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' });
    },
  },

  calcular: {
    definicion: {
      type: 'function',
      function: {
        name: 'calcular',
        description: 'Resuelve una operación matemática. Ejemplo: "(12 + 8) * 3"',
        parameters: {
          type: 'object',
          properties: {
            operacion: { type: 'string', description: 'La operación a calcular' },
          },
          required: ['operacion'],
        },
      },
    },
    ejecutar: ({ operacion }) => {
      // Solo permitimos números y + - * / ( ) . para que sea seguro
      if (!/^[0-9+\-*/().\s]+$/.test(operacion)) {
        return 'Operación no válida';
      }
      try {
        const resultado = Function(`"use strict"; return (${operacion})`)();
        return String(resultado);
      } catch {
        return 'No se pudo calcular';
      }
    },
  },

  obtener_tiempo: {
    definicion: {
      type: 'function',
      function: {
        name: 'obtener_tiempo',
        description: 'Devuelve la previsión del tiempo de una ciudad en una fecha (hasta 16 días vista)',
        parameters: {
          type: 'object',
          properties: {
            ciudad: { type: 'string', description: 'Nombre de la ciudad, ej: "Madrid"' },
            fecha: { type: 'string', description: 'Fecha en formato AAAA-MM-DD' },
          },
          required: ['ciudad', 'fecha'],
        },
      },
    },
    // Es "async" porque tiene que esperar la respuesta de internet
    ejecutar: async ({ ciudad, fecha }) => obtenerTiempo(ciudad, fecha),
  },
};

// Lista de definiciones para enviar a la IA
export const definicionesHerramientas = Object.values(herramientas).map((h) => h.definicion);
