const { DateTime } = require("luxon");

function getDateRange(filter) {
  const now = DateTime.now().setZone("America/Santiago");
  let startDate, endDate;

  if (filter === "today") {
    startDate = now.startOf("day");
    endDate = now.endOf("day");
  }

  if (filter === "week") {
    const weekday = now.weekday; // 1 (lunes) a 7 (domingo)
    startDate = now.minus({ days: weekday - 1 }).startOf("day");
    endDate = startDate.plus({ days: 6 }).endOf("day");
  }

  // Convertir a string 'YYYY-MM-DD'
  return {
    startDate: startDate.toFormat("yyyy-MM-dd"),
    endDate: endDate.toFormat("yyyy-MM-dd"),
  };
}

module.exports = { getDateRange };