// Previsión del tiempo para un día de concierto (respuesta de /api/tiempo/concierto)
export interface TiempoDia {
  disponible: boolean;
  motivo?: string;
  ciudad?: string;
  fecha?: string;
  descripcion?: string;
  icono?: string;
  maxima?: number;
  minima?: number;
  probabilidadLluvia?: number;
}

export interface TiempoConcierto {
  tiempo: TiempoDia;
  consejo: string | null;
}
