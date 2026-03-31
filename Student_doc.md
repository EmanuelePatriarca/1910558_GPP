# SYSTEM DESCRIPTION:

"A Fragile Balance of Power" is a distributed, fault-tolerant seismic analysis platform designed to operate under strict geopolitical constraints. The year is 2038, and a global network of covert seismic surveillance devices is continuously monitoring ground vibrations in strategic locations.

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


# CONTAINERS:

## CONTAINER_NAME: Gateway

### DESCRIPTION: 
Provides a single Point of Access (API Gateway/Load Balancer) for all the incoming requests for the entire system, routing them to the frontend or the backend replicas while actively monitoring node health.

### USER STORIES:
None

### PORTS: 
80:80
8404:8404

### PERSISTENCE EVALUATION
No persistence is required for the Gateway container, as it only routes requests to the backend services and does not store any data.

### EXTERNAL SERVICES CONNECTIONS
The gateway container does not connect to external services.

### MICROSERVICES:

#### MICROSERVICE: gateway
- TYPE: middleware
- DESCRIPTION: This microservice acts as a reverse proxy using HAProxy, providing load balancing via roundrobin and continuous health checks to exclude failed processing service replicas from the pool.
- PORTS: 80, 8404
- TECHNOLOGICAL SPECIFICATION:
The microservice is implemented using HAProxy, configured as a high-performance reverse proxy and load balancer. It leverages Docker's internal DNS resolver for dynamic container discovery and HAProxy's native features for HTTP traffic inspection and exposing a statistics dashboard.
- SERVICE ARCHITECTURE: 
The gateway service uses a simple architecture where HAProxy is configured to route requests to the backend services based on the URL path. The gateway service also provides a health check endpoint that can be used to monitor the health of the backend services.

# CONTAINERS:

## CONTAINER_NAME: Broker

### DESCRIPTION: 
A custom, lightweight message broker situated in the neutral zone. It ingests real-time seismic data from sensor WebSockets and broadcasts the stream to multiple connected backend replicas without performing any processing.

### USER STORIES:
None

### PORTS: 
9000:8000

### PERSISTENCE EVALUATION
The broker container does not include a database and operates entirely in memory, storing active WebSocket connections to comply with neutral region regulations.

### EXTERNAL SERVICES CONNECTIONS
The broker container does not connect to external services.

### MICROSERVICES:

#### MICROSERVICE: custom_broker
- TYPE: backend
- DESCRIPTION: A FastAPI-based WebSocket broker that manages multiple simultaneous connections, acting as a pass-through layer for raw sensor data.
- PORTS: 8000
- TECHNOLOGICAL SPECIFICATION:
Developed in Python using FastAPI, Uvicorn, and standard WebSockets.
- SERVICE ARCHITECTURE: 
Features a centralized Connection Manager that accepts incoming WebSocket streams and broadcasts messages to all connected clients (replicas).

- ENDPOINTS: 
		
	| HTTP METHOD | URL | Description | User Stories |
	| ----------- | --- | ----------- | ------------ |
    | GET | / | Returns the basic status and a welcome message from the broker | - |
	| GET | /api/devices | Retrieves the list of available sensors by querying the external simulator | 18, 20 |
	| WS | /ws/stream | Listening endpoint to which processing service replicas connect to receive the real-time broadcast of seismic data streams | 1, 2 |

# CONTAINERS:

## CONTAINER_NAME: Processing Service

### DESCRIPTION: 
The core analytical engine of the platform. Deployed as a scalable cluster (10 replicas), it ingests broadcasted data, applies Fast Fourier Transform (FFT) on sliding windows, classifies seismic events, and persists the results. It also handles controlled shutdowns for fault-tolerance testing.

### USER STORIES:
1) As an Operator, I want to receive events classified as "Earthquake" when the frequency is between 0.5 and 3.0 Hz, so that seismic activities are correctly identified.
2) As an Operator, I want to receive events classified as "Conventional Explosion" when the frequency is between 3.0 Hz and 8.0 Hz, so that military activities are correctly identified.
3) As an Operator, I want to receive events classified as "Nuclear-like event" when the frequency is 8.0 Hz or higher, so that nuclear-like activities are correctly identified.
7) As an Operator, I want to view general information about a specific sensor, so that I can understand the sensor context.
8) As an Operator, I want to inspect historical events in a tabular data grid, so that I can perform retrospective analysis on past incidents.
14) As an Operator, I want the dashboard to be updated live without a manual refresh, so that my situational awareness is never delayed.

### PORTS: 
8000:8000

### PERSISTENCE EVALUATION
The processing_service container does not persist data internally; it relies on the `postgres_db` container to save classified events.

### EXTERNAL SERVICES CONNECTIONS
The processing_service container does not connect to external services.

### MICROSERVICES:

#### MICROSERVICE: processing_service
- TYPE: backend
- DESCRIPTION: Manages complex business logic including sliding windows, Discrete Fourier Transforms (DFT), and event classification. Features a replicated deployment (10 replicas) to ensure fault tolerance.
- PORTS: 8000
- TECHNOLOGICAL SPECIFICATION:
Developed in Python using FastAPI. Relies on Uvicorn, Pydantic for data validation, and async programming paradigms.
- SERVICE ARCHITECTURE:
Uses application "lifespan" async context managers to run background tasks that listen to WebSockets and SSEs. Exposes RESTful endpoints and an SSE streaming endpoint routed into separate API modules (`history_api`, `events_sse_api`, `health_api`).

- ENDPOINTS:
		
	| HTTP METHOD | URL | Description | User Stories |
	| ----------- | --- | ----------- | ------------ |
    | GET | /health | Returns health status (used by API Gateway) | 13 |
    | GET | /history | Retrieves filtered historical seismic events | 16, 17, 18, 19 |
    | GET | /streaming | Server-Sent Events (SSE) stream for live updates | 15 |
	| GET | /api/devices | Retrieves a list of available sensors | 18, 20 |

# CONTAINERS:

## CONTAINER_NAME: postgres_db

### DESCRIPTION: 
Relational database responsible for securely and persistently storing all seismic events analyzed by the processing replicas.

### USER STORIES:
None

### PORTS: 
5432:5432

### PERSISTENCE EVALUATION
High persistence. Data is permanently stored on disk using Docker Volumes (`postgres_data`).

### EXTERNAL SERVICES CONNECTIONS
Does not connect to external services.

### MICROSERVICES:

#### MICROSERVICE: postgres_db
- TYPE: database
- DESCRIPTION: A PostgreSQL database instance configured with specific tables and constraints to store seismic intelligence data.
- PORTS: 5432
- TECHNOLOGICAL SPECIFICATION:
PostgreSQL

- DB STRUCTURE:

	**_seismic_events_** :	| **_event_id_** (SERIAL) | sensor_id (VARCHAR) | timestamp (TIMESTAMPTZ) | category_event (VARCHAR) | dominant_frequency (DOUBLE PRECISION) |

# CONTAINERS:

## CONTAINER_NAME: frontend

### DESCRIPTION: 
The graphical interface of the Command Center, offering operators real-time dashboard visualization and historical data analysis tools.

### USER STORIES:
4) As an Operator, I want to view the most recent event occurred for each sensor, so that I'm always aware of the last threat identified for every sensor.
5) As an Operator, I want the most recent event occurred at a sensor to be highlighted with a different colour, so that it is easier to have a clear global view of the various threats.
6) As an Operator, I want last events occurred grouped by sensor category, so that it is easier to distinguish threats identified by different kind of sensors.
9) As an Operator, I want to filter historical events by event type, so that I can focus my analysis exclusively on specific classes of threats.
10) As an Operator, I want to filter historical events by sensor category, so that I can isolate events detected by a specific category of sensors.
11) As an Operator, I want to filter historical events by a specific sensor, so that I can isolate events detected by a specific sensor.
12) As an Operator, I want to filter events based on the event time of occurrence, so that I can focus my analysis exclusively on specific time frame.
13) As an Operator, I want to sort historical events by timestamp, so that I can see the chronological order of incidents.
15) As an Operator, I want to receive a notification every time a new event occur, so that I do not miss any situational changes.
16) As an Operator, I want to view the last 10 notification received, so that I do not miss any situational changes.
17) As an Operator, I want to visualize the position of a specific sensor on a map, so that I can visually map the origin of the alerts on my monitors.
18) As an Operator, I want to clearly see the total count of filtered events displayed above or within the historical data grid, so that I have an immediate understanding of the overall volume of recorded incidents.
19) As an Operator or Data Analyst, I want to download the history of events as an Excel file, so that I can export historical data for further analysis.
20) As an Operator or Data Analyst, I want the active table filters to be applied to the downloaded Excel file, so that I only export the specific data subset I am currently analyzing.
21) As a Data Analyst, I want a graph that shows live frequency changes for each sensor, so that statistical analyses can be performed.
22) As a Data Analyst, I want a graph that shows the number of events occurred for each sensor, so that statistical analyses can be performed.
23) As a Data Analyst, I want to see a quick summary tooltip showing the breakdown of event types when hovering over a sensor in the event distribution graph, so that I can immediately understand the specific categories of threats detected by that sensor.

### PORTS: 
Internal

### PERSISTENCE EVALUATION
No database included. Stores temporary state locally during the browser session.

### EXTERNAL SERVICES CONNECTIONS
Does not connect to external services.

### MICROSERVICES:

#### MICROSERVICE: frontend
- TYPE: frontend
- DESCRIPTION: A single-page application (SPA) that acts as the Command Center Dashboard, subscribing to SSE events and fetching historical data.
- PORTS: Internal
- TECHNOLOGICAL SPECIFICATION:
Developed using the Angular framework (TypeScript). Styling and responsive layouts are achieved using Tailwind CSS. It leverages RxJS observables to manage incoming SSE streams and complex asynchronous state efficiently.

- PAGES:

	| Name | Description | Related Microservice | User Stories |
	| ---- | ----------- | -------------------- | ------------ |
	Dashboard | Main operator view containing the live event feed, the historical data grid, date range pickers, and chart visualizer | gateway | 4, 5, 6, 9, 10, 11, 12, 13, 15, 16, 17, 18, 19, 20, 21, 22, 23 |

# CONTAINERS:

## CONTAINER_NAME: simulator

### DESCRIPTION: 
Generates the raw seismic data stream to emulate the covert surveillance devices and issues control commands (like SHUTDOWN).

### PORTS: 
8080:8080

### MICROSERVICES:

#### MICROSERVICE: simulator
- TYPE: Utility
- DESCRIPTION: Pre-built Docker image (`seismic-signal-simulator:multiarch_v1`) acting as the data source.
- PORTS: 8080