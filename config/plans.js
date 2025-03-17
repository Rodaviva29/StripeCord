/**
 * This file defines the mapping between Stripe plan IDs and Discord roles.
 * 
 * If only one plan-role pair is defined in the enviroment file, 
 * the system will work in legacy mode and assign that role to all active subscribers.
 * 
 * If multiple plan-role pairs are defined here, the system will assign roles
 * based on the specific plan IDs of the user's active subscriptions.
 */

module.exports = {
    /**
     * Plan-specific role mappings
     * Format: 'stripe_plan_id': 'discord_role_id'
     * 
     * Examples:
     * 
     * Basic Tier: price_1AbCdEfGhIjKlMnOpQrStUvW: '123456789012345678'
     * Premium Tier: price_2BcDeFgHiJkLmNoPqRsTuVwX: '234567890123456789'
     * Enterprise Tier: price_3CdEfGhIjKlMnOpQrStUvWx: '345678901234567890'
     * 
     * You can find your Stripe plan IDs in your Stripe Dashboard under Products > [Your Product] > Pricing
     * The ID will look like: price_1AbCdEfGhIjKlMnOpQrStUvW
     * 
     * For Discord role IDs, right-click on a role in your Discord server settings and select "Copy ID"
     * (You need to enable Developer Mode in Discord settings > Advanced to see this option)
     */
    planRoles: {
        // Uncomment and modify these examples with your actual plan IDs and role IDs
        // 'price_1AbCdEfGhIjKlMnOpQrStUvW': '123456789012345678', // Basic Tier
        // 'price_2BcDeFgHiJkLmNoPqRsTuVwX': '234567890123456789', // Premium Tier
        // 'price_3CdEfGhIjKlMnOpQrStUvWx': '345678901234567890'  // Enterprise Tier
    }
};