class DatabaseError extends Error {
  constructor(message) {
    super(message);
    this.name = "BadDatabaseQuery";
  }
}

// workaround because can not import SlicingError because of way tests are set up
function isSlicingError(error) {
  return error.constructor.name === "SlicingError";
}

function enrichAndTemporalizeConnection(template, stations, cities, dates) {
  const result = [];

  for (let date of dates) {
    const stops = [];
    for (let stop of template.stops) {
      stops.push({
        // temporalize
        arrival: new CustomDateTime(date, stop.arrival),
        departure: new CustomDateTime(date, stop.departure),
        // enrich with additional station and city info
        stationId: stop.station,
        stationName: stations[stop.station].name,
        stationIsPreferred: stations[stop.station].preferred,
        cityId: stations[stop.station].city,
        cityName: cities[stations[stop.station].city].name,
      });
    }

    result.push(
      new Connection(template.id, date, template.name, template.type, stops),
    );
  }

  return result;
}

class Database {
  // these templates use a dummy date and have the full run of all stops
  // {id: Connection}
  #templates;

  // the sliced templates are for a specific leg but still use a dummy date
  // {[id, leg]: Connection}
  #sliced = {};

  // and here will be sliced, dated connections
  // {[id, leg, date]: Connection}
  #connections = {};

  constructor(templates) {
    this.#templates = {};
    for (let t of templates) this.#templates[t.id] = t;
  }

  connection(id, date, leg) {
    // because often trouble with this, do some type checking
    if (!(date instanceof Date))
      throw new DatabaseError(
        `Expected Date input, found ${typeof date} with value ${date}`,
      );

    const compositeId = `${id}XXX${leg.toString()}XXX${date.toLocaleDateString("sv")}`;

    if (!this.#connections[compositeId]) {
      const sliced = this.#getSliced(id, leg);
      this.#connections[compositeId] = sliced.changeDate(date);
    }

    return this.#connections[compositeId];
  }

  connectionsForLeg(leg, dates) {
    const result = [];

    for (let id in this.#templates) {
      for (let date of dates) {
        try {
          result.push(this.connection(id, date, leg));
        } catch (error) {
          // this connection does not have this leg, no need to try the other dates
          if (isSlicingError(error)) break;
          // all other errors should bubble up
          throw error;
        }
      }
    }

    return result;
  }

  #getTemplate(id) {
    if (!this.#templates[id])
      throw new DatabaseError(`Unknown connection ${id}`);
    return this.#templates[id];
  }

  #getSliced(id, leg) {
    const compositeId = `${id}XXX${leg.toString()}`;

    if (!this.#sliced[compositeId]) {
      const template = this.#getTemplate(id);

      // can throw slicing error
      // todo calling this even if I already know from previous attempts that the slice does not exist
      this.#sliced[compositeId] = template.slice(
        leg.startCityName,
        leg.endCityName,
      );
    }

    return this.#sliced[compositeId];
  }
}

// exports for testing only (NODE_ENV='test' is automatically set by jest)
if (typeof process === "object" && process.env.NODE_ENV === "test") {
  module.exports.Database = Database;
  module.exports.DatabaseError = DatabaseError;
  module.exports.isSlicingError = isSlicingError;
}
