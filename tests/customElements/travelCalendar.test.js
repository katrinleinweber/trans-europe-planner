/**
 * @jest-environment jsdom
 */

const {
  TravelCalendar,
} = require("../../script/components/calendar2/travelCalendar.js");

const {
  TravelOption,
} = require("../../script/components/calendar2/travelOption.js");

const FIRST_DATE = "2024-10-15";
const SECOND_DATE = "2024-10-16";
const THIRD_DATE = "2024-10-17";

const ROW_OFFSET = 2; // 1 for header, 1 because indexes start at 1
const COLUMN_OFFSET = 2; // 1 for hour column, 1 because indexes start at 1

beforeEach(() => {
  document.body.innerHTML = `<travel-calendar id='calendar' start-date='${FIRST_DATE}'></travel-calendar>`;
});

function dispatchEvent(element, eventName, timeout_ms = 10) {
  let event = null;
  if (["mouseover", "mouseout"].includes(eventName))
    event = new MouseEvent(eventName, { bubbles: true });

  element.dispatchEvent(event);

  // wait for changes after dispatching to hove finished (hopefully waiting long enough)...
  return new Promise((resolve) => setTimeout(resolve, timeout_ms));
}

function getShadowDOMItems(calendar, querySelector) {
  const elements = [];
  for (let el of calendar.shadowRoot.querySelectorAll(querySelector)) {
    elements.push({
      element: el,
      gridColumn: el.style._values["grid-column"],
      gridRowStart: el.style._values["grid-row-start"],
      gridRowEnd: el.style._values["grid-row-end"],
    });
  }
  return elements;
}

async function addEntry(calendar, startDateTime, endDateTime) {
  const entry = document.createElement("travel-option");
  entry.startTime = startDateTime;
  entry.endTime = endDateTime;
  entry.startCity = "My start city";
  entry.endCity = "My end city";
  await calendar.appendChild(entry);
}

test("dateLabelsAtInitialization", function () {
  const calendar = document.querySelector("#calendar");
  const got = getShadowDOMItems(calendar, ".date-label");

  expect(got.length).toBe(3);

  expect(got[0].element.innerHTML).toContain("15");
  expect(got[0].gridColumn).toBe(2);
  expect(got[0].gridRowStart).toBe(1);
  expect(got[0].gridRowEnd).toBe(2);

  expect(got[1].element.innerHTML).toContain("16");
  expect(got[1].gridColumn).toBe(3);
  expect(got[1].gridRowStart).toBe(1);
  expect(got[1].gridRowEnd).toBe(2);

  expect(got[2].element.innerHTML).toContain("17");
  expect(got[2].gridColumn).toBe(4);
  expect(got[2].gridRowStart).toBe(1);
  expect(got[2].gridRowEnd).toBe(2);
});

test("dateLabelsAfterDateChanged", async function () {
  const calendar = document.querySelector("#calendar");
  await calendar.setAttribute("start-date", "2023-03-20");

  const got = getShadowDOMItems(calendar, ".date-label");

  expect(got.length).toBe(3);

  expect(got[0].element.innerHTML).toContain("20");
  expect(got[0].gridColumn).toBe(2);
  expect(got[0].gridRowStart).toBe(1);
  expect(got[0].gridRowEnd).toBe(2);

  expect(got[1].element.innerHTML).toContain("21");
  expect(got[1].gridColumn).toBe(3);
  expect(got[1].gridRowStart).toBe(1);
  expect(got[1].gridRowEnd).toBe(2);

  expect(got[2].element.innerHTML).toContain("22");
  expect(got[2].gridColumn).toBe(4);
  expect(got[2].gridRowStart).toBe(1);
  expect(got[2].gridRowEnd).toBe(2);
});

test("entryFirstDate", async function () {
  const calendar = document.querySelector("#calendar");
  await addEntry(calendar, `${FIRST_DATE}T14:00`, `${FIRST_DATE}T15:00`);

  const got = getShadowDOMItems(calendar, ".entry-part");

  expect(got.length).toBe(1);
  expect(got[0].gridColumn).toBe(COLUMN_OFFSET);
  expect(got[0].gridRowStart).toBe(14 * 4 + ROW_OFFSET);
  expect(got[0].gridRowEnd).toBe(15 * 4 + ROW_OFFSET);
  expect(got[0].element.innerHTML).toContain("My start city");
  expect(got[0].element.innerHTML).toContain("My end city");
});

test("entrySecondDateWithCalendarDateChange", async function () {
  const calendar = document.querySelector("#calendar");
  await addEntry(calendar, `${SECOND_DATE}T14:00`, `${SECOND_DATE}T15:00`);
  await calendar.setAttribute("start-date", SECOND_DATE);

  const got = getShadowDOMItems(calendar, ".entry-part");

  expect(got.length).toBe(1);
  expect(got[0].gridColumn).toBe(COLUMN_OFFSET);
  expect(got[0].gridRowStart).toBe(14 * 4 + ROW_OFFSET);
  expect(got[0].gridRowEnd).toBe(15 * 4 + ROW_OFFSET);
  expect(got[0].element.innerHTML).toContain("My start city");
  expect(got[0].element.innerHTML).toContain("My end city");
});

test("entryFromMidnight", async function () {
  const calendar = document.querySelector("#calendar");
  await addEntry(calendar, `${FIRST_DATE}T00:00`, `${FIRST_DATE}T00:15`);

  const got = getShadowDOMItems(calendar, ".entry-part");

  expect(got.length).toBe(1);
  expect(got[0].gridColumn).toBe(2);
  expect(got[0].gridRowStart).toBe(2);
  expect(got[0].gridRowEnd).toBe(3);
  expect(got[0].element.innerHTML).toContain("My start city");
  expect(got[0].element.innerHTML).toContain("My end city");
});

test("entryEndsJustBeforeMidnight", async function () {
  const calendar = document.querySelector("#calendar");
  await addEntry(calendar, `${THIRD_DATE}T14:30`, `${THIRD_DATE}T23:59`);

  const got = getShadowDOMItems(calendar, ".entry-part");

  expect(got.length).toBe(1);
  expect(got[0].gridColumn).toBe(2 + COLUMN_OFFSET);
  expect(got[0].gridRowStart).toBe(14 * 4 + 2 + ROW_OFFSET);
  expect(got[0].gridRowEnd).toBe(24 * 4 + ROW_OFFSET);
  expect(got[0].element.innerHTML).toContain("My start city");
  expect(got[0].element.innerHTML).toContain("14:30");
  expect(got[0].element.innerHTML).toContain("My end city");
  expect(got[0].element.innerHTML).toContain("23:59");
});

test("entryTwoDays", async function () {
  const calendar = document.querySelector("#calendar");
  await addEntry(calendar, `${FIRST_DATE}T16:29`, `${SECOND_DATE}T18:04`);

  const got = getShadowDOMItems(calendar, ".entry-part");

  expect(got.length).toBe(2);

  expect(got[0].gridColumn).toBe(COLUMN_OFFSET);
  expect(got[0].gridRowStart).toBe(16 * 4 + 2 + ROW_OFFSET);
  expect(got[0].gridRowEnd).toBe(24 * 4 + ROW_OFFSET);
  expect(got[0].element.innerHTML).toContain("My start city");
  expect(got[0].element.innerHTML).toContain("16:29");
  expect(got[0].element.innerHTML).not.toContain("My end city");
  expect(got[0].element.innerHTML).not.toContain("18:04");

  expect(got[1].gridColumn).toBe(1 + COLUMN_OFFSET);
  expect(got[1].gridRowStart).toBe(ROW_OFFSET);
  expect(got[1].gridRowEnd).toBe(18 * 4 + ROW_OFFSET);
  expect(got[1].element.innerHTML).not.toContain("My start city");
  expect(got[1].element.innerHTML).not.toContain("16:29");
  expect(got[1].element.innerHTML).toContain("My end city");
  expect(got[1].element.innerHTML).toContain("18:04");
});

test("entryThreeDays", async function () {
  const calendar = document.querySelector("#calendar");
  await addEntry(calendar, `${FIRST_DATE}T16:29`, `${THIRD_DATE}T18:04`);

  const got = getShadowDOMItems(calendar, ".entry-part");

  expect(got.length).toBe(3);

  expect(got[0].gridColumn).toBe(COLUMN_OFFSET);
  expect(got[0].gridRowStart).toBe(16 * 4 + 2 + ROW_OFFSET);
  expect(got[0].gridRowEnd).toBe(24 * 4 + ROW_OFFSET);
  expect(got[0].element.innerHTML).toContain("My start city");
  expect(got[0].element.innerHTML).toContain("16:29");
  expect(got[0].element.innerHTML).not.toContain("My end city");
  expect(got[0].element.innerHTML).not.toContain("18:04");

  expect(got[1].gridColumn).toBe(1 + COLUMN_OFFSET);
  expect(got[1].gridRowStart).toBe(ROW_OFFSET);
  expect(got[1].gridRowEnd).toBe(24 * 4 + ROW_OFFSET);
  expect(got[1].element.innerHTML).not.toContain("My start city");
  expect(got[1].element.innerHTML).not.toContain("16:29");
  expect(got[1].element.innerHTML).not.toContain("My end city");
  expect(got[1].element.innerHTML).not.toContain("18:04");

  expect(got[2].gridColumn).toBe(2 + COLUMN_OFFSET);
  expect(got[2].gridRowStart).toBe(ROW_OFFSET);
  expect(got[2].gridRowEnd).toBe(18 * 4 + ROW_OFFSET);
  expect(got[2].element.innerHTML).not.toContain("My start city");
  expect(got[2].element.innerHTML).not.toContain("16:29");
  expect(got[2].element.innerHTML).toContain("My end city");
  expect(got[2].element.innerHTML).toContain("18:04");
});

test("startHoverMultiday", async function () {
  const calendar = document.querySelector("#calendar");
  await addEntry(calendar, `${FIRST_DATE}T16:29`, `${THIRD_DATE}T18:04`);
  const parts = getShadowDOMItems(calendar, ".entry-part");

  // by default no part should hover
  for (let part of parts) expect(part.element.classList).not.toContain("hover");

  // simulate mouseover
  // now all parts should hover
  await dispatchEvent(parts[1].element, "mouseover");
  for (let part of parts) expect(part.element.classList).toContain("hover");

  // simulate mouseout over different part
  // now again no part should hover
  await dispatchEvent(parts[2].element, "mouseout");
  for (let part of parts) expect(part.element.classList).not.toContain("hover");
});
