const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const electron = require('electron');
const { app, ipcMain, BrowserWindow } = require('electron');

app.on('ready', function() {
  const mainWindow = new BrowserWindow({
    width  : 1040,
    height : 800,
    webPreferences: {
      nodeIntegration: true
    }
  });

  ipcMain.on('search', (evt, txt) => {
    (async () => {
      const browser = await puppeteer.launch();
      const page = await browser.newPage();

      await page.goto(`https://www.google.com/search?q=site%3Ainstagram.com+${ encodeURIComponent('リノベーション ' + txt) }`);

      const bodyHandle = await page.$('body');
      const html = await page.evaluate(body => body.innerHTML, bodyHandle);

      const $ = cheerio.load(html);

      $('a').each((_, elm) => {
        const href = $(elm).attr('href');

        if (/instagram\.com\//.test(href)) {
          (async () => {
            const browser = await puppeteer.launch();
            const page = await browser.newPage();

            await page.goto(href);
            await page.waitFor(5000);

            const bodyHandle = await page.$('body');
            const html = await page.evaluate(body => body.innerHTML, bodyHandle);
            const $ = cheerio.load(html);

            $('a').each((_, elm) => {
              const href = $(elm).attr('href');

              if (/\/p\/(.+)/.test(href)) {
                mainWindow && mainWindow.webContents.send('result', href.replace(/^\/p\//, '').replace(/\/$/, ''));
              }
            });
          })();
        }
      });
    })();
  });

  mainWindow.on('closed', () => {
    app.quit();
  });

  mainWindow.loadURL(`file://${__dirname}/index.html`);
});