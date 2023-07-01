const { Telegraf, Markup, Scenes, session, Stage } = require("telegraf");
// const message = require("telegraf/filters");
const { message } = require("telegraf/filters");
// const  = require("telegraf/session");
const run = require("./jobListener");

require("dotenv").config();

const { BOT_TOKEN, SERVER_URL } = process.env;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const URI = `/webhook/${BOT_TOKEN}`;
const WEBHOOK_URL = SERVER_URL + URI;

const bot = new Telegraf(BOT_TOKEN);

let querryContext = {};

// bot.start((ctx) => {
//   querryContext.chat_id = ctx.update.message.chat.id;

//   ctx.reply(`Welcome for location type /location <location to search( excluding <>)>
//   for optional seach querry /seach <search querry>
//   for distance there are options of 5, 10, 15, 25, 35, 50, 100,
//   for remote work /remote <Boolean>`);
// });
bot.use(Telegraf.log());

bot.use(session());

// import { Scenes } from "telegraf";

const contactDataWizard = new Scenes.WizardScene(
  "CONTACT_DATA_WIZARD_SCENE_ID", // first argument is Scene_ID, same as for BaseScene
  (ctx) => {
    ctx.reply("What is your name?");
    ctx.wizard.state.contactData = {};
    return ctx.wizard.next();
  },
  (ctx) => {
    // validation example
    if (ctx.message.text.length < 2) {
      ctx.reply("Please enter name for real");
      return;
    }
    ctx.wizard.state.contactData.fio = ctx.message.text;
    ctx.reply("Enter your e-mail");
    return ctx.wizard.next();
  },
  async (ctx) => {
    ctx.wizard.state.contactData.email = ctx.message.text;
    ctx.reply("Thank you for your replies, well contact your soon");
    // await mySendContactDataMomentBeforeErase(ctx.wizard.state.contactData);
    return ctx.scene.leave();
  }
);
const stage = new Scenes.Stage([contactDataWizard]);
console.log(stage);
bot.use(stage.middleware());
bot.hears("hi", Scenes.Stage.enter("CONTACT_DATA_WIZARD_SCENE_ID"));

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
