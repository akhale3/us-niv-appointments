require('dotenv').config();

const puppeteer = require('puppeteer');
const nodemailer = require('nodemailer');
const config = require(`${__dirname}/config`);

(async () => {
  const browser = await puppeteer.launch({
    headless: config.headless
  });
  const page = await browser.newPage();
  await page.goto('https://ais.usvisa-info.com/en-ca/niv/users/sign_in', {
    waitUntil: 'networkidle2'
  });

  const email = await page.waitForSelector('#user_email');
  await email.type(config.credentials.email);

  const password = await page.waitForSelector('#user_password');
  await password.type(config.credentials.password);

  await page.waitForSelector('#policy_confirmed');
  await page.evaluate(() => {
    document.querySelector("#policy_confirmed").parentElement.click();
  });

  await Promise.all([
    page.waitForNavigation({
      waitUntil: 'networkidle0'
    }),
    page.click('input[type="submit"]')
  ]);

  const getAppointments = async (value) => {
    const appointmentResponse = await fetch(`https://ais.usvisa-info.com/en-ca/niv/schedule/35865267/appointment/days/${value}.json?appointments[expedite]=false`);
    const appointments = await appointmentResponse.json();

    return appointments;
  };

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: config.mailer.email,
      pass: config.mailer.password
    }
  });
  const sendMail = async (appointmentList) => {
    const info = await transporter.sendMail({
      from: config.mailer.email,
      to: config.mailer.toEmails,
      subject: 'US Non-Immigrant Visa Appointment Availabilities in Canada',
      text: JSON.stringify(appointmentList, null, 2)
    });

    console.log(`Email sent with messageId: ${info.messageId}`);
  };

  const filterAppointments = (appointmentMap, targetDate) => {
    const filteredMap = {};

    Object.entries(appointmentMap).forEach(([name, values]) => {
      filteredMap[name] = values.filter(value => {
        if (!targetDate) {
          return value.date;
        }

        return new Date(value.date) < new Date(targetDate);
      }).map(value => value.date);
    });

    return filteredMap;
  };

  const appointmentMap = {};
  const consulates = Object.entries(config.consulates);
  while (consulates.length !== 0) {
    const [name, value] = consulates.shift();
    const appointments = await page.evaluate(
      getAppointments,
      value
    );

    appointmentMap[name] = appointments;
  }

  const filteredMap = filterAppointments(appointmentMap, config.targetDate);

  console.log(filteredMap);

  await sendMail(filteredMap);

  await browser.close();
})();
