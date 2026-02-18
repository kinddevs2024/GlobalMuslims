function formatDate(date, timezone = 'Asia/Tashkent') {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  return formatter.format(date);
}

function parseDateString(dateStr) {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

function getDayStart(dateStr) {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

function dayDiff(fromDateStr, toDateStr) {
  const from = getDayStart(fromDateStr);
  const to = getDayStart(toDateStr);
  const diffMs = to.getTime() - from.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

module.exports = {
  formatDate,
  parseDateString,
  dayDiff
};
