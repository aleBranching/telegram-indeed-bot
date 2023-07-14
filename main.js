const { Telegraf, Markup, Scenes, session, Stage } = require("telegraf");
const { toHTML, toMarkdownV2 } = require("@telegraf/entity");
// const message = require("telegraf/filters");
const { message } = require("telegraf/filters");
const run = require("./jobListener");

require("dotenv").config();

const { BOT_TOKEN, SERVER_URL } = process.env;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const URI = `/webhook/${BOT_TOKEN}`;
const WEBHOOK_URL = SERVER_URL + URI;

const bot = new Telegraf(BOT_TOKEN);
bot.use(Telegraf.log());

bot.use(session());
let querryContext = [
  { text: "search is unfilled", isActive: false },
  { text: "search is unfilled", isActive: false },
  { text: "search is unfilled", isActive: false },
  {
    location: "york",
    searchString: "javascript",
    remote: "false",
    distance: "50",
  },
];

const contactDataWizard = new Scenes.WizardScene(
  "QUERY FILLER",
  (ctx) => {
    ctx.reply(
      "There are 3 searches available which would you like to create/append",
      Markup.keyboard(["1", "2", "3"]).oneTime().resize()
    );
    ctx.wizard.state.querryIndex = 0;
    return ctx.wizard.next();
  },
  (ctx) => {
    if (Number(ctx.message.text) > 3 || Number(ctx.message.text) < 1) {
      ctx.reply(
        "Please enter a valid search",
        Markup.keyboard(["1", "2", "3"]).oneTime().resize()
      );
      return;
    }
    if (querryContext[Number(ctx.message.text) - 1].isActive) {
      ctx.reply(
        "Sorry this search is Active at the moment you must cancel it with /cancel <Number> (replace <Number> with querry index ), Now cancelling the form"
      );
      return ctx.scene.leave();
    }

    ctx.reply("What is the location? 📍");

    ctx.wizard.state.querryIndex = Number(ctx.message.text) - 1;
    ctx.wizard.state.searchData = {};
    return ctx.wizard.next();
  },
  (ctx) => {
    if (ctx.message.text.length < 2 || typeof ctx.message.text == "undefined") {
      ctx.reply("Please enter real location");
      return;
    }
    ctx.wizard.state.searchData.location = ctx.message.text;
    ctx.reply(
      "Select distance 📏",
      Markup.keyboard(["5", "10", "15", "25", "35", "50", "100"])
        .oneTime()
        .resize()
    );
    return ctx.wizard.next();
  },

  (ctx) => {
    let text = ctx.message.text;
    if (!["5", "10", "15", "25", "35", "50", "100"].includes(text)) {
      ctx.reply(
        "Please only select valid distances",
        Markup.keyboard(["5", "10", "15", "25", "35", "50", "100"])
          .oneTime()
          .resize()
      );
      return;
    }
    ctx.wizard.state.searchData.distance = ctx.message.text;
    ctx.reply(`Select job search criteria, if none type "false" 🔍`);
    return ctx.wizard.next();
  },
  (ctx) => {
    ctx.wizard.state.searchData.searchString = ctx.message.text;

    ctx.reply(
      "Do you only want remote work?",
      Markup.keyboard(["✅ True", "❌ False"]).oneTime()
    );
    return ctx.wizard.next();
  },
  async (ctx) => {
    if (ctx.message.text == "❌ False") {
      ctx.wizard.state.searchData.remote = "false";
    }
    if (ctx.message.text == "✅ True") {
      ctx.wizard.state.searchData.remote = "true";
    }
    ctx.reply(
      "Thank you for filling the form to start it type /search <search number> \nto cancel it type /cancel <search number> \nto preview querry parameters type /params"
    );
    ctx.wizard.state.searchData.isActive = "false";
    querryContext[ctx.wizard.state.querryIndex] = ctx.wizard.state.searchData;
    // useQuerriedDataSearch(ctx);
    return ctx.scene.leave();
  }
);

let JSONtoNiceText = (json, main = false) =>
  Object.entries(json).reduce((accumulator, [first, second]) => {
    if (main == true && (first == "isActive" || first == "intervalID")) {
      return accumulator;
    }
    return accumulator + `\n${first}: ${second}`;
  }, "");

