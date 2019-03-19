const puppeteer = require('puppeteer');
const AWS = require('aws-sdk');

AWS.config.update({region: process.env.REGION });

const signinUrl = "https://sso.garmin.com/sso/signin?service=https%3A%2F%2Fconnect.garmin.com%2Fmodern%2F&webhost=https%3A%2F%2Fconnect.garmin.com&source=https%3A%2F%2Fconnect.garmin.com%2Fen-US%2Fsignin&redirectAfterAccountLoginUrl=https%3A%2F%2Fconnect.garmin.com%2Fmodern%2F&redirectAfterAccountCreationUrl=https%3A%2F%2Fconnect.garmin.com%2Fmodern%2F&gauthHost=https%3A%2F%2Fsso.garmin.com%2Fsso&locale=en_US&id=gauth-widget&cssUrl=https%3A%2F%2Fstatic.garmincdn.com%2Fcom.garmin.connect%2Fui%2Fcss%2Fgauth-custom-v1.2-min.css&privacyStatementUrl=%2F%2Fconnect.garmin.com%2Fen-US%2Fprivacy%2F&clientId=GarminConnect&rememberMeShown=true&rememberMeChecked=false&createAccountShown=true&openCreateAccount=false&displayNameShown=false&consumeServiceTicket=false&initialFocus=true&embedWidget=false&generateExtraServiceTicket=true&generateTwoExtraServiceTickets=false&generateNoServiceTicket=false&globalOptInShown=true&globalOptInChecked=false&mobile=false&connectLegalTerms=true&locationPromptShown=true&showPassword=true#";

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.121 Safari/537.36');
  await page.goto(signinUrl, {waitUntil: 'networkidle2'});

	await page.click('input[name=username]');
	await page.keyboard.type(process.env.USER);

	await page.click('input[name=password]');
	await page.keyboard.type(process.env.PASSWORD);

	await page.click('#login-btn-signin');

	await page.waitForNavigation({ waitUntil: 'networkidle2' });

	await page.waitForSelector('.widget.reports .js-report-avg-value');

  const text = await page.evaluate(() => document.querySelector('.widget.reports .js-report-avg-value').textContent);

  await browser.close();

  const steps = parseInt(text.replace(/,/g, '') , 10);

  if (steps >= process.env.STEPS_GOAL) {
    return;
  }

  const params = {
    Message: `WARNING: STEP COUNT AVG OVER LAST 7 DAYS IS ${text}`, 
    PhoneNumber: `+1${process.env.PHONE_NUMBER}`,
  };

  const sns = new AWS.SNS()
  await sns.publish(params).promise();
})();
