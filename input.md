# SYSTEM DESCRIPTION:

"A Fragile Balance of Power" is a distributed, fault-tolerant seismic analysis platform designed to operate under strict geopolitical constraints. The year is 2038, and a global network of covert seismic surveillance devices is continuously monitoring ground vibrations in strategic locations.

The command center is located in a neutral region, which strictly prohibits hosting any cyber services that directly process intelligence data; only lightweight routing services are allowed. To comply with this, the system employs a custom broker in the neutral zone that merely fetches real-time data from the sensors and broadcasts it. The actual data processing (applying FFT on sliding windows to classify Earthquakes, Explosions, or Nuclear events) happens in remote, geographically distributed data centers. Since these data centers can be abruptly destroyed, the platform relies on a replicated architecture with an API Gateway that automatically excludes failed nodes, and a shared database that prevents the duplication of events detected by parallel replicas.

# USER STORIES:

1) As a System Administrator, I want the broker to connect to sensor WebSockets, so that the platform can ingest real-time seismic data streams continuously
2) As a System Administrator, I want the broker to broadcast the ingested data to the processing service replicas without altering or analyzing it, so that our operations strictly comply with the neutral region's regulations
3) As a System Administrator, I want the processing service to maintain a sliding window of recent samples for each sensor, so that continuous data streams can be analyzed accurately over a specific timeframe
4) As a System Administrator, I want the processing service to apply a Discrete Fourier Transform on the data windows, so that the dominant frequency components of ground vibrations can be extracted
5) As a System Administrator, I want the processing service to classify events as "Earthquake" when the frequency is between 0.5 and 3.0 Hz, so that seismic activities are correctly identified
6) As a System Administrator, I want the processing service to classify events as "Conventional explosion" when the frequency is between 3.0 and 8.0 Hz, so that military activities are correctly identified
7) As a System Administrator, I want the processing service to classify events as "Nuclear-like event" when the frequency is 8.0 Hz or higher, so that nuclear-like activities are correctly identified
8) As a System Administrator, I want replicas to shut down immediately upon receiving a "SHUTDOWN" command, so that we can validate the system's fault tolerance
9) As a System Administrator, I want the processing service to be replicated, so that the system can be fault tolerant
10) As a Database Administrator, I want the replicas to persist detected events, so that an history of events is stored for further analyses
11) As a Database Administrator, I want the database to enforce a composite unique constraint (by sensor, event type, and time), so that the system actively prevents duplicate event records at the data level
12) As a Network Administrator, I want a single entry point (API Gateway) for the entire system, so that frontend requests are routed securely to the available backend services
13) As a Network Administrator, I want the API Gateway to perform continuous health checks on processing service replicas, so that failed or destroyed nodes are automatically excluded from the routing pool
14) As a Command Center Operator, I want to view a monitoring dashboard, so that I can keep track of ongoing seismic threats globally from a single interface
15) As a Command Center Operator, I want to receive live event updates on the dashboard without having to refresh the page, so that my situational awareness is never delayed
16) As a Command Center Operator, I want to inspect historical seismic events in a tabular data grid, so that I can perform retrospective analysis on past incidents
17) As a Command Center Operator, I want to filter historical events by event type, so that I can focus my analysis exclusively on specific classes of threats
18) As a Command Center Operator, I want to filter historical events by sensor and sensor category, so that I can isolate military or seismic activities detected by a specific sensor or category of sensors
19) As a Command Center Operator, I want to filter events based on the event time of occurence, so that I can focus my analysis exclusively on specific time frame
20) As a Command Center Operator, I want to view the geographical coordinates of the sensors, so that I can visually map the origin of the alerts on my monitors
