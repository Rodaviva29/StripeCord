**The Ultimate Discord Bot for Seamless Subscription Management with Stripe!**

This StripeCord bot is useful to make an easy free integration with those two platforms. It makes direct requests to Stripe API without fees. It's just as simple as you think! Customers only need to provide e-mail address they used in Stripe Subscriptions within a Discord Command and they get instant access. There is a function to check every X hours if all the subscriptions are active or not.

## :warning: StripeCord V2 BETA RELEASE | IMPORTANT NOTICE

- This is a dev branch, please don't use in production unless you know what you are doing.

### 🧪 Beta Notes  
- Added numerous test scenarios to ensure system stability.  
- This is a **tested Beta Version**, not a full release. Breaking errors may occur.

If anyone would like to help the project, I would be grateful if you could make pull requests on what I still have pending, to enrich this project. Any [Ko-Fis](https://ko-fi.com/rodaviva) given would be greatly welcome to allow me to continue to mantain this project development.

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


---

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

Core concept inspired by [Androz2091/stripe-discord-bot](https://github.com/Androz2091/stripe-discord-bot). Converted from TypeScript in JavaScript as I prefer JS.
**Database Core**: Mongo DB Atlas instead of PostGres to be ready to go! (If you want to change the database type to SQL, I can open a branch for you, give me a thumbs up!)

---

We hope you enjoy using Stripe Cord. If you have any questions or issues, feel free to contact me on Discord (prefereble) or via email. My Discord nickname is `Rodaviva`, and you can reach me at `rodaviva29@gmail.com` via mail.

**Safe Contributions!** 💸
