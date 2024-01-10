**The Ultimate Discord Bot for Seamless Subscription Management with Stripe!**

This StripeCord bot is useful to make an easy free integration with those two platforms. It makes direct requests to Stripe API without fees. It's just as simple as you think! Customers only need to provide e-mail address they used in Stripe Subscriptions within a Discord Command and they get instant access. There is a function to check every X hours if all the subscriptions are active or not.

## TO-DO LIST

- Make some verifications if the user leave the Discord to don't make errors;
- Command to delete a user from the database;
- Command to force sync (execute the "daily-check").

If anyone would like to help the project, I would be grateful if you could make pull requests on what I still have pending, to enrich this project.

## Technical Requirements

- **Node.js:** v18.0.0 or higher
- **MongoDB Atlas Account** (free)
- **npm:** v6.0.0 or higher

- **pm2:** Optional. (JS manager)

## Installation

1. Clone the repository: `git clone https://github.com/Rodaviva29/StripeCord.git`
2. Install all dependencies: `npm install`
3. Change the file `.env.example` to `.env`.
4. Configure the necessary environment variables in `.env`.

6. Start the application: `npm start` or check 7.
7. If you are using pm2 as JS manager, you can use `pm2 start index.js --name name_of_your_choice` instead.

## Mongo DB Atlas Setup

1. StripeCord storage 3 types of information in MongoDB (Atlas or not).
2. E-mail, Discord User ID, or hadActiveSubscription (boolean).
3. You can create a free cluster with Database name you choose in DATABASE_NAME in `.env`
4. You will also need to create a Collection from a name you choose in DATABASE_COLLECTION_NAME in `.env`
5. It's needed a Mongo DB Connection URL you can create a profile for that URL from `Database Access` tab.
6. It's also recommended to limit Network Access for certain IPs (your server machine) in `Network Access` tab.


## Stripe Configuration

1. Firstly you should get a Stripe API Key from "Developers" Tab.
2. You can generate a Stripe Restricted Key with the needed permissions (e.g view only)
3. You probably need to change Stripe API version (default one is from 2019), go to latest.

## Enviroment (.env) Configuration

1. As said, you need to change the default enviroment file to .env (default is .env.example)

`SUBSCRIPTION_NAME`: Your Subscription Name to use in some Messages of the Bot.

`DISCORD_CLIENT_TOKEN:` Your Discord Bot's token [Check here where to get it](https://discord.com/developers/applications).

`DATABASE_URL:` Your Mongo DB URL (something like this: mongodb+srv://user:password@cluster.mongodb.net).

`DABASE_NAME`: Your database name.

`DATABASE_COLLECTION_NAME`: Your sub category database name, known as collection name.

`CHECK_HOURS`: Time in hours that the function check should be activated.

`COMMAND_NAME_STATUS`: Name of the administration verification command user status should be called.
`COMMAND_NAME_LINK`: Name of the user link/email command should be called.

`COMMAND_NAME_ADMIN_LINK`: Name of the admin force link/email command should be called.

`STRIPE_API_KEY`: API Key from Stripe.

`STRIPE_PAYMENT_LINK`: Payment Link that users should use to get a subscription.
`STRIPE_PORTAL_LINK`: Portal/User Dashboard Link that users should use to go to the configuration portal of the subscriptions.

`PAYING_ROLE_ID`: Role id that should be given to the user that has an active subscription.

`GUILD_ID`: Guild id that the bot should work.

`CLIENT_ID`: Discord bot id. (id of the bot itself)

`LOGS_CHANNEL_ID`: Channel Id in the guild id provided for the bot sends logs (sucessfull e-mail links and cancelled subscriptions).

## License

This project is licensed under the MIT License - check the [LICENSE.md](LICENSE.md) file for details.

## Acknowledgements

Core concept inspired by [Androz2091/stripe-discord-bot](https://github.com/Androz2091/stripe-discord-bot).

This version is a simplified version with JavaScript instead of TypeScript and it works with Mongo DB Atlas instead of PostGres to be ready to go!

---

We hope you enjoy using Stripe Cord. If you have any questions or issues, feel free to contact me on Discord (prefereble) or via email. My Discord nickname is `Rodaviva`, and you can reach me at `rodaviva29@gmail.com` via mail.

**Safe Contributions!** 💸
