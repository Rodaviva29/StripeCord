/**
 * English language file for StripeCord
 */

module.exports = {
    // Common messages
    subscription: {
        name: "Stripe-Cord Subscription",
        accountLinking: `${process.env.SUBSCRIPTION_NAME} - Account Linking`,
        linkDescription: "Click the button below to link your Stripe account email with your Discord account.\n\nThis will give you access to subscriber-only content and features.",
        linkButtonFooter: "You can also use the /link command directly with your email."
    },
    
    // Buttons
    buttons: {
        linkStripeAccount: "Link Stripe Account",
        manageSubscriptions: "Manage Subscriptions"
    },
    
    // Command responses
    commands: {
        button: {
            success: "Wohoo! Setup button message sent."
        }
    },
    
    // Status messages
    status: {
        checking: "We're checking your account status for more information.",
        holdOn: "Hold on tight. This may take a few seconds."
    }
};