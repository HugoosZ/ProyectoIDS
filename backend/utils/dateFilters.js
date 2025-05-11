function getDateRange(filter) {
  const now = new Date();
  let startDate = null;
  let endDate = null;

  if (filter === 'today') {
    startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);

    endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);
  }

  if (filter === 'week') {
    const dayOfWeek = now.getDay(); // 0 (domingo) a 6 (sábado)
    const diffToMonday = (dayOfWeek === 0 ? -6 : 1 - dayOfWeek); // ajustar si es domingo

    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday);
    startDate.setHours(0, 0, 0, 0);

    endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 7);
    endDate.setHours(0, 0, 0, 0);
  }

  return { startDate, endDate };
}

module.exports = { getDateRange };