const textStyle = {
  layout: {
    "text-font": ["Stadia Semibold"],
    "text-size": {
      base: 1.4,
      stops: [
        [7, 14],
        [11, 24],
      ],
    },
    "text-field": ["get", "name"],
    "text-max-width": 8,
    "text-line-height": 1.55,
    "text-offset": [-0.4, 0],
    "text-variable-anchor": ["left", "right"],
  },
  paint: {
    "text-color": "#333",
    "text-halo-width": 1.2,
    "text-halo-color": "rgba(255,255,255,0.8)",
  },
};

const mapStyles = [
  // ################################
  //           edges (subLegs)
  // ################################
  {
    id: "edges",
    source: "edges",
    type: "line",
    layout: {
      "line-join": "round",
      "line-cap": "round",
    },
    paint: {
      "line-color": ["to-color", ["feature-state", "color"], "#aaa"],
      "line-opacity": [
        "case",
        ["boolean", ["feature-state", "hover"], false],
        0.8,
        0.4,
      ],
      "line-width": [
        "match",
        ["feature-state", "status"],
        "active",
        6, // line width for active
        "alternative",
        6, // line width for alternative
        0, // fallback
      ],
    },
  },
  // ################################
  //           city circles
  // ################################

  // despite this having a lot of the same repeated checks for transfer,
  // it is still nicer to have this all in one layer and avoid having the same circle
  // in multiple layers, because those tend to shine through
  {
    id: "city-circle",
    source: "cities",
    filter: [
      "any",
      // stops and transfers are always visible
      ["in", ["get", "id"], ["literal", ["placeholder for stops/transfers"]]],
      // important hubs are always visible
      ["==", ["get", "rank"], 1],
      // other cities only visible in higher zoom levels
      [">=", ["zoom"], 5],
    ],
    type: "circle",
    paint: {
      "circle-radius": [
        "case",
        ["boolean", ["feature-state", "transfer"], false],
        4, // transfer
        3, // all other
      ],
      "circle-color": "white",
      "circle-opacity": [
        "case",
        ["boolean", ["feature-state", "transfer"], false],
        1.0, // transfer
        0.4, // all other
      ],
      "circle-stroke-width": [
        "case",
        ["boolean", ["feature-state", "transfer"], false],
        2, // transfer
        1, // all other
      ],
      "circle-stroke-color": ["to-color", ["feature-state", "color"], "#aaa"],
      "circle-stroke-opacity": [
        "case",
        ["boolean", ["feature-state", "transfer"], false],
        0.6, // transfer
        ["boolean", ["feature-state", "stop"], false],
        0.2, // stops
        1.0, // all other
      ],
    },
  },

  // ################################
  //           city names
  // ################################
  {
    id: "city-name",
    source: "cities",
    type: "symbol",
    filter: [
      "all",
      // transfers get excluded here because they are in next layer
      [
        "!",
        ["in", ["get", "id"], ["literal", ["placeholder for transfer cities"]]],
      ],
      [
        "any",
        // important hubs are always visible
        ["==", ["get", "rank"], 1],
        // other cities only visible in higher zoom levels
        [">=", ["zoom"], 5],
      ],
    ],
    paint: textStyle.paint,
    layout: textStyle.layout,
  },

  // handling transfers in a later layer so that they take preference
  {
    id: "city-name-transfer",
    source: "cities",
    type: "symbol",
    filter: [
      "any", // using any filter to make compatible to other filters
      ["in", ["get", "id"], ["literal", ["placeholder for transfer cities"]]],
    ],
    paint: textStyle.paint,
    layout: textStyle.layout,
  },
];

function updateFilterExpression(layer, filterExpression, cities) {
  if (layer === "city-circle" || layer === "city-name-transfer") {
    filterExpression[1][2][1] = cities;
  } else if (layer === "city-name") {
    filterExpression[1][1][2][1] = cities;
  } else throw new Error("Unknown layer");
}
