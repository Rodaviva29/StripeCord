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

                embedWaitMessageDescription: "Were checking {customer_tag} account status for more information.",
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
                subscriptionsFieldName: `All Subscriptions from ${process.env.SUBSCRIPTION_NAME}`,
                noSubscriptionsMessage: "There are no subscriptions for this customer.",
                renewalCancelledStatus: "❌ Renewal Cancelled (yet to be expired)",
                renewalActiveStatus: "✅ Renewal Active",
                renewalStatusText: "Status:",
                renewalDateLabel: "Renewal Date:"
            }
        },
        dev: {
            delete: {},
            inactivity: {},
            sync: {}
        },
        stripe: {
            link: {},
            unlink: {}
        }
    },
    functions: {
        inactivityCheck: {},
        permsCheck: {}
    },
    interactions: {
        stripe_email_modal: {},
        stripe_link_button: {}
    }
};