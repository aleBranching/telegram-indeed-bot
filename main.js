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
  "QUERY FILLER", // first argument is Scene_ID, same as for BaseScene
  (ctx) => {
    ctx.reply("What is the location?");
    ctx.wizard.state.searchData = {};
    return ctx.wizard.next();
  },
  (ctx) => {
    // validation example
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
    // validation example
    //   for distance there are options of 5, 10, 15, 25, 35, 50, 100,
    let text = ctx.message.text;
    if (!["5", "10", "15", "25", "35", "50", "100"].includes(text)) {
      // ctx.reply("Please only select valid distances");
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
    // validation example
    //   for distance there are options of 5, 10, 15, 25, 35, 50, 100,
    ctx.wizard.state.searchData.searchString = ctx.message.text;

    ctx.reply(
      "Do you only want remote work?",
      Markup.keyboard(["✅ True", "❌ False"]).oneTime()
    );
    return ctx.wizard.next();
  },
  async (ctx) => {
    ctx.wizard.state.searchData.remoteWork = ctx.message.text;
    ctx.reply(
      "Thank you for filling the form we will notify you of current results"
    );
    querryContext = ctx.wizard.state.searchData;

    return ctx.scene.leave();
  }
);

const stage = new Scenes.Stage([contactDataWizard]);
bot.use(stage.middleware());

bot.hears("see", (ctx) => {
  console.log("THE querry context");
  ctx.reply(JSON.stringify(querryContext));
});
// bot.start((ctx) => {
//   querryContext.chat_id = ctx.update.message.chat.id;

//   ctx.reply(`Welcome for location type /location <location to search( excluding <>)>
//   for optional seach querry /seach <search querry>
//   for distance there are options of 5, 10, 15, 25, 35, 50, 100,
//   for remote work /remote <Boolean>`);
// });
bot.start((ctx) => {
  querryContext.chat_id = ctx.update.message.chat.id;

  console.log("HERE");
  return ctx.reply("Welcome to start search press search", {
    parse_mode: "HTML",
    ...Markup.inlineKeyboard([Markup.button.callback("Search", "Search")]),
  });
});

bot.action("Search", Scenes.Stage.enter("QUERY FILLER"));
bot.command("inline", (ctx) => {
  return ctx.reply("<b>Coke</b> or <i>Pepsi?</i>", {
    parse_mode: "HTML",
    ...Markup.inlineKeyboard([
      Markup.button.callback("Coke", "Coke"),
      Markup.button.callback("Pepsi", "Pepsi"),
    ]),
  });
});

// bot.on(message("text"), (ctx) => ctx.reply("Hello"));
// bot.hears(/\/echo (.+)/, (ctx) => {
//   console.log(ctx);
//   ctx.reply("Hey there");
// });

const regex = new RegExp(/location (.+)/i);
bot.hears(regex, (ctx) => {
  //regex
  console.log("regex", regex);
  console.log("ctx :", ctx);

  querryContext.location = ctx.match[1];
  console.log("==================");
  //   console.log(ctx.update.message.chat.id);

  console.log("==================");

  ctx.reply("got it your location is set to:" + ctx.match[1]);
});

bot.hears(new RegExp(/search (.+)/i), (ctx) => {
  //regex
  console.log("regex", regex);
  console.log("ctx :", ctx);

  querryContext.search = ctx.match[1];
  console.log("==================");
  //   console.log(ctx.update.message.chat.id);
  console.log(ctx.match[1]);

  console.log("==================");

  ctx.reply("got it your location is set to:" + ctx.match[1]);
});

bot.hears(new RegExp(/distance (.+)/i), (ctx) => {
  //regex
  //   console.log("regex", regex);
  //   console.log("ctx :", ctx);

  querryContext.distance = ctx.match[1];
  console.log("==================");
  //   console.log(ctx.update.message.chat.id);
  console.log(ctx.match[1]);
  console.log("==================");

  ctx.reply("got it your distance is set to:" + ctx.match[1]);
});

