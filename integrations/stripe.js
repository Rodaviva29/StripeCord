/**
 * Sleep function
 */
const sleep = async (ms) => await new Promise(resolve => setTimeout(resolve, ms));

/**
 * Gets the Stripe customer ID for a given user email
 */
const resolveCustomerIdFromEmail = async (email) => {
    let customerData;

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
        const matchingCustomers = responseData.data.filter((c) => c.email === email);
        customerData = matchingCustomers[0];
    } else {
        await sleep(2000); // 2-second delay

        const response = await fetch(`https://api.stripe.com/v1/customers/search?query=email:'${email}'`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${process.env.STRIPE_API_KEY}`
            }
        });

        const responseData = await response.json();
        customerData = responseData.data[0];
    }

    return customerData?.id;
}
exports.resolveCustomerIdFromEmail = resolveCustomerIdFromEmail;

/**
 * Gets all the Stripe subscriptions from a given customer ID
 */
const findSubscriptionsFromCustomerId = async (customerId) => {
    await sleep(2000); // 2-second delay

    // Build URL based on CHECK_STATUS
    const url = process.env.CHECK_STATUS === "active" 
    ? `https://api.stripe.com/v1/subscriptions?customer=${customerId}&status=active`
    : `https://api.stripe.com/v1/subscriptions?customer=${customerId}`;

    const response = await fetch(url, {
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
    return subscriptions.filter(sub => sub.status === 'active' || sub.status === 'trialing' || (sub.cancel_at && sub.current_period_end > Date.now() / 1000));
}
exports.findActiveSubscriptions = findActiveSubscriptions;