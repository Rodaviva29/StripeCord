**The Ultimate Discord Bot for Seamless Subscription Management with Stripe!**

StripeCord is a simple, free solution to seamlessly integrate Stripe and Discord. It connects directly to the Stripe API, with no extra fees involved. All your customers need to do is enter the email address they used for their Stripe subscription via a Discord command, and they’ll get instant access. Plus, the bot automatically checks every X hours to ensure all subscriptions are still valid.

## :warning: StripeCord V2 BETA RELEASE | IMPORTANT NOTICE

- This is a dev branch, please don't use in production unless you know what you are doing.

### 🧪 Beta Notes  
- Added numerous test scenarios to ensure system stability.  
- This is a **tested Beta Version**, not a full release. Breaking errors may occur.

If anyone would like to help the project, I would be grateful if you could make PRs or create a issue for enhancement features or bugs found. Any [Ko-Fis](https://ko-fi.com/rodaviva) given would be greatly welcome to allow me to continue to mantain this project development.

## 🛠 Changes & Improvements (v2.0)

### 🔧 Configuration Updates
- **Relocated `.env` file**: Moved to the `config/` folder for better organization.
- **Added new environment variables**: Introduced `CHECK_STATUS` and `COMMAND_NAME_UNLINK` to provide more control over subscription status checks and unlink command customization. (See documentation above for usage.)

### 🔄 Role & Subscription Management
- **Support for multiple role IDs**: System now supports multiple Discord role IDs per plan, configurable via `config/plans.js`. Also includes fallback logic for single-role setups.
- **Enhanced database tracking for roles**: Implemented new checks to accurately track multiple roles assigned to users in the database.
- **Improved handling of email switches**: Updated `permsCheck.js` to ensure correct role synchronization even in rare cases where users switch email accounts.

### 🕒 Subscription Status Handling
- **Flexible status-based role revocation**: Added support to control whether roles are revoked when a subscription is marked as `past_due` or any non-`active` status, configurable via `CHECK_STATUS`.

### 🚀 Hosting & Deployment
- **Discloud Easy Host integration**: Added support for Discloud deployment using `discloud.config` file.

### 💬 Command Enhancements
- **New `/button` command**: Simulates the `/link` command using a button for quicker role linking.
- **Implemented `/unlink` command with cooldown**: Introduced a **2-hour cooldown** to prevent abuse (e.g., users rapidly linking/unlinking). The command allows:
  - Users to delete their data and roles from the database.
  - Users to refresh roles and relink accounts in case of outdated links.

### 🧰 Dependency & Codebase Updates
- **Updated dependencies**: Removed unused modules and updated existing ones to the latest stable versions.
- **Codebase refactor**: Aligned all modules with the latest `discord.js` syntax for better stability and maintainability.

## 🛠 Changes & Improvements (v2.1)

### 🔧 New Features
- **Added a "Manage Subs" button** to the embed command.
- **Implemented `dateUpdate` parameter** into the DB to support inactivity function.
- **New function and command to remove inactive users from the database**: Users inactive for 30 days or more will be removed, improving the efficiency of `dailyChecks` by reducing the number of users being processed.

### 🔄 Role & Subscription Management
- **Updated `delete-admin` logic**: Now allows the deletion of actively subscribed users. Their roles will be removed upon deletion, whereas before, the system blocked the action with an admin message.
- **Revamped linking logic (modal and command)**: Users can now resync their roles. Previously, attempting to link an already linked email resulted in an error message. The system now differentiates between a resync and a new link in the logs.

### 🕒 Sync & Execution Improvements
- **Renamed `dailySync.js` to `permsSync.js`**: More accurately reflects its purpose, as it can be configured to run hourly.
- **Fixed a misnamed variable in `stripe.js`**: Renamed `oldCustomerId` to `customerId`.
- **Significant rework of `permsCheck.js`**: Enhanced logic and added extensive logging. The system now logs when a user receives new roles during sync.

## 🛠 Changes & Improvements (v2.2)

### 🔧 New Features
- **Support for multiple `customer_ids` per email**: The integration with `stripe.js` was restructured to return all associated `customer_ids` instead of only the first one. Implemented `Promise.all` to fetch subscriptions for all `customer_ids` linked to the same email, improving accuracy.
- **Introduced `safetyMode` feature**: Optional verification controlled via the `.env` file. When enabled, the system checks all members holding any role defined in `plans.js` (or the role specified in the environment file). If a member is not found in the database, their roles will be revoked as a security measure.
- **Translation system preparation**: System updated to support multiple languages. Starting from v2.3, all texts will be managed in `config/lang/en.js` or respective language files, making localization and updates easier.

### 🔄 Role & Subscription Management
- **Improved handling of multiple roles per plan**: Fixed an issue introduced in v2.1 where users with two or more plans sharing the same Discord role ID would lose the role unless they held *all* matching plans. Now, the system correctly checks if the user has at least one valid plan before removing the role.
- **Correct behavior when single-role mode is disabled**: The system now properly handles multiple roles when `plans.js`'s single-role mode is off.

### 🕒 Sync & Execution Improvements
- **Refactored permission synchronization logic**: Major rewrite of the `permsCheck.js` script. Critical issues fixed, such as using `return` inside loops (now correctly replaced by `continue` where appropriate). Added early validation to check if the member still exists in the guild — if not, the user is removed from the database. Additionally, any user marked as having no active subscription in the DB will always have their roles removed for safety.
- **Updated environment variable defaults**: The default value of `CHECK_STATUS` has been changed from `past_due` to `active`, ensuring roles are revoked when a user's payment is overdue.
- **Fixed filter placement for `CHECK_STATUS`**: The status filter is now correctly applied in the intended function, improving logic consistency.

### 🐛 Bug Fixes
- **Fixed import in `dev/delete.js` command**: `planConfig` was missing and is now properly imported.
- **Resolved issue in linking logic logs**: The system now correctly logs whether a user is performing a new link or simply resyncing their roles.
- **General code improvements**: Minor bug fixes and code optimization across various modules.

## 🛠 Changes & Improvements (v2.3 - Release Candidate)

### 🔧 New Features
- **Added translation/languagem system**: Now you can translate the bot to your language and configure the language in separate files in config/lang/ making updating the bot easier.

### 🔄 Configurations
- Made optional configurations of the name of the commands in the .env file.

### 🕒 Sync & Execution Improvements
- **Customer id missing logic changed**: Now if the customer id is missing, the bot will log the error, delete the user from the database and send a message to the user if the subscriptions was previously active and remove the roles from the user.

---

## Wiki / Documentation

Please check the [Wiki / Docs](https://github.com/Rodaviva29/StripeCord/wiki) to get started with this project and to see all the awesome features.

## License

This project is licensed under the MIT License - check the [LICENSE.md](LICENSE.md) file for details.

## Acknowledgements

Core concept inspired by [Androz2091/stripe-discord-bot](https://github.com/Androz2091/stripe-discord-bot).

This version uses JavaScript instead of TypeScript and noSQL (MongoDB) instead of SQL. 
- Want to switch to SQL? Just give me a thumbs up and I’ll create a branch for you!

---

We hope you enjoy using Stripe Cord. If you have any questions or issues, feel free to contact me on Discord (prefereble) or via chat in https://chung-jf.me. My Discord nickname is `Rodaviva`.

**Safe Contributions!** 💸
