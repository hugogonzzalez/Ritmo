// Estado de los filtros de un listado del admin. Todo es texto: '' significa "sin filtro".
// Las claves coinciden con los parámetros que lee el backend (search, active, sort, page, min_price...).
export type AdminFilterValues = Record<string, string>;

export interface AdminSelectOption {
  value: string;
  label: string;
}

// Desplegable del panel. El texto de cada opción se muestra como "Etiqueta: Opción".
export interface AdminSelectDef {
  key: string;
  label: string;
  options: AdminSelectOption[];
}

// Campo de fecha ("desde" / "hasta") del panel
export interface AdminDateField {
  key: string;
  label: string;
}

// Opciones comunes del filtro de activos/inactivos
export const ADMIN_ACTIVE_OPTIONS: AdminSelectOption[] = [
  { value: 'all', label: 'Todos' },
  { value: 'true', label: 'Activos' },
  { value: 'false', label: 'Inactivos' }
];

// Quita los valores vacíos antes de enviarlos al backend
export const toQueryParams = (values: AdminFilterValues): Record<string, string> =>
  Object.fromEntries(Object.entries(values).filter(([, value]) => value !== '' && value !== undefined));
