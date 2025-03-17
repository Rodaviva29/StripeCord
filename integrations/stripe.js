/**
 * Sleep function
 */
const sleep = async (ms) => await new Promise(resolve => setTimeout(resolve, ms));

/**
 * Gets all Stripe customer IDs for a given user email
 * @returns {Promise<string[]>} Array of customer IDs
 */
const resolveCustomerIdFromEmail = async (email) => {
    let matchingCustomers = [];

    if (email.includes('+')) {
        const endPart = email.split('+')[1];
        await sleep(2000); // 2-second delay

        const response = await fetch(`https://api.stripe.com/v1/customers/search?query=email~'${endPart}'`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${process.env.STRIPE_API_KEY}`
            }
        });

        const responseData = await response.json();
        matchingCustomers = responseData.data.filter((c) => c.email === email);
    } else {
        await sleep(2000); // 2-second delay

        const response = await fetch(`https://api.stripe.com/v1/customers/search?query=email:'${email}'`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${process.env.STRIPE_API_KEY}`
            }
        });

        const responseData = await response.json();
        matchingCustomers = responseData.data || [];
    }

    // Return an array of customer IDs
    return matchingCustomers.map(customer => customer.id).filter(Boolean);
}
exports.resolveCustomerIdFromEmail = resolveCustomerIdFromEmail;

/**
 * Gets all the Stripe subscriptions from a given customer ID
 */
const findSubscriptionsFromCustomerId = async (customerId) => {
    await sleep(2000); // 2-second delay
    
    const response = await fetch(`https://api.stripe.com/v1/subscriptions?customer=${customerId}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${process.env.STRIPE_API_KEY}`
        }
    });

    const responseData = await response.json();
    return responseData.data || [];
}
exports.findSubscriptionsFromCustomerId = findSubscriptionsFromCustomerId;

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
