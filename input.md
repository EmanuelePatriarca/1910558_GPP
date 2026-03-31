# SYSTEM DESCRIPTION:

"A Fragile Balance of Power" is a distributed, fault-tolerant seismic analysis platform designed to operate under strict geopolitical constraints. 
The year is 2038, and a global network of covert seismic surveillance devices is continuously monitoring ground vibrations in strategic locations.

The command center is located in a neutral region, which strictly prohibits hosting any cyber services that directly process intelligence data; only lightweight routing services are allowed. To comply with this, the system employs a custom broker in the neutral zone that merely fetches real-time data from the sensors and broadcasts it. The actual data processing (applying FFT on sliding windows to classify Earthquakes, Explosions, or Nuclear events) happens in remote, geographically distributed data centers. Since these data centers can be abruptly destroyed, the platform relies on a replicated architecture with an API Gateway that automatically excludes failed nodes, and a shared database that prevents the duplication of events detected by parallel replicas.

# USER STORIES:

1) As an Operator, I want to receive events classified as "Earthquake" when the frequency is between 0.5 and 3.0 Hz, so that seismic activities are correctly identified.
2) As an Operator, I want to receive events classified as "Conventional Explosion" when the frequency is between 3.0 Hz and 8.0 Hz, so that military activities are correctly identified.
3) As an Operator, I want to receive events classified as "Nuclear-like event" when the frequency is 8.0 Hz or higher, so that nuclear-like activities are correctly identified.
4) As an Operator, I want to view the most recent event occurred for each sensor, so that I'm always aware of the last threat identified for every sensor.
5) As an Operator, I want the most recent event occurred at a sensor to be highlighted with a different colour, so that it is easier to have a clear global view of the various threats.
6) As an Operator, I want last events occurred grouped by sensor category, so that it is easier to distinguish threats identified by different kind of sensors.
7) As an Operator, I want to view general information about a specific sensor, so that I can understand the sensor context.
8) As an Operator, I want to inspect historical events in a tabular data grid, so that I can perform retrospective analysis on past incidents.
9) As an Operator, I want to filter historical events by event type, so that I can focus my analysis exclusively on specific classes of threats.
10) As an Operator, I want to filter historical events by sensor category, so that I can isolate events detected by a specific category of sensors.
11) As an Operator, I want to filter historical events by a specific sensor, so that I can isolate events detected by a specific sensor.
12) As an Operator, I want to filter events based on the event time of occurrence, so that I can focus my analysis exclusively on specific time frame.
13) As an Operator, I want to sort historical events by timestamp, so that I can see the chronological order of incidents.
14) As an Operator, I want the dashboard to be updated live without a manual refresh, so that my situational awareness is never delayed.
15) As an Operator, I want to receive a notification every time a new event occur, so that I do not miss any situational changes.
16) As an Operator, I want to view the last 10 notification received, so that I do not miss any situational changes.
17) As an Operator, I want to visualize the position of a specific sensor on a map, so that I can visually map the origin of the alerts on my monitors.
18) As an Operator, I want to clearly see the total count of filtered events displayed above or within the historical data grid, so that I have an immediate understanding of the overall volume of recorded incidents.
19) As an Operator or Data Analyst, I want to download the history of events as an Excel file, so that I can export historical data for further analysis.
20) As an Operator or Data Analyst, I want the active table filters to be applied to the downloaded Excel file, so that I only export the specific data subset I am currently analyzing.
21) As a Data Analyst, I want a graph that shows live frequency changes for each sensor, so that statistical analyses can be performed.
22) As a Data Analyst, I want a graph that shows the number of events occurred for each sensor, so that statistical analyses can be performed.
23) As a Data Analyst, I want to see a quick summary tooltip showing the breakdown of event types when hovering over a sensor in the event distribution graph, so that I can immediately understand the specific categories of threats detected by that sensor.

# STANDARD SCHEMA EVENT

## DTOs

### `SensorDataInput`

Measurement broadcasted to the replicas by the broker.

```json
{
  "sensor_id": "sensor-01",
  "timestamp": "2026-03-31T16:19:58.682672+00:00",
  "value": -0.153595
}
```

Field meaning:
- `sensor_id`: unique identifier of the sensor
- `timestamp`: UTC ISO-8601 timestamp of the sample
- `value`: signed ground velocity in `mm/s`


### `EventDataResponse`

Generated by the processing services after a Fast Fourier Transform (FFT) analysis of a sliding window of samples.
It is used to send live updates to the gateway and to save considerable event in the database.

```json
{
  "event_id": 1,
  "sensor_id": "sensor-01",
  "timestamp": "2026-03-31T16:19:58.682672+00:00",
  "category_event": "nuclear_like",
  "dominant_frequency": 8.0
}
```

Field meaning:

- `event_id`: unique identifier of the event 
- `sensor_id`: unique identifier of the sensor
- `timestamp`: UTC ISO-8601 timestamp of the last timestamp use to compute FFT
- `category_event`: could be `earthquake`, `conventional_explosion`, `nuclear_like`, or `""` when no event was detected
- `dominant_frequency`: dominant frequency used to classify the event


### `SensorSummary`

General information of a sensor returned to the replicas by the broker (or to the gateway by the processing services).

```json
{
  "id": "sensor-08",
  "name": "DC North Perimeter",
  "category": "datacenter",
  "region": "Replica Datacenter",
  "coordinates": {
    "latitude": 45.4642,
    "longitude": 9.19
  },
  "measurement_unit": "mm/s",
  "sampling_rate_hz": 20.0,
  "websocket_url": "/api/device/sensor-08/ws"
}
```

Field meaning:

- `id`: stable sensor identifier
- `name`: human-readable name
- `category`: either `field` or `datacenter`
- `region`: logical geographic area
- `coordinates`: sensor position
- `measurement_unit`: always `mm/s`
- `sampling_rate_hz`: per-sensor stream sampling rate
- `websocket_url`: WebSocket endpoint for that sensor

### `HealthResponse`

Response returned by the processing services to the gateway when performing health checks

```json
{
  "status": "ok"
}
```

# RULE MODEL:

The business logic for event classification relies on the dominant frequency component extracted from the time-domain measurement using FFT.

- Earthquake: frequency >= 0.5 Hz AND frequency < 3.0 Hz
- Conventional explosion: frequency >= 3.0 Hz AND frequency < 8.0 Hz
- Nuclear-like event: frequency >= 8.0 Hz
