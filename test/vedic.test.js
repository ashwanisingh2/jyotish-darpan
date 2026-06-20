const assert = require('assert');
const { kundali, panchang } = require('../lib/vedic');
const { validCoordinates, validDate, validTime, cleanText } = require('../lib/validation');

const k = kundali({ date: '1990-01-01', time: '12:00', offset: 'Z', lat: 28.6139, lon: 77.209 });
assert.equal(k.planets.length, 9);
assert(k.lagna.longitude >= 0 && k.lagna.longitude < 360);
assert(k.planets.every(p => p.house >= 1 && p.house <= 12));
assert.match(k.timezone, /Asia/);

const p = panchang({ date: '2026-06-19T06:00:00Z', lat: 28.6139, lon: 77.209 });
assert(p.tithi.number >= 1 && p.tithi.number <= 30);
assert(p.nakshatra);
assert(p.sunrise && p.sunset);

assert(validCoordinates(90, 180));
assert(!validCoordinates(91, 0));
assert(!validCoordinates(0, -181));
assert(validDate('2024-02-29'));
assert(!validDate('2023-02-29'));
assert(validTime('23:59'));
assert(!validTime('24:00'));
assert.equal(cleanText(' hello\u0000world ', 20), 'hello world');
console.log('vedic tests passed');
