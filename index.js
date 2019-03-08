const axios = require('axios');
const notifier = require('node-notifier');

const URL = 'http://www.dolaria.com.ar/Api/Data/0/GetCotizaciones'
const CURRENCY_CODE = 'USD';
const CURRENCY_NAME = 'Dolar';
const INTERVAL_IN_SECONDS = 5;

let precioCompra = 0;
setInterval(tick, INTERVAL_IN_SECONDS * 1000);

async function tick() {
  const currency = await get(CURRENCY_CODE);
  if (currency.PrecioCompra != precioCompra) {
    notify(CURRENCY_NAME, precioCompra, currency.PrecioCompra);
    precioCompra = currency.PrecioCompra;
  }
}

async function get(currencyCode) {
  const response = await axios.get(URL);
  return response.data.Cotizaciones
    .filter(currency => currency.MonedaCodigo === currencyCode)[0];
}

function notify(currencyName, before, now) {
  const movimiento = (before < now) ? 'SUBIÓ' : 'BAJÓ';
  const title = `${movimiento} el ${currencyName}`;
  const diferencia = (now - before).toFixed(2);
  const message = `Antes: ${before} / Ahora: ${now} / Diferencia: ${diferencia}`;

  notifier.notify({ title, message, timeout: 30, sound: 'Hero' });
}