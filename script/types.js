class IllegalCoordinateError extends Error {
  constructor(message) {
    super(message);
    this.name = "IllegalCoordinate";
  }
}

class LegHoverEvent {
  constructor(leg) {
    this.event = new CustomEvent("legHover", { detail: { leg: leg } });
  }

  dispatch(host) {
    host.dispatchEvent(this.event);
  }
}

class LegNoHoverEvent {
  constructor(leg) {
    this.event = new CustomEvent("legNoHover", { detail: { leg: leg } });
  }

  dispatch(host) {
    host.dispatchEvent(this.event);
  }
}

class Coordinates {
  constructor(latitude, longitude) {
    this.latitude = latitude;
    this.longitude = longitude;

    if (this.latitude < -90 || this.latitude > 90)
      throw new IllegalCoordinateError(
        `Latitude is ${this.latitude}, should be in [-90, 90]`,
      );

    if (this.longitude < -180 || this.longitude > 180)
      throw new IllegalCoordinateError(
        `Longitude is ${this.longitude}, should be in [-180, 180]`,
      );
  }
}

class City {
  constructor(name, coordinates) {
    this.name = name; // todo name is not unique, need some id
    this.coordinates = coordinates;
  }
}

class Station {
  constructor(externalId, name, coordinates, city) {
    this.id = externalId;
    this.name = name;
    this.coordinates = coordinates;
    this.city = city;
  }
}

class Leg {
  constructor(startCity, endCity) {
    this.startCity = startCity;
    this.endCity = endCity;
  }

  get id() {
    return `${this.startCity.name}-${this.endCity.name}`;
  }
}

class Connection {
  constructor(id, displayId, type, date, stops) {
    this.id = `${date.toISOString().slice(0, 10)}X${id}`;

    this.displayId = displayId;
    this.type = type;
    this.stops = stops;
    this.date = date;
  }

  get startStation() {
    return this.stops[0].station;
  }

  get startTime() {
    return this.stops[0].time; // todo date
  }

  get endStation() {
    return this.stops.at(-1).station;
  }

  get endTime() {
    return this.stops.at(-1).time; // todo date
  }

  get leg() {
    return new Leg(this.startStation.city, this.endStation.city); // todo too many objects?
  }
}

class Journey {
  constructor(connections) {
    this.connections = connections; // todo check validity of this journey
  }

  addConnection(connection) {
    this.connections.push(connection);
  }

  get stopovers() {
    const cities = [];

    if (this.connections.length === 0) return cities;

    for (let connection of this.connections) {
      cities.push(connection.startStation.city);
    }
    cities.push(this.connections.at(-1).endStation.city);
    return cities;
  }

  get legs() {
    return this.connections.map((c) => c.leg);
  }

  hasLeg(leg) {
    for (let connection of this.connections) {
      if (connection.leg.id === leg.id) return true;
    }
    return false;
  }
}

// exports for testing only (NODE_ENV='test' is automatically set by jest)
if (typeof process === "object" && process.env.NODE_ENV === "test") {
  module.exports.IllegalCoordinateError = IllegalCoordinateError;
  module.exports.Coordinates = Coordinates;
  module.exports.City = City;
  module.exports.Station = Station;
  module.exports.Leg = Leg;
  module.exports.Connection = Connection;
  module.exports.Journey = Journey;
}
