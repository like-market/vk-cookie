const {Builder, By, Key} = require('selenium-webdriver');
const firefox = require('selenium-webdriver/firefox');
const proxy = require('selenium-webdriver/proxy');
const yargs = require('yargs');

const { getExtension, getAddHeaderUrl } = require('firefox-modheader');


const argv = yargs
    .demandOption(['proxy-address', 'proxy-auth', 'vk-auth'])
    .option('proxy-address', { description: 'Proxy data in format ip:port' })
    .option('proxy-auth',    { description: 'Authentication data in format login:password' })
    .option('vk-auth',       { description: 'Authentication data in format login:password' })
    .option('verbose',       { description: 'Show verbose output'})
    .default('verbose', false)
    .help(false)
    .version(false)
    .argv;

const verbose = argv['verbose'];

(async function run() {
    const options = new firefox.Options();
    options.addExtensions(getExtension());
    options.headless();

    if (verbose) console.log("Initial driver.");
    const driver = await new Builder()
        .forBrowser('firefox')
        .setFirefoxOptions(options)
        .setProxy(proxy.manual({
            http:  argv['proxy-address'],
            https: argv['proxy-address']
        }))
        .build();
    if (verbose) console.log("Driver has been initialized.");

    try {
        await driver.get(getAddHeaderUrl('Proxy-Authorization', 'Basic ' + Buffer.from(argv['proxy-auth']).toString('base64')));
        if (verbose) console.log('Proxy-Authorization header has been set.');

        await driver.sleep(1000);
        await driver.get('https://vk.com');
        if (verbose) console.log('Page vk.com has been loaded.');

        await driver.sleep(1000);
        await driver.findElement(By.id('index_email')).sendKeys(argv['vk-auth'].split(':')[0]);
        await driver.findElement(By.id('index_pass')).sendKeys(argv['vk-auth'].split(':')[1], Key.ENTER);
        if (verbose) console.log('Login and password have been written.')

        await driver.sleep(1000);
        const currentUrl = await driver.getCurrentUrl();
        if (currentUrl.indexOf('vk.com/login') != -1) {
            console.warn('Password incorrect.');
            process.exit(1);
        }

        await driver.sleep(1000);
        await driver.get('https://vk.com/id0');

        const cookies = await driver.manage().getCookies();
        const name    = await driver.findElement(By.className('page_name')).getText();
        const url     = await driver.getCurrentUrl();

        console.log(JSON.stringify({
            status: 'success',
            cookies: cookies.map(cookie => cookie.name + '=' + cookie.value).join('; '),
            name,
            url
        }));

    } catch (err) {
        console.log(JSON.stringify({
            status: 'failed',
            error: err
        }));
        process.exit(2);
    }
})();