# SYSTEM DESCRIPTION:

"A Fragile Balance of Power" is a distributed, fault-tolerant seismic analysis platform designed to operate under strict geopolitical constraints. The year is 2038, and a global network of covert seismic surveillance devices is continuously monitoring ground vibrations in strategic locations.

The command center is located in a neutral region, which strictly prohibits hosting any cyber services that directly process intelligence data; only lightweight routing services are allowed. To comply with this, the system employs a custom broker in the neutral zone that merely fetches real-time data from the sensors and broadcasts it. The actual data processing (applying FFT on sliding windows to classify Earthquakes, Explosions, or Nuclear events) happens in remote, geographically distributed data centers. Since these data centers can be abruptly destroyed, the platform relies on a replicated architecture with an API Gateway that automatically excludes failed nodes, and a shared database that prevents the duplication of events detected by parallel replicas.

# USER STORIES:

# User Stories: Seismic Monitoring System

1) As an Operator, I want to receive events classified as "Earthquake" when the frequency is between 0.5 and 3.0 Hz, so that seismic activities are correctly identified.
2) As an Operator, I want to receive events classified as "Conventional Explosion" when the frequency is between 0.3 and 8.0 Hz, so that military activities are correctly identified.
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
17) As an Operator or Data Analyst, I want to download the history of events as an Excel file, so that I can export historical data for further analysis.
18) As an Operator, I want to visualize the position of a specific sensor on a map, so that I can visually map the origin of the alerts on my monitors.
19) As a Data Analyst, I want a graph that shows live frequency changes for each sensor, so that statistical analyses can be performed.
20) As a Data Analyst, I want a graph that shows the number of events occurred for each sensor, so that statistical analyses can be performed.