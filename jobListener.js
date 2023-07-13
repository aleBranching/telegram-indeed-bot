const puppeteer = require("puppeteer");
// const { ConsoleMessage, Page, JSHandle } = require("puppeteer");
// const chalk = require("chalk");
const fs = require("fs");
const path = require("path");
const { disconnect } = require("process");
require("dotenv").config();

let oldJSON = {
  data: [
    {
      title: "Coffee Shop Food Operative",
      link: "https://uk.indeed.com/pagead/clk?mo=r&ad=-6NYlbfkN0DZZww-p_mr8GWlqIRBY21Wjl_Fk3kglyx5_HcxykVqwS3twwbMU6MElWnqjGCDtg_03V4Rs2J9sF31D2rrX-Nc3hUMYeN_oquN3zSTuyGNtgG_FPtP_TP9xWHsWxqz3_HwdnbgZT7G2kz2J5AGvl5QYA1i6JjYuxlj34N1be35w97DKE5jTDHc6Tvk5qlapeW0NEVY9okJCEP_LcidZHVo9kNqKxuISbSxeWjL3eSU_BX16YRm2dDFg1142PUMsNqQnFcVbIl-kPz6g-Je61Z5ZHq459FpGpZ8XJ1YYQAtY_xpG_ePzXUNDbxLphi-l3GtG6phHzEB1xVvhh7GGKbKvYAn4u9ht5f-NSE0w1ykHlxeBwmVw2zznGZSyb8GXpYnok0hbEDB9T-AvbjjNvAH0n91K2QjnPimw1_eDvW643rTTtFGcfm6y0bjnyctf9a-bVTM0eR5x1wCopNpOX8C5jJIMFyGiqjy2ToTHnAiR8J8dMeSlvrv-1jLJtHQtWoDXS_G3mHhqA==&xkcb=SoCz-_M3PJcZzmximZ0LbzkdCdPP&p=0&fvj=1&vjs=3",
      company: "Delico Deli Ltd",
      location: "Aberdare CF44",
    },
  ],
  searchedAt: "13/05/2023, 02:03:59",
};

function newResultsFinder(newJSON, oldJSON) {
  let data = newJSON.data;
  let oldData = oldJSON.data;

  let newData = [];
  data.forEach((element) => {
    let title = element.title;
    let result = titleInArray(title, oldData);
    if (result != false) {
      newData.push(element);
    }
  });

  return newData;
}

function titleInArray(title, jsonData) {
  let result = jsonData.find((element) => element.title == title);

  if (typeof result === "undefined") {
    return title;
  }
  return false;
}

// let innerInnerText = (element) => {
//   console.log(element);
//   (child = element.firstChild), (texts = []);

//   while (child) {
//     if (child.nodeType == 3) {
//       texts.push(child.data);
//     }
//     child = child.nextSibling;
//   }

//   // while at first an elegant solution was attempted a tired got work the next day brain has decided this monstrosity to make sense to do
//   // return texts
//   //   .slice(1)[0]
//   //   .trim()
//   //   .split(" ")
//   //   .slice(1)
//   //   .join(" ")
//   //   .replace(/\+/g, "\\+");
//   return "test";
// };

async function run(location, remote, distance, searchString) {
  const browser = await puppeteer.launch({
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "single-process",
      "--no-zygote",
    ],
    executablePath:
      process.env.NODE_ENV === "production"
        ? process.env.PUPPETEER_EXECUTABLE_PATH
        : puppeteer.executablePath(),
    headless: "new",
  });
  const page = await browser.newPage();
  // page.on("console", (msg) => console.log(msg.text()));
  page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));
  // page.on("console", async (msg) => {
  //   const args = await msg.args();
  //   args.forEach(async (arg) => {
  //     const val = await arg.jsonValue();
  //     // value is serializable
  //     if (JSON.stringify(val) !== JSON.stringify({})) console.log(val);
  //     // value is unserializable (or an empty oject)
  //     // else {
  //     //   const { type, subtype, description } = arg._remoteObject;
  //     //   console.log(
  //     //     `type: ${type}, subtype: ${subtype}, description:\n ${description}`
  //     //   );
  //     // }
  //   });
  // });

  let indeedURL;
  if (searchString == "false") {
    if (distance == "25" && remote == "true") {
      indeedURL = `https://uk.indeed.com/jobs?l=${location}&sc=0kf%253Aattr(DSQF7)%253B&sort=date`;
    }
    if (remote == "true") {
      indeedURL = `https://uk.indeed.com/jobs?l=${location}&sc=0kf%3Aattr%28DSQF7%29%3B&radius=${distance}&sort=date`;
    }
    if (remote == "false") {
      indeedURL = `https://uk.indeed.com/jobs?l=${location}&radius=${distance}&sort=date`;
    }
  }

  let ammendedSearchString = searchString.split(" ").join("+");
  if (distance == "25" && remote == "true") {
    indeedURL = `https://uk.indeed.com/jobs?q=${ammendedSearchString}&l=${location}&sc=0kf%253Aattr(DSQF7)%253B&sort=date`;
  }
  if (remote == "true") {
    indeedURL = `https://uk.indeed.com/jobs?q=${ammendedSearchString}&l=${location}&sc=0kf%3Aattr%28DSQF7%29%3B&radius=${distance}&sort=date`;
  }
  if (remote == "false") {
    indeedURL = `https://uk.indeed.com/jobs?q=${ammendedSearchString}&l=${location}&radius=${distance}&sort=date`;
  }

  console.log("THE url", indeedURL);

  await page.goto(indeedURL);

  const jobtxt = await page.evaluate(() => {
    let innerInnerText = (element) => {
      console.log(element);
      child = element.firstChild;
      texts = [];

      while (child) {
        if (child.nodeType == 3) {
          texts.push(child.data);
        }
        child = child.nextSibling;
      }

      // while at first an elegant solution was attempted a tired got work the next day brain has decided this monstrosity to make sense to do
      // console.log("here");
      // console.log(texts);
      // return texts
      //   .slice(1)[0]
      //   .trim()
      //   .split(" ")
      //   .slice(1)
      //   .join(" ")
      //   .replace(/\+/g, "\\+");
      return "test";
    };

    let wholeCard = document.querySelectorAll(".cardOutline.result");

    console.log("test");

    const toArray = Array.from(wholeCard, (e) => {
      let titleDOM = e.querySelector("span[title]");

      // console.log(
      //   e
      //     .querySelector("span.date")
      //     .innerText.trim()
      //     .split(" ")
      //     .slice(1)
      //     .join(" ")
      // );

      let tryGetText = (callbackFN) => {
        try {
          return callbackFN();
        } catch (error) {
          return "failed to scrape text";
        }
      };

      return {
        title: titleDOM.innerHTML.replace(/[^a-zA-Z0-9]/g, " "),
        link: titleDOM.parentElement.href,
        company: tryGetText(() =>
          e
            .querySelector("span.companyName")
            .innerText.replace(/[^a-zA-Z0-9]/g, " ")
        ),
        location: tryGetText(() =>
          e
            .querySelector("div.companyLocation")
            .innerText.replace(/[^a-zA-Z0-9]/g, " ")
        ),
        date: tryGetText(() =>
          e
            .querySelector("span.date")
            .innerText.trim()
            .replace(/\n/g, " ")
            .split(" ")
            .slice(1)
            .join(" ")
        ),
      };
    });

    return toArray;
  });

  let newResult = { data: jobtxt, searchedAt: new Date().toLocaleString() };

  let newPosts = newResultsFinder(newResult, oldJSON);

  if (newPosts.length == 0) {
    console.log("no new jobs found");
    await browser.close();
    return;
  }

  console.log(newPosts);
  oldJSON.data = oldJSON.data.concat(jobtxt);

  await browser.close();

  return newPosts;
}

module.exports = run;
