const { Telegraf, Markup, Scenes, session, Stage } = require("telegraf");
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
let querryContext = {};

const contactDataWizard = new Scenes.WizardScene(
  "QUERY FILLER",
  (ctx) => {
    ctx.reply("What is the location?");
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
      "Select distance",
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
    ctx.reply("Select job search criteria");
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
      "Thank you for filling the form we will notify you of current results"
    );
    querryContext = ctx.wizard.state.searchData;
    useQuerriedDataSearch(ctx);
    return ctx.scene.leave();
  }
);
let useQuerriedDataSearch = async (ctx) => {
  let resultString = ``;
  let text = await returnListenerText(querryContext);
  text.forEach((e) => {
    resultString += `
        Title: [${e.title}](${e.link})
        Company: ${e.company}
        Location: ${e.location}
        
        `;
  });
  ctx.replyWithMarkdownV2(resultString);

  setInterval(async () => {
    let result = await returnListenerText(querryContext);
    if (typeof result !== "undefined") {
      result.forEach((e) => {
        let message = `
                Title: [${e.title}](${e.link})
                Company: ${e.company}
                Location: ${e.location}

                `;
        bot.telegram.sendMessage(5033076293, message, {
          parse_mode: "MarkdownV2",
        });
      });
    }
  }, 5 * 60 * 1000);
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
  return ctx.reply("Welcome to start search press search", {
    parse_mode: "HTML",
    ...Markup.inlineKeyboard([Markup.button.callback("Search", "Search")]),
  });
});

bot.action("Search", Scenes.Stage.enter("QUERY FILLER"));

let returnListenerText = async (querryOBJ) => {
  let result = await run(
    querryOBJ.location,
    querryOBJ.remote,
    querryOBJ.distance
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
