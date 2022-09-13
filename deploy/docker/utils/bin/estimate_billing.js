const { MongoClient } = require("mongodb");
const { DateTime } = require("luxon");
const cliProgress = require("cli-progress");
var args = require("minimist")(process.argv.slice(2));

const SESSION_PRICE = args.sessionPrice || 0.3;
const PRICE_CAP_FOR_USER = args.priceCap || 15;

let BILL = {};
async function run() {
  const MONGODB_URL = args.mongoUrl || process.env.APPSMITH_MONGODB_URI;
  if (MONGODB_URL == undefined || MONGODB_URL.trim() === "") {
    console.log(`
Did you forget to specify the mandatory parameter MongoDB URL?

Options:
  --sessionPrice    The price per active session. Defaults to 0.3 
  --priceCap        The price cap for a user in a given month. Defaults to 15
    `);
    return;
  }
  const client = new MongoClient(MONGODB_URL);
  try {
    initializeBill();
    await client.connect();

    const uniqueEmails = await getUniqueEmails(client);
    console.log("Got all unique users. Going to calculate the estimated bill.");

    // Since this is can potentially be a long process, show a progress bar to the user
    const progressBar = new cliProgress.SingleBar(
      {
        format: "{bar} {percentage}% | ETA: {eta}s | {value}/{total} users",
      },
      cliProgress.Presets.shades_classic
    );
    progressBar.start(uniqueEmails.emails.length, 0);

    // For each user calculate their monthly bill and append it to the global BILL object
    for (const email of uniqueEmails.emails) {
      const billingEventsForUser = await getBillingEventsForUser(client, email);
      calculateBillForUser(billingEventsForUser);
      progressBar.increment();
    }
    progressBar.stop();

    console.log("\nYour estimated monthly bill for Appsmith is:");
    console.log(BILL);
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

/**
 * Initialize the monthly bill amount to 0 for all months
 */
function initializeBill() {
  BILL["January"] = 0;
  BILL["February"] = 0;
  BILL["March"] = 0;
  BILL["April"] = 0;
  BILL["May"] = 0;
  BILL["June"] = 0;
  BILL["July"] = 0;
  BILL["August"] = 0;
  BILL["September"] = 0;
  BILL["October"] = 0;
  BILL["November"] = 0;
  BILL["December"] = 0;
}

/**
 * Get all the unique user emails from the usagePulse collection
 * @param {MongoClient} client
 * @returns
 */
async function getUniqueEmails(client) {
  const dbClient = await client.db();
  const query = [
    {
      $group: { _id: null, emails: { $addToSet: "$email" } },
    },
  ];
  const aggCursor = dbClient.collection("usagePulse").aggregate(query);
  for await (const doc of aggCursor) {
    return doc;
  }
}

/**
 * This function returns all the billing events of a user based on 30 min active session window
 *
 * @param {MongoClient} client The MongoClient object
 * @param {String} email The email ID of the user for whom we are fetching the billing events
 * @returns Array of billing events
 */
async function getBillingEventsForUser(client, email) {
  const dbClient = await client.db();
  const query = [
    { $match: { email: email } },
    {
      $group: {
        _id: {
          $toDate: {
            $subtract: [
              { $toLong: { $toDate: "$_id" } },
              { $mod: [{ $toLong: { $toDate: "$_id" } }, 1000 * 60 * 30] },
            ],
          },
        },
      },
    },
    { $sort: { _id: 1 } },
  ];

  const aggCursor = dbClient.collection("usagePulse").aggregate(query);
  let billingEvents = [];
  for await (const doc of aggCursor) {
    billingEvents.push(doc);
  }
  return billingEvents;
}

/**
 * This function calculates the monthly bill for the user and appends it to the global BILL object
 *
 * @param {Array} billingEventsForUser
 */
function calculateBillForUser(billingEventsForUser) {
  let user = {};
  billingEventsForUser.forEach((event) => {
    const time = event._id;
    const dateTime = DateTime.fromJSDate(time);
    if (!(dateTime.monthLong in user)) {
      user[dateTime.monthLong] = 0;
    }

    if (user[dateTime.monthLong] < PRICE_CAP_FOR_USER) {
      user[dateTime.monthLong] += SESSION_PRICE;
      BILL[dateTime.monthLong] += SESSION_PRICE;
      BILL[dateTime.monthLong] =
        Math.round(BILL[dateTime.monthLong] * 100) / 100;
    }
  });
}

module.exports = {
  run,
};
