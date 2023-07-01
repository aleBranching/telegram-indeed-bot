const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const { disconnect } = require("process");

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
    // console.log(result);
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

let collectionOfNewPosts = {
  data: [
    {
      title: "Housekeeper",
      link: "https://uk.indeed.com/rc/clk?jk=798fea2b45a8edad&fccid=56d9546f1cfd1573&vjs=3",
      company: "Vintage",
      location: "Castleton",
    },
  ],
};
// const fileUrl = require("file-url");

// RETURNS A PROMISE
async function run(location, remote, distance) {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  page.on("console", (msg) => console.log(msg.text()));
  let indeedURL;
  if (distance == "25" && remote == "true") {
    indeedURL = `https://uk.indeed.com/jobs?l=${location}&sc=0kf%253Aattr(DSQF7)%253B&sort=date`;
  }
  if (remote == "true") {
    indeedURL = `https://uk.indeed.com/jobs?l=${location}&sc=0kf%3Aattr%28DSQF7%29%3B&radius=${distance}&sort=date`;
  }
  if (remote == "false") {
    indeedURL = `https://uk.indeed.com/jobs?l=${location}&radius=${distance}&sort=date`;
  }
  //   const URL = `https://uk.indeed.com/jobs?l=${location}&sc=0kf%253Aattr(DSQF7)%253B&radius=${distance}&sort=date`;

  console.log("THE url", indeedURL);

  await page.goto(indeedURL);

  //   await page.screenshot({ path: "example.png", fullPage: true });
  //   await page.screenshot({ path: "example.png", fullPage: true });

  //   const html = await page.content();
  //   console.log(html);
  //   const title = await page.evaluate(() => document.title);
  //   const text = await page.evaluate(() => document.body.innerText);
  //   const courses = await page.evaluate(() =>
  //     Array.from(document.querySelectorAll(".cscourse-grid .card"), (e) => ({
  //       title: e.querySelector(".card-body h3").innerText,
  //       level: e.querySelector(".level").innerText,
  //     }))
  //   );

  const jobtxt = await page.evaluate(() => {
    // let nodeList = document.querySelector(".jobsearch-ResultsList");
    let wholeCard = document.querySelectorAll(".cardOutline.result");

    // nodeList = nodeList.querySelectorAll("span[title]");
    console.log("test");
    // console.log(nodeList);
    const toArray = Array.from(wholeCard, (e) => {
      //   console.log("the e:", e);
      let titleDOM = e.querySelector("span[title]");
      //   return { title: e.innerText, link: e.parentElement.href };
      //   console.log(titleDOM.innerHTML);
      //   console.log(titleDOM.parentElement.href);
      return {
        title: titleDOM.innerHTML.replace(/[^a-zA-Z0-9]/g, " "),
        link: titleDOM.parentElement.href,
        company: e
          .querySelector("span.companyName")
          .innerText.replace(/[^a-zA-Z0-9]/g, " "),
        location: e
          .querySelector("div.companyLocation")
          .innerText.replace(/[^a-zA-Z0-9]/g, " "),
      };
    });
    // console.log(toArray);
    return toArray;
  });

  //   console.log(jobtxt);
  let newResult = { data: jobtxt, searchedAt: new Date().toLocaleString() };
  // before new posts finder
  //   console.log("before new posts");
  //   this way needs to be done if checking a collection
  //   let newPosts = { data: newResultsFinder(newResult, oldJSON) };
  let newPosts = newResultsFinder(newResult, oldJSON);

  if (newPosts.length == 0) {
    console.log("no new jobs found");
    await browser.close();
    return;
  }

  // pushing to collection);
  //   newPosts.data.forEach((element) => {
  //     collectionOfNewPosts.data.push(element);
  //   });
  //   console.log("newPosts", newPosts);
  //   console.log("collectionOfNewPosts", collectionOfNewPosts);
  //   let actualNewPosts = newResultsFinder(newPosts, collectionOfNewPosts);
  //   if (actualNewPosts.length == 0) {
  //     await browser.close();
  //     return;
  //   }
  console.log("=================");
  console.log("THE NEW  JOBS");
  //   console.log(newPosts);
  console.log(newPosts);
  console.log("=================");
  oldJSON.data = oldJSON.data.concat(jobtxt);

  //   fs.readFile(
  //     path.join(__dirname, "results", "jobResultList.json"),
  //     "utf8",
  //     (err, data) => {
  //       if (err) {
  //         console.error(err);
  //         return;
  //       }

  //     }
  //   );
  let JSONstringed = JSON.stringify(newResult);
  //   fs.writeFile("results/jobResultList.json", JSONstringed, (err) => {
  //     if (err) {
  //       console.error(err);
  //     }
  //   });

  await browser.close();

  return newPosts;
}

module.exports = run;
// let result = run("leeds", "false", "50");

// console.log(result);

// run(york, )
// setInterval(() => {
//   let result = run("leeds", "false", "50");
//   console.log(result);
// }, 60 * 1000);
