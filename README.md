# Telegram bot for notifying of job changes on Indeed

After the initial search of jobs based on user criteria any new jobs are sent as a message by telegram bot every 5 minutes. You can generate 3 searches each of which can be cancelled or edited.

## I wanna use this. How can I?

Due to the nature of web scraping supporting multiple users adds a lot of complexity. Through building this I have already run into instances of being temporarily blocked by indeed. It is best to deploy it yourself or run a local instance on an old machine 24/7. A VPN is recommended to be used.

### deployment

railway.app was used to deploy this. It can be easily deployed as there is a dockerfile to allow for support of puppeteer. Two environment variables are needed. The SERVER_URL which can be found after deployment and generating a domain and BOT_TOKEN which is gotten from thebotfather in telegram.

### local dev environment:

- run `npm install` to install dependencies.
- on the terminal run `ngrok http 5000` install ngrok if you don't already have it. This will alow you to forward telegram post requests from a public url to local host.
- copy the link generated and paste it into SERVER_URL variable in a `.env` file.
- aquire a bot token from telegram paste it into BOT_TOKEN variable in the `.env` file
- run `npm run dev`

## future goals:

- change this to allow for a cron job deployment.

## new update

- allows for notifications for up to 3 searches.
- search string for specific job added
- added a date of specific job post
- cancelling and editing job searches
