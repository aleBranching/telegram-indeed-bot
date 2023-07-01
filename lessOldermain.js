const express = require("express");
// import { Telegraf } from "telegraf";
const { Telegraf } = require("telegraf");
const createServer = require("http");

// createServer(await bot.createWebhook({ domain: "example.com" })).listen(3000);
require("dotenv").config();

const { BOT_TOKEN, SERVER_URL } = process.env;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const URI = `/webhook/${BOT_TOKEN}`;
const WEBHOOK_URL = SERVER_URL + URI;

const bot = new Telegraf(BOT_TOKEN);
const app = express();

// Set the bot API endpoint

createServer(
  async () => await bot.createWebhook({ domain: "example.com" })
).listen(3000);

bot.start((ctx) => ctx.reply("Hello I will look for a job for you "));

app.listen(process.env.PORT || 5000, () =>
  console.log("Listening on port", process.env.PORT || 5000)
);
