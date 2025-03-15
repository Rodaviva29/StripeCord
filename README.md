**The Ultimate Discord Bot for Seamless Subscription Management with Stripe!**

This StripeCord bot is useful to make an easy free integration with those two platforms. It makes direct requests to Stripe API without fees. It's just as simple as you think! Customers only need to provide e-mail address they used in Stripe Subscriptions within a Discord Command and they get instant access. There is a function to check every X hours if all the subscriptions are active or not.

## :warning: StripeCord V2 BETA RELEASE | IMPORTANT NOTICE

- This is a dev branch, please don't use in production unless you know what you are doing.

### 🛠 Changes & Improvements (V2.0)

- **Configuration Updates**  
  - Moved `.env` to `config/` and added two new variables: `CHECK_STATUS` and `COMMAND_NAME_UNLINK`. (Check above for more details.)  

- **Role Management Enhancements**  
  - Added support for multiple role IDs (configurable). Also includes a fallback for a single role. (New config in `config/plans.js`.)  
  - Implemented extensive new checks to track multiple roles in the database.  
  - Improved `permsCheck.js` function to ensure stability when users switch email accounts (rare scenario).  

- **Subscription Status Handling**  
  - Added support to determine if roles should be revoked during `past_due` or immediately when the status changes to anything other than `active`.  

- **Hosting & Deployment**  
  - Added support for Discloud Easy Host Provider (`discloud.config`).  

- **Command Enhancements**  
  - Introduced a **Button Command** `/button` to simulate the `/link` command.  
  - Implemented the `/unlink` command with a **2-hour cooldown** to prevent abuse (e.g., users looping between link/unlink).  
    - Users can now delete their data and roles from the database.  
    - Allows users to refresh their roles, enabling them to relink if they had previously linked but their roles were outdated.  

- **Dependency & Codebase Updates**  
  - Updated dependencies and removed unused modules.  
  - Refactored code to align with the latest `discord.js` syntax.

## 🛠 Changes & Improvements (V2.1)

### 🔧 New Features
- **Added a "Manage Subs" button** (suggested by you).
- **Implemented `dateUpdate` schema** for a future feature.
- **New function and command to remove inactive users from the database**: Users inactive for 30 days or more will be removed, improving the efficiency of `dailyChecks` by reducing the number of users being processed.

### 🔄 Role & Subscription Management
- **Updated `delete-admin` logic**: Now allows the deletion of actively subscribed users. Their roles will be removed upon deletion, whereas before, the system blocked the action with an admin message.
- **Revamped linking logic (modal and command)**: Users can now resync their roles. Previously, attempting to link an already linked email resulted in an error message. The system now differentiates between a resync and a new link in the logs.

### 🕒 Sync & Execution Improvements
- **Renamed `dailySync.js` to `permsSync.js`**: More accurately reflects its purpose, as it can be configured to run hourly.
- **Fixed a misnamed variable in `stripe.js`**: Renamed `oldCustomerId` to `customerId`.
- **Significant rework of `permsCheck.js`**: Enhanced logic and added extensive logging. The system now logs when a user receives new roles during sync.

### 🧪 Beta Notes  
- Added numerous test scenarios to ensure system stability.  
- This is a **tested Beta Version**, not a full release. Breaking errors may occur.

If anyone would like to help the project, I would be grateful if you could make pull requests on what I still have pending, to enrich this project.

## Features

1. Force Link Users to an E-mail with a Command;
2. Users themselfs can Link their E-mail with a Command or w/ a Message Button;
3. Admin Command to Check the Status of the Subscription from Stripe;
4. Configure the name of the commands, the time the check will execute and + with `.env` file and `config/plans.js`.
5. Support for different Discord Roles for Different Plans and Stripe Subscriptions. (Plan ID, price_XXX)

## Wiki / Documentation

Please check the [Wiki / Docs](https://github.com/Rodaviva29/StripeCord/wiki) to get started with this project.

## License

This project is licensed under the MIT License - check the [LICENSE.md](LICENSE.md) file for details.

## Acknowledgements

Core concept inspired by [Androz2091/stripe-discord-bot](https://github.com/Androz2091/stripe-discord-bot).

This version is a simplified version with JavaScript instead of TypeScript

**Database Core**: Mongo DB Atlas instead of PostGres to be ready to go!

NOTE: If you want to change the database type to SQL, I can open a branch for you, give me a thumbs up!

---

We hope you enjoy using Stripe Cord. If you have any questions or issues, feel free to contact me on Discord (prefereble) or via email. My Discord nickname is `Rodaviva`, and you can reach me at `rodaviva29@gmail.com` via mail.

**Safe Contributions!** 💸
