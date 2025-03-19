// Stripe SDK initialization
const stripe = require('stripe')(process.env.STRIPE_API_KEY);

// Sleep function
const sleep = async (ms) => await new Promise(resolve => setTimeout(resolve, ms));

/**
 * Gets all subscriptions for a given email directly
 * @returns {Promise<Array>} Array of subscriptions
 */
const getSubscriptionsForEmail = async (email) => {

    await sleep(200); // 0.2-second delay

    let matchingCustomers;

    if (email.includes('+')) {
        const endPart = email.split('+')[1];
        
        const customers = await stripe.customers.search({
            query: `email~'${endPart}'`,
            expand: ["data.subscriptions"],
        });
        
        // Filter customers to match the exact email
        matchingCustomers = customers.data.filter((c) => c.email === email);
    } else {
        const customers = await stripe.customers.search({
            query: `email:'${email}'`,
            expand: ["data.subscriptions"],
        });
        
        matchingCustomers = customers.data || [];
    }

    return matchingCustomers
        .map((customer) => customer.subscriptions.data)
        .flat()
        .filter(Boolean);
};
exports.getSubscriptionsForEmail = getSubscriptionsForEmail;

/**
 * Filter the active subscriptions from a list of subscriptions
 */
const findActiveSubscriptions = (subscriptions) => {
    // Build Filter based on CHECK_STATUS
    return subscriptions.filter(sub => 
        process.env.CHECK_STATUS === "active"
            ? sub.status === 'active' || sub.status === 'trialing' || (sub.cancel_at && sub.current_period_end > Date.now() / 1000)
            : sub.status === 'past_due' || sub.status === 'active' || sub.status === 'trialing' || (sub.cancel_at && sub.current_period_end > Date.now() / 1000)
    );
}
exports.findActiveSubscriptions = findActiveSubscriptions;