bot.hears("/params", (ctx) => {
  // let querry1 = Object.entries(querryContext[0]).forEach([field, value]);
  let text = `\nquerry 1:
  ${JSONtoNiceText(querryContext[0])} \n\nquerry 2:
  ${JSONtoNiceText(querryContext[1])} \n\nquerry 3:
  ${JSONtoNiceText(querryContext[2])}

  `;
  text = "*The search criterias*" + toMarkdownV2({ text, entities: [] });
  ctx.replyWithMarkdownV2(text);
});
// ctx.message.text;

const searchRegex = new RegExp(/search (.+)/i);
bot.hears(searchRegex, (ctx) => {
  let querryIndex = Number(ctx.match[1]);
  if (querryIndex < 0 || querryIndex > 4) {
    ctx.reply("can be 1, 2 or 3");
  }

  querryIndex = querryIndex - 1;
  // ctx.reply("got it your :" + ctx.match[1]);
  useQuerriedDataSearch(ctx, querryIndex);
});

const cancelationRegex = new RegExp(/cancel (.+)/i);
bot.hears(cancelationRegex, (ctx) => {
  let querryIndex = Number(ctx.match[1]) - 1;
  if (querryIndex < 0 || querryIndex > 3) {
    ctx.reply("can be 1, 2 or 3");
  }

  clearInterval(querryContext[querryIndex].intervalID);
  querryContext[querryIndex] = { text: "search is unfilled", isActive: false };
  ctx.reply(`cancelled querry ${JSONtoNiceText(querryContext[querryIndex])}}`);
});

// bot.action("search");

// bot.hears("/test", ())
let useQuerriedDataSearch = async (ctx, index) => {
  let resultString = `Your search with querry ${index + 1} ${JSONtoNiceText(
    querryContext[index]
  )}\n`;
  let text = await returnListenerText(querryContext[index]);

  text.forEach((e) => {
    resultString += `\nTitle: [${e.title}](${e.link})\nCompany: ${e.company}\nLocation: ${e.location}\nDate: ${e.date}
          `;
  });
  ctx.replyWithMarkdownV2(resultString);

  let minuteFrequency = 16;

  if (index == 1) {
    minuteFrequency = 19;
  }
  if (index == 2) {
    30;
  }

  let intervalID = setInterval(async () => {
    let result = await returnListenerText(querryContext[index]);
    if (typeof result !== "undefined") {
      if (!"error" in result) {
        result.forEach((e) => {
          let message = `Your search with querry${index + 1}${JSONtoNiceText(
            querryContext[index]
          )}\n\nTitle: [${e.title}](${e.link})\nCompany: ${
            e.company
          }\nLocation: ${e.location}
                  `;
          bot.telegram.sendMessage(querryContext.chat_id, message, {
            parse_mode: "MarkdownV2",
          });
        });
      } else {
        let errorMessage = result.error;
        let text =
          "*There was an error*\n" +
          toMarkdownV2({ errorMessage, entities: [] });
        bot.telegram.sendMessage(querryContext.chat_id, text, {
          parse_mode: "MarkdownV2",
        });
      }
    }
  }, minuteFrequency * 60 * 1000);
  querryContext[index].intervalID = intervalID;
  querryContext[index].isActive = true;
};

const stage = new Scenes.Stage([contactDataWizard]);
bot.use(stage.middleware());

bot.hears("see", (ctx) => {
  console.log("THE querry context");
  ctx.reply(JSON.stringify(querryContext.location));
});

bot.start((ctx) => {
  querryContext.chat_id = ctx.update.message.chat.id;

  console.log("HERE");
  return ctx.reply(
    "Welcome to start search press search, to view current search parameters enter /params",
    {
      parse_mode: "HTML",
      ...Markup.inlineKeyboard([Markup.button.callback("Search", "Search")]),
    }
  );
});

bot.action("Search", Scenes.Stage.enter("QUERY FILLER"));

let returnListenerText = async (querryOBJ) => {
  let result = await run(
    querryOBJ.location,
    querryOBJ.remote,
    querryOBJ.distance,
    querryOBJ.searchString
  );

  console.log("THE RESULT: ", result);

  return result;
};

// Start webhook via launch method (preferred)
bot.launch({
  webhook: {
    // Public domain for webhook; e.g.: example.com
    domain: SERVER_URL,

    // Port to listen on; e.g.: 8080
    port: process.env.PORT || 5000,

    // Optional path to listen for.
    // `bot.secretPathComponent()` will be used by default
    hookPath: URI,

    // Optional secret to be sent back in a header for security.
    // e.g.: `crypto.randomBytes(64).toString("hex")`
    // secretToken: randomAlphaNumericString,
  },
});
