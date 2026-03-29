export enum SensorEventRequestEnum {
  EARTHQUAKE = 'earthquake',
  CONVENTIONAL_EXPLOSION = 'conventional_explosion',
  NUCLEAR_LIKE = 'nuclear_like'
}

export enum SensorCategoryEnum {
  FIELD = 'field',
  DATACENTER = 'datacenter'
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Sensor {
  id: string;
  name: string;
  category: SensorCategoryEnum;
  region: string;
  coordinates: Coordinates;
  measurement_unit: string;
  sampling_rate_hz: number;
  websocket_url: string;
}

export interface Event {
  id?: string; // Opzionale lato FE, assente dall'API
  sensor_id: string; // Aggiunto per relazionare evento a sensore
  category_event: SensorEventRequestEnum;
  dominant_frequency: number;
  timestamp: Date; // Added per UI needs (history table)
}

// Interfaccia UI estesa usata per la Dashboard
export interface SensorDashboardState extends Sensor {
  lastEvent?: Event;
}
