class UnknownConnectionError extends Error {
  constructor(connectionId) {
    super(`Unknown connection: ${connectionId}`);
    this.name = "UnknownConnectionError";
  }
}

function parseStations() {
  const stations = new Map();
  const cities = new Map();

  for (let externalId in STATIONS) {
    const data = STATIONS[externalId];

    if (!cities.has(data.city)) {
      cities[data.city] = new City(
        data.city,
        new Coordinates(data.city_latitude, data.city_longitude),
      );
    }

    stations[externalId] = new Station(
      externalId,
      data.name,
      new Coordinates(data.latitude, data.longitude),
      cities[data.city],
    );
  }

  return stations;
}

function parseConnections(stations) {
  const connections = new Map();

  for (let outer in CONNECTIONS) {
    for (let inner in CONNECTIONS[outer]) {
      const connection = structuredClone(CONNECTIONS[outer][inner]);

      // lookup station objects todo do not have all stations in our list
      for (let i in connection.stops) {
        connection.stops[i].station = stations[connection.stops[i].station];
      }

      for (let date of ["2024-10-16", "2024-10-17", "2024-10-18"]) {
        const datedConnection = new Connection(
          connection.id,
          connection.displayId,
          connection.type,
          new Date(date),
          connection.stops,
        );

        connections[datedConnection.id] = datedConnection;
      }
    }
  }

  return connections;
}

class Database {
  constructor() {
    this.stations = parseStations();
    this.connections = parseConnections(this.stations);
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

  *getAlternatives(connectionId) {
    const connection = this.getConnection(connectionId);
    for (let candidateId in this.connections) {
      const candidate = this.getConnection(candidateId);

      // connection can not be an alternative to itself
      if (connectionId === candidateId) continue;

      // this candidate is an alternative because it covers the same leg
      if (connection.leg.numericId === candidate.leg.numericId) yield candidate;
    }
  }
}
