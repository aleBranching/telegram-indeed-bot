require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const { Telegraf } = require("telegraf");
const { message } = require("telegraf/filters");

const { BOT_TOKEN, SERVER_URL } = process.env;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const URI = `/webhook/${BOT_TOKEN}`;
const WEBHOOK_URL = SERVER_URL + URI;

const app = express();
app.use(bodyParser.json());

const init = async () => {
  const res = await axios.get(`${TELEGRAM_API}/setWebhook?url=${WEBHOOK_URL}`);
  console.log(res.data);
};

// app.post(URI, async (req, res) => {
//   console.log(req.body);
//   const chatID = req.body.message.chat.id;
//   const text = req.body.message.text;

//   //   golden line
//   await axios.post(`${TELEGRAM_API}/sendMessage`, { chat_id: chatID, text });
//   res.sendStatus(200);
// });

app.listen(process.env.PORT || 5000, async () => {
  console.log("🚀 app running on port", process.env.PORT || 5000);
  await init();
});

const bot = new Telegraf(process.env.BOT_TOKEN);
bot.start((ctx) => ctx.reply("Welcome"));
