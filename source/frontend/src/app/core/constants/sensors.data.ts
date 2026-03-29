import { Sensor, SensorCategoryEnum } from '../models/sensor.model';

export const STATIC_SENSORS: Sensor[] = [
  {
    id: "sensor-01",
    name: "Borealis Ridge",
    category: SensorCategoryEnum.FIELD,
    region: "North Atlantic",
    coordinates: {
      latitude: 64.1466,
      longitude: -21.9426
    },
    measurement_unit: "mm/s",
    sampling_rate_hz: 20,
    websocket_url: "/api/device/sensor-01/ws"
  },
  {
    id: "sensor-02",
    name: "Atlas Escarpment",
    category: SensorCategoryEnum.FIELD,
    region: "Mediterranean Basin",
    coordinates: {
      latitude: 36.8065,
      longitude: 10.1815
    },
    measurement_unit: "mm/s",
    sampling_rate_hz: 20,
    websocket_url: "/api/device/sensor-02/ws"
  },
  {
    id: "sensor-03",
    name: "Kestrel Basin",
    category: SensorCategoryEnum.FIELD,
    region: "Central Asia",
    coordinates: {
      latitude: 41.2995,
      longitude: 69.2401
    },
    measurement_unit: "mm/s",
    sampling_rate_hz: 20,
    websocket_url: "/api/device/sensor-03/ws"
  },
  {
    id: "sensor-04",
    name: "Ember Fault",
    category: SensorCategoryEnum.FIELD,
    region: "East Africa",
    coordinates: {
      latitude: -1.2921,
      longitude: 36.8219
    },
    measurement_unit: "mm/s",
    sampling_rate_hz: 20,
    websocket_url: "/api/device/sensor-04/ws"
  },
  {
    id: "sensor-05",
    name: "Helios Shelf",
    category: SensorCategoryEnum.FIELD,
    region: "Aegean Arc",
    coordinates: {
      latitude: 37.9838,
      longitude: 23.7275
    },
    measurement_unit: "mm/s",
    sampling_rate_hz: 20,
    websocket_url: "/api/device/sensor-05/ws"
  },
  {
    id: "sensor-06",
    name: "Tundra Line",
    category: SensorCategoryEnum.FIELD,
    region: "Northern Frontier",
    coordinates: {
      latitude: 59.9139,
      longitude: 10.7522
    },
    measurement_unit: "mm/s",
    sampling_rate_hz: 20,
    websocket_url: "/api/device/sensor-06/ws"
  },
  {
    id: "sensor-07",
    name: "Argent Plateau",
    category: SensorCategoryEnum.FIELD,
    region: "South Atlantic",
    coordinates: {
      latitude: -34.6037,
      longitude: -58.3816
    },
    measurement_unit: "mm/s",
    sampling_rate_hz: 20,
    websocket_url: "/api/device/sensor-07/ws"
  },
  {
    id: "sensor-08",
    name: "DC North Perimeter",
    category: SensorCategoryEnum.DATACENTER,
    region: "Replica Datacenter",
    coordinates: {
      latitude: 45.4642,
      longitude: 9.19
    },
    measurement_unit: "mm/s",
    sampling_rate_hz: 20,
    websocket_url: "/api/device/sensor-08/ws"
  },
  {
    id: "sensor-09",
    name: "DC East Cooling Hall",
    category: SensorCategoryEnum.DATACENTER,
    region: "Replica Datacenter",
    coordinates: {
      latitude: 45.4655,
      longitude: 9.193
    },
    measurement_unit: "mm/s",
    sampling_rate_hz: 20,
    websocket_url: "/api/device/sensor-09/ws"
  },
  {
    id: "sensor-10",
    name: "DC South Power Bus",
    category: SensorCategoryEnum.DATACENTER,
    region: "Replica Datacenter",
    coordinates: {
      latitude: 45.462,
      longitude: 9.1915
    },
    measurement_unit: "mm/s",
    sampling_rate_hz: 20,
    websocket_url: "/api/device/sensor-10/ws"
  },
  {
    id: "sensor-11",
    name: "DC West Access Tunnel",
    category: SensorCategoryEnum.DATACENTER,
    region: "Replica Datacenter",
    coordinates: {
      latitude: 45.4632,
      longitude: 9.1878
    },
    measurement_unit: "mm/s",
    sampling_rate_hz: 20,
    websocket_url: "/api/device/sensor-11/ws"
  },
  {
    id: "sensor-12",
    name: "DC Core Slab",
    category: SensorCategoryEnum.DATACENTER,
    region: "Replica Datacenter",
    coordinates: {
      latitude: 45.4648,
      longitude: 9.1893
    },
    measurement_unit: "mm/s",
    sampling_rate_hz: 20,
    websocket_url: "/api/device/sensor-12/ws"
  }
];
