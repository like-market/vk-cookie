const {Builder, By, Key} = require('selenium-webdriver');
const firefox = require('selenium-webdriver/firefox');
const proxy = require('selenium-webdriver/proxy');

const { getExtension, getAddHeaderUrl } = require('firefox-modheader');


const yargs = require('yargs');

const argv = yargs
    .demandOption(['proxy-address', 'proxy-auth', 'vk-auth'])
    .option('proxy-address', { description: 'Proxy data in format ip:port' })
    .option('proxy-auth',    { description: 'Authentication data in format login:password' })
    .option('vk-auth',       { description: 'Authentication data in format login:password' })
    .help(false)
    .version(false)
    .argv;

(async function run() {
    const options = new firefox.Options();
    options.addExtensions(getExtension());
    options.headless();

    const driver = await new Builder()
        .forBrowser('firefox')
        .setFirefoxOptions(options)
        .setProxy(proxy.manual({
            http:  argv['proxy-address'],
            https: argv['proxy-address']
        }))
        .build();

    try {
        await driver.get(getAddHeaderUrl('Proxy-Authorization', 'Basic ' + Buffer.from(argv['proxy-auth']).toString('base64')));
        await driver.sleep(1000);
        console.debug('Set Proxy-Authorization header')

        await driver.get('https://vk.com');
        console.debug('Page vk.com loaded')

        await driver.findElement(By.id('index_email')).sendKeys(argv['vk-auth'].split(':')[0]);
        await driver.sleep(1000);

        await driver.findElement(By.id('index_pass')).sendKeys(argv['vk-auth'].split(':')[1], Key.ENTER);
        await driver.sleep(1000);
        console.debug('Login/Password wrote.')

        const currentUrl = await driver.getCurrentUrl();
        if (currentUrl.indexOf('vk.com/login') != -1) {
            console.warn('Login/Password are incorrect.');
            process.exit(1);
        }

        const cookies = await driver.manage().getCookies();
        const string = cookies.map(cookie => {
            return `${cookie.name}=${cookie.value}`;
        }).join('; ');

        console.log(string);
    } catch (err) {
        console.error(err);
        process.exit(2);
    }
})();