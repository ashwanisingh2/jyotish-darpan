'use strict';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function validCoordinates(lat, lon) {
  return Number.isFinite(Number(lat)) && Number.isFinite(Number(lon)) &&
    Number(lat) >= -90 && Number(lat) <= 90 &&
    Number(lon) >= -180 && Number(lon) <= 180;
}

function validDate(value) {
  if (!DATE_RE.test(String(value || ''))) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function validTime(value) {
  return TIME_RE.test(String(value || ''));
}

function cleanText(value, maxLength) {
  return String(value || '').trim().replace(/[\u0000-\u001F\u007F]/g, ' ').slice(0, maxLength);
}

module.exports = { validCoordinates, validDate, validTime, cleanText };
