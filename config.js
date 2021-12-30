module.exports = {
  consulates: {
    calgary: '89',
    halifax: '90',
    montreal: '91',
    ottawa: '92',
    quebecCity: '93',
    toronto: '94',
    vancouver: '95'
  },
  targetDate: process.env.TARGET_DATE,
  credentials: {
    email: process.env.CREDENTIALS_EMAIL,
    password: process.env.CREDENTIALS_PASSWORD
  },
  headless: process.env.HEADLESS === 'true',
  mailer: {
    enabled: process.env.MAILER_ENABLED === 'true',
    email: process.env.MAILER_EMAIL,
    password: process.env.MAILER_PASSWORD,
    toEmails: process.env.MAILER_TO_EMAILS
  }
};