bot.hears(new RegExp(/remote (.+)/i), (ctx) => {
  //regex
  // console.log("regex", regex);
  // console.log("ctx :", ctx);

  querryContext.remote = ctx.match[1];
  console.log("==================");
  //   console.log(ctx.update.message.chat.id);
  console.log(ctx.match[1]);

  console.log("==================");

  ctx.reply("got it your remote work is set to:" + ctx.match[1]);
});

bot.hears("/preview", (ctx) => {
  //regex
  // console.log("regex", regex);
  // console.log("ctx :", ctx);
  //
  // querryContext.distance = ctx.match[1];
  console.log("==================");
  //   console.log(ctx.update.message.chat.id);
  // console.log(ctx.match[1]);

  console.log("==================");

  ctx.reply("here are fields you filled out:" + JSON.stringify(querryContext));
});

bot.hears("/watch", async (ctx) => {
  let checkOfObject = checkObject(querryContext);
  if (checkObject.pass == false) {
    ctx.reply(checkObject.message);
  }
  let resultString = ``;

  let text = await returnListenerText();
  text.forEach((e) => {
    resultString += `
        Title: [${e.title}](${e.link})
        Company: ${e.company}
        Location: ${e.location}
        
        `;
  });
  ctx.replyWithMarkdownV2(resultString);
  //   console.log("THE RETURNED TEXT: ", text);
  //   console.log(querryContext.toString());
  //   ctx.reply(querryContext.toString());
});

let querryContextDEV = { location: "york", distance: "50", remote: "true" };
bot.hears("/watchDEV", async (ctx) => {
  const checkOfObject = checkObject(querryContextDEV);

  if (checkObject.pass == false) {
    ctx.reply(checkObject.message);
  }

  //   let text = await returnListenerText();
  //   console.log("THE RETURNED TEXT: ", text);
  //   console.log(JSON.stringify(querryContextDEV));
  let resultString = ``;

  let result = await returnListenerText(querryContextDEV);

  console.log("THE RESULT", result);
  result.forEach((e) => {
    let message = `
        Title: [${e.title}](${e.link})
        Company: ${e.company}
        Location: ${e.location}
        
        `;

    ctx.replyWithMarkdownV2(message);
  });

  setInterval(async () => {
    let result = await returnListenerText(querryContextDEV);
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
});

bot.hears("/md", async (ctx) => {
  //   ctx.reply("# hi my name is", { reply_markup: "markdown" });

  //   bot.telegram.sendMessage(5033076293, `[this is a linl](example.com)`, {
  //     parse_mode: "MarkdownV2",
  //   });

  let resultString = ``;

  //   sampleData.forEach((e) => {
  //     let message = `
  //     Title: [${e.title}](${e.link})
  //     Company: ${e.company}
  //     Location: ${e.location}

  //     `;
  //     ctx.replyWithMarkdownV2(message);
  //   });

  sampleData.forEach((e) => {
    let message = `
        Title: [${e.title}](${e.link})
        Company: ${e.company}
        Location: ${e.location}
        
        `;

    ctx.replyWithMarkdownV2(message);
  });
});
let returnListenerText = async (querryOBJ) => {
  let result = await run(
    querryOBJ.location,
    querryOBJ.remote,
    querryOBJ.distance
  );

  console.log("THE RESULT: ", result);

  return result;
};

function checkObject(object) {
  if (!"location" in object) {
    return { pass: false, message: "no location" };
  }

  if (
    object.distance !== "5" ||
    object.distance !== "10" ||
    object.distance !== "15" ||
    object.distance !== "25" ||
    object.distance !== "35" ||
    object.distance !== "50" ||
    object.distance !== "100"
  ) {
    return { pass: false, message: "distance has not been set properly" };
  }

  if (typeof object.remote !== "True" || typeof object.remote !== "false") {
    return { pass: false, message: "has to be true or false" };
  }

  return {
    pass: true,
    message: `you have sucessfully filled out with following setting ${querryContext.toString()}`,
  };
}

// bot.on(
//   message(/\/echo (.+)/, (ctx) => {
//     console.log(ctx);
//   })
// );

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
