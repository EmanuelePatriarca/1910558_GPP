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
}

export interface Event {
  id?: string;
  sensor_id: string;
  category_event?: SensorEventRequestEnum;  // undefined = uncategorized, silently ignored
  dominant_frequency: number;
  timestamp: Date;
}

// Interfaccia UI estesa usata per la Dashboard
export interface SensorDashboardState extends Sensor {
  lastEvent?: Event;
}
