const chromium = require("chrome-aws-lambda");
const puppeteer = require("puppeteer-core");
const AWS = require("aws-sdk");

const signinUrl =
  "https://sso.garmin.com/sso/signin?service=https%3A%2F%2Fconnect.garmin.com%2Fmodern%2F&webhost=https%3A%2F%2Fconnect.garmin.com&source=https%3A%2F%2Fconnect.garmin.com%2Fen-US%2Fsignin&redirectAfterAccountLoginUrl=https%3A%2F%2Fconnect.garmin.com%2Fmodern%2F&redirectAfterAccountCreationUrl=https%3A%2F%2Fconnect.garmin.com%2Fmodern%2F&gauthHost=https%3A%2F%2Fsso.garmin.com%2Fsso&locale=en_US&id=gauth-widget&cssUrl=https%3A%2F%2Fstatic.garmincdn.com%2Fcom.garmin.connect%2Fui%2Fcss%2Fgauth-custom-v1.2-min.css&privacyStatementUrl=%2F%2Fconnect.garmin.com%2Fen-US%2Fprivacy%2F&clientId=GarminConnect&rememberMeShown=true&rememberMeChecked=false&createAccountShown=true&openCreateAccount=false&displayNameShown=false&consumeServiceTicket=false&initialFocus=true&embedWidget=false&generateExtraServiceTicket=true&generateTwoExtraServiceTickets=false&generateNoServiceTicket=false&globalOptInShown=true&globalOptInChecked=false&mobile=false&connectLegalTerms=true&locationPromptShown=true&showPassword=true#";

exports.run = async (event, context) => {
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath,
    headless: chromium.headless
  });

  const page = await browser.newPage();
  await page.goto(signinUrl, { waitUntil: "networkidle2" });

  await page.click("input[name=username]");
  await page.keyboard.type(process.env.USER);

  await page.click("input[name=password]");
  await page.keyboard.type(process.env.PASSWORD);

  await page.click("#login-btn-signin");

  await page.waitForNavigation({ waitUntil: "networkidle2" });

  const getText = () => {
    try {
      return document.querySelector(".widget.reports .js-report-avg-value")
        .textContent;
    } catch (e) {
      return "";
    }
  };

  await page.waitForFunction(getText);
  const text = await page.evaluate(getText);

  await browser.close();

  const steps = parseInt(text.replace(/,/g, ""), 10);

  if (steps >= process.env.STEPS_GOAL) {
    return Promise.resolve("all good, on track");
  }

  if (!text) {
    return Promise.reject(
      "hrm, could not parse step count, probs gotta update somethin"
    );
  }

  const params = {
    Message: `WARNING: STEP COUNT AVG OVER LAST 7 DAYS IS ${text}`,
    PhoneNumber: `${process.env.PHONE_NUMBER}`
  };

  const sns = new AWS.SNS();
  return await sns.publish(params).promise();
};
