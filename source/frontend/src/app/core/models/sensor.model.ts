/** Tipi di eventi sismici categorizzabili */
export enum SensorEventRequestEnum {
  EARTHQUAKE = 'earthquake',
  CONVENTIONAL_EXPLOSION = 'conventional_explosion',
  NUCLEAR_LIKE = 'nuclear_like'
}

/** Categorie di sensori (Campo o DataCenter) */
export enum SensorCategoryEnum {
  FIELD = 'field',
  DATACENTER = 'datacenter'
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/** Dati tecnici di un singolo sensore sismico */
export interface Sensor {
  id: string;
  name: string;
  category: SensorCategoryEnum;
  region: string;
  coordinates: Coordinates;
  measurement_unit: string;
  sampling_rate_hz: number;
}

/** Rappresentazione di una singola lettura/evento */
export interface Event {
  id?: string;
  sensor_id: string;
  // Se undefined, l'evento è considerato grezzo (uncategorized)
  category_event?: SensorEventRequestEnum;  
  dominant_frequency: number;
  timestamp: Date;
}

// Interfaccia UI estesa usata per la Dashboard
export interface SensorDashboardState extends Sensor {
  lastEvent?: Event;
}
