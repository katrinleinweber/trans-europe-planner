class UnknownConnectionError extends Error {
  constructor(connectionId) {
    super(`Unknown connection: ${connectionId}`);
    this.name = "UnknownConnectionError";
  }
}

function prepareData(cities, stations, connections, legs) {
  const coords = (dict) => new Coordinates(dict.latitude, dict.longitude);

  // parse cities
  for (let [i, c] of Object.entries(cities))
    cities[i] = new City(c.name, coords(c));

  // parse cities
  for (let [i, s] of Object.entries(stations))
    stations[i] = new Station(i, s.name, coords(s), cities[s.city]);

  // parse connections
  const result = [];
  for (let legId of legs) {
    // todo this is stupid
    const [startCityName, endCityName] = legId.split("-");
    const startCityId = Object.values(cities).filter(
      (c) => c.name === startCityName,
    )[0];
    const endCityId = Object.values(cities).filter(
      (c) => c.name === endCityName,
    )[0];

    for (let connection of connections) {
      const cities = connection.stops.map((s) => stations[s.station].city);
      const startIndex = cities.indexOf(startCityId);
      const endIndex = cities.indexOf(endCityId);

      if (!(startIndex >= 0 && endIndex >= 0 && startIndex < endIndex))
        continue;

      for (let date of ["2024-10-16", "2024-10-17", "2024-10-18"]) {
        const stops = connection.stops.map((s) => ({
          datetime: new CustomDateTime(date, s.departure), // todo arrival at final stop
          station: stations[s.station],
        }));
        result.push(
          new Connection(
            connection.id,
            connection.id,
            connection.type,
            stops.slice(startIndex, endIndex + 1),
          ),
        );
      }
    }
  }

  return result;
}

class Database {
  constructor(connections) {
    this.connections = {};
    for (let connection of connections) {
      this.connections[connection.id] = connection;
    }
  }

  *getAllLegs() {
    const yielded = [];

    for (let connectionId in this.connections) {
      const leg = this.connections[connectionId].leg;
      if (yielded.includes(leg.id)) continue;

      yield leg;
      yielded.push(leg.id);
    }
  }

  getConnection(connectionId) {
    const connection = this.connections[connectionId];
    if (!connection) throw new UnknownConnectionError(connectionId);
    return connection;
  }

  getConnections(leg) {
    return Object.values(this.connections).filter((c) => c.leg.id === leg);
  }

  prepareDataForCalendar(journey) {
    const data = [];

    for (let activeConnection of journey.connections) {
      const leg = activeConnection.leg.id;
      for (let connection of this.getConnections(leg)) {
        data.push({
          id: connection.id,
          data: connection,
          active: connection.id === activeConnection.id,
        });
      }
    }
    return data;
  }

  prepareDataForMap(journey) {
    const data = [];
    for (let leg of this.getAllLegs()) {
      data.push({
        id: leg.id,
        startCity: leg.startCity,
        endCity: leg.endCity,
        active: journey.hasLeg(leg),
      });
    }

    return data;
  }
}

// exports for testing only (NODE_ENV='test' is automatically set by jest)
if (typeof process === "object" && process.env.NODE_ENV === "test") {
  module.exports.Database = Database;
}
