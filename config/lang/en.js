/**
 * English language file for StripeCord
 */

module.exports = {
    commands: {
        admin: {
            button: {
                slashCommandDescription: "Send a message with a button to link your Stripe account.",
                embedTitle: `${process.env.SUBSCRIPTION_NAME} - Account Linking`,
                embedDescription: "Click the button below to link your Stripe account email with your Discord account.\n\nThis will give you access to subscriber-only content and features.",
                embedFooter: "You can also use the /link command directly with your email.",
                buttonLinkLabel: "Link Stripe Account",
                buttonPortalLabel: "Manage Subscriptions",
                slashCommandInteraction: "Wohoo! Setup button message sent."
            },
            link: {
                slashCommandDescription: "Link your Stripe account email with your Discord account.",
                slashCommandUserOption: "Force link a member to a certain email.",
                slashCommandStringOption: "Enter customer's Stripe Account email.",
                embedEmailRegexDescription: "Hey **{username}**, email address typed is **not valid**. Please make sure you are typing it correctly and execute this command again.",
                embedExistingEmailCustomerDescription: "The email address provided is **already in use** by another member. Use another e-mail or check your Database if you think this is an error.",
                embedSameEmailDescription: "The email provided is **already in use** by the customer himself ({customer_tag}). Use another e-mail or check your Database if you think this is an error.",
                embedWaitMessageDescription: "We're checking {customer_tag} account status for more information.",
                embedWaitMessageFooter: 'Hold on tight. This may take a few seconds.',
                embedNoCustomerIdDescription: `The email provided ({email}) doesn't have an account created in Stripe with us. Please check if your customer already bought a subscription through the link: ${process.env.STRIPE_PAYMENT_LINK} to get started. After a successful purchase, you can use execute this command again.`,
                embedNoActiveSubscriptionDescription: "We found the customer account with the specified e-mail. ({email}) But it seems the **customer don't have an active subscription**. Double Check Stripe Admin Panel if you think this is an error.",
                logsAssignedRolesMap: "Roles assigned: {assigned_roles}",
                logsNoAssignedRolesMap: 'No roles assigned',
                logsLinkedAccount: ":asterisk: **ADMIN:** **{admin_tag}** ({admin_id}, <@{admin_id}>) linked **{customer_tag}** ({member_id}, <@{member_id}>) with: \`{customer_email}\`.\n{roles_text}",
                embedAccessGrantedDescription: ":white_check_mark: | Woohoo! **{member_tag}** account has been **linked successfully** with {email}.\nNow the customer Discord privileges are automatically renewed.\n\n{roles_text}",
            },
            status: {
                slashCommandDescription: "Verify your Stripe Account Status.",
                slashCommandUserOption: "Search for a member.",
                embedNoDiscordCustomerDescription: ":x: | There is no **Stripe Account** associated with {usertag} account.",
                authorNameAccess: "{user_tag}' Access",
                embedFooter: "This account is associated with {email}.",
                subscriptionsFieldName: `All Subscriptions from ${process.env.SUBSCRIPTION_NAME}`,
                noSubscriptionsMessage: "There are no subscriptions for this customer.",
                renewalCancelledStatus: "❌ Renewal Cancelled (yet to be expired)",
                renewalActiveStatus: "✅ Renewal Active",
                renewalStatusText: "Status:",
                renewalDateLabel: "Renewal Date:"
            }
        },
        dev: {
            delete: {
                slashCommandDescription: 'Admin command to remove a user from the database.',
                slashCommandUserOption: 'Choose the user you want to remove from the database.',
                userNotInServer: '❌ | {user_tag} ({user_id}) __it\'s not in Discord Server__, please remove the data directly from the DB!',
                userNotInDatabase: '❌ | {user_tag} ({user_id}) __it\'s not in the database__!',
                accountFoundAuthor: 'Account found: {user_tag}',
                accountFoundDescription: '> Member: **{user_tag}** ({user_id}, <@{user_id}>)\n> Email: `{email}`.',
                confirmationFooter: 'Are you sure you want to remove this user from the database?',
                confirmButtonLabel: 'Confirm Drop',
                cancelButtonLabel: 'Cancel',
                successMessage: 'The account of **{user_tag}** ({user_id}, <@{user_id}>) with the e-mail address: `{email}` was **successfully dropped**!',
                logsMessage: ':asterisk: **ADMIN:** **{admin_tag}** ({admin_id}, <@{admin_id}>) deleted **{user_tag}** ({user_id}, <@{user_id}>) Account with the e-mail address: `{email}`.',
                cancelMessage:  'The action regarding the __{email}__ was **cancelled**!',
                timeoutMessage: 'The request for confirmation of deletion of __{email}__ **expired**.',
                errorMessage: 'An error was logged when executing this command.',
            },
            inactivity: {
                slashCommandDescription: 'Remove inactive users from the database.',
                slashCommandDaysOption: 'Number of days of inactivity before removing users.',
                processingMessage: '🔄 | Running inactivity check for users inactive for more than **{days} days**...',
                successMessage: '✅ | Inactivity check completed! Users inactive for more than **{days} days** have been removed from the database.',
                errorMessage: '❌ | An error occurred while running the inactivity check.'
            },
            sync: {
                slashCommandDescription: 'Manually trigger the daily check.',
                successMessage: '🔄 | Stripe check **triggered**!\n\n⚠️ Please don\'t use this command more than __once an hour or two__.'
            }
        },
        stripe: {
            link: {
                slashCommandDescription: "Link your Stripe Account E-mail with your Discord Account.",
                slashCommandEmailOption: "Enter your Stripe Account E-mail.",
                embedEmailAssociatedDescription: "Hey **{username}**, you already have an e-mail associated with Discord.\n\n> Current e-mail associated: **{email}**.\n\nIf you want to change your e-mail address, just enter your new e-mail.",
                embedNoEmailDescription: `> Hey **{username}**, you can buy a subscription plan within this link: ${process.env.STRIPE_PAYMENT_LINK}.\n\nIf you already use Stripe as your payment method, try to execute this command again with an e-mail address to get access to auto renewal permissions.`,
                embedEmailRegexDescription: "Hey **{username}**, e-mail address typed is **not valid**. Please make sure you are typing it correctly and execute this command again.",
                embedExistingEmailCustomerDescription: "The e-mail address provided is **already in use** by another member. Use another e-mail or contact our team if you think this is an error.",
                embedWaitMessageDescription: "We're checking your account status for more information.",
                embedWaitMessageFooter: "Hold on tight. This may take a few seconds.",
                embedNoCustomerIdDescription: `The e-mail provided doesn't have an account created in Stripe with us. Please buy a subscription through the link: ${process.env.STRIPE_PAYMENT_LINK} to get started. After a successful purchase, you can use execute this command again.`,
                embedNoActiveSubscriptionDescription: `We found your account! But it seems **you don't have an active subscription**. Check your dashboard: ${process.env.STRIPE_PORTAL_LINK} or subscribe through the following link: ${process.env.STRIPE_PAYMENT_LINK} to get started.`,
                logsAssignedRolesMap: "Roles assigned: {assigned_roles}",
                logsNoAssignedRolesMap: "No roles assigned",
                logsResyncAccount: ":repeat: **{member_tag}** ({member_id}, <@{member_id}>) used link to resync their account with: `{customer_email}`.\n{roles_text}",
                logsLinkedAccount: ":link: **{member_tag}** ({member_id}, <@{member_id}>) linked their account with: `{customer_email}`.\n{roles_text}",
                embedAccessGrantedDescription: ":white_check_mark: | Woohoo! Your account has been **linked successfully**.\n\n{roles_text}",
                embedAccessGrantedFooter: "Now your Discord privileges are automatically renewed."
            },
            unlink: {
                slashCommandDescription: "Unlink your Stripe Account from your Discord Account and remove all roles.",
                noAccountLinked: "Hey **{username}**, you don't have an account linked with us. There's nothing to unlink.",
                accountFoundAuthor: "Account found: {user_tag}",
                accountFoundDescription: "> Member: **{user_tag}** ({user_id}, <@{user_id}>)\n> Email: `{email}`.",
                confirmationFooter: "Are you sure you want to unlink your account and remove all roles?",
                confirmButtonLabel: "Confirm Unlink",
                cancelButtonLabel: "Cancel",
                successMessage: "Your account with email `{email}` has been successfully unlinked and all roles have been removed.",
                cancelMessage: "The unlinking of your account was cancelled.",
                timeoutMessage: "The request to unlink your account has expired.",
                errorMessage: "An error occurred while processing your request.",
                logsMessage: ":outbox_tray: **{user_tag}** ({user_id}, <@{user_id}>) unlinked their account and removed all roles. Email: `{email}`."
            }
        }
    },
    functions: {
        inactivityCheck: {
            logRemovedUser: ':wastebasket: Removed **{user_id}** ({user_mention}) after {days} days of inactivity. Email: `{email}`.',
            logTotalRemoved: 'Removed **{count}** inactive users.'
        },
        permsCheck: {
            expiredEmbedTitle: "Your automatic contribution has expired!",
            expiredEmbedTitleMultiple: "One of your automatic contribution has expired!",
            expiredEmbedDescription: `Please visit ${process.env.STRIPE_PAYMENT_LINK} to maintain your {role_name} benefits.`,
            logLostPrivileges: ":arrow_lower_right: **{user_tag}** ({user_id}, <@{user_id}>) lost privileges. Email: `{email}`.",
            logCustomerNotInGuild: ":outbox_tray: Customer with email `{email}` (ID: {user_id}, <@{user_id}>) was removed from the database because they left the server.",
            logIllegalAction: "**Illegal Action:** Something went wrong, please check why **{user_tag}** ({user_id}, <@{user_id}>) had an invalid (not recognized by Stripe) customer email: __{email}__, deleted from database.",
            logAccessRestored: ":repeat: **{user_tag}** ({user_id}, <@{user_id}>) had accesses added again. Email: `{email}`.",
            logNewRolesReceived: ":inbox_tray: **{user_tag}** ({user_id}, <@{user_id}>) received new roles: {roles_list}. Email: `{email}`.",
            userNotificationTitle: "Not in use, uncomment in permsCheck.js file - New roles assigned!",
            userNotificationDescription: "Not in use, uncomment in permsCheck.js file - You've been assigned the following roles: {roles_list}.",
            userNotificationFooter: "Not in use, uncomment in permsCheck.js file - Thank you for your subscription!",
            logPlanExpired: ":arrow_lower_right: **{user_tag}** ({user_id}, <@{user_id}>) lost privileges for plan {plan_id}, role <@&{role_id}>. Customer e-mail: `{email}`.",
            logUntrackPlanRemoved: ":arrow_lower_right: **{user_tag}** ({user_id}, <@{user_id}>) lost privileges for untracked plan {plan_id}, role <@&{role_id}>. Customer e-mail: `{email}`."
        },
        safetyCheck: {
            logRemovedUser: ':shield: Removed unauthorized roles from **{user_tag}** ({user_id}, {user_mention}). User not found in database.',
            logSummary: 'Safety Check: Removed roles from **{count}** unauthorized users.',
            logNoUnauthorized: ':white_check_mark: Safety Check completed. No unauthorized role holders found.'
        },
    },
    interactions: {
        stripe_email_modal: {
            embedEmailRegexDescription: "Hey **{username}**, e-mail address typed is **not valid**. Please make sure you are typing it correctly and try again.",
            embedExistingEmailCustomerDescription: "The e-mail address provided is **already in use** by another member. Use another e-mail or contact our team if you think this is an error.",
            embedSameEmailDescription: "The e-mail provided is **already in use** by yourself. Use another e-mail or contact our team if you think this is an error.",
            embedWaitMessageDescription: "We're checking your account status for more information.",
            embedWaitMessageFooter: "Hold on tight. This may take a few seconds.",
            embedNoCustomerIdDescription: `The e-mail provided ({email}) doesn't have an account created in Stripe with us. Please buy a subscription through the link: ${process.env.STRIPE_PAYMENT_LINK} to get started. After a successful purchase, you can try again.`,
            embedNoActiveSubscriptionDescription: `We found your account! But it seems **you don't have an active subscription**. Check your dashboard: ${process.env.STRIPE_PORTAL_LINK} or subscribe through the following link: ${process.env.STRIPE_PAYMENT_LINK} to get started.`,
            logsAssignedRolesMap: "Roles assigned: {assigned_roles}",
            logsNoAssignedRolesMap: "No roles assigned",
            logsResyncAccount: ":repeat: **{member_tag}** ({member_id}, <@{member_id}>) used link to resync their account with: `{customer_email}`. {roles_text}",
            logsLinkedAccount: ":link: **{member_tag}** ({member_id}, <@{member_id}>) linked their account with: `{customer_email}`. {roles_text}",
            embedAccessGrantedDescription: ":white_check_mark: | Woohoo! Your account has been **linked successfully**. {roles_text}",
            embedAccessGrantedFooter: "Now your Discord privileges are automatically renewed."
        },
        stripe_link_button: {
            modalTitle: "Link your Stripe Account",
            emailInputLabel: "Enter your Stripe Account Email",
            emailInputPlaceholder: "your.email@example.com"
        }
    },
    events : {
        interactionCreate: {
            cooldownInteraction: "Please wait, you are on a cooldown for {commandName}. You can use it again {expiredTimestamp}.",
            errorCommand: "There was an error while executing this command!",
            errorInteraction: "There was an error while processing your interaction!"
        }
    }
};
