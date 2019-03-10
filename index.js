const { app, Tray, Menu } = require('electron');
const axios = require('axios');
const notifier = require('node-notifier');
const path = require('path');

const ASSETS_DIRECTORY = path.join(__dirname, 'assets');
// https://icons8.com/icon/110854/d
const APP_ICON = path.join(ASSETS_DIRECTORY, 'icons8-d-16.png');
const URL = 'http://www.dolaria.com.ar/Api/Data/0/GetCotizaciones'
const CURRENCY_CODE = 'USD';
const CURRENCY_NAME = 'Dolar';
const INTERVAL_IN_SECONDS = 60;

let buyPrice;
let tray;
let timer;

// TODO: this causes a flickering in the dock, but a proper solution requires to
// build and package the app.
// See https://github.com/electron-userland/electron-builder/issues/1456
app.dock.hide();

app.on('ready', () => {
  console.log('Starting notifier...');
  tray = createTray();
  timer = createTimer();
});

app.on('quit', () => {
  clearInterval(timer);
  console.log('Exiting.')
});

function createTray() {
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Update', click: tick },
    { label: 'Quit', click: app.quit },
  ]);

  const iconTray = new Tray(APP_ICON);
  iconTray.setContextMenu(contextMenu);

  return iconTray;
}

function createTimer() {
  tick();
  return setInterval(tick, INTERVAL_IN_SECONDS * 1000);
}

async function tick() {
  console.log('Checking rates...');
  const currency = await get(CURRENCY_CODE);
  if (currency.PrecioCompra !== buyPrice) {
    const updated = new Date();
    tray.setTitle(`C:${currency.PrecioCompra}/V:${currency.PrecioVenta}`);
    tray.setToolTip('Last change:');

    if (buyPrice) {
      notify(CURRENCY_NAME, buyPrice, currency.PrecioCompra);
    }

    buyPrice = currency.PrecioCompra;
  }
}

async function get(currencyCode) {
  const response = await axios.get(URL);
  return response.data.Cotizaciones
    .filter(currency => currency.MonedaCodigo === currencyCode)[0];
}

function notify(currencyName, before, now) {
  const change = (before < now) ? 'SUBIÓ' : 'BAJÓ';
  const title = `${change} el ${currencyName}`;
  const diff = (now - before).toFixed(2);
  const message = `Antes: ${before} / Ahora: ${now} / Diferencia: ${diff}`;

  notifier.notify({ title, message, timeout: 30, sound: 'Hero' });
}
