const { EmbedBuilder } = require('discord.js');
const stripe_1 = require("../integrations/stripe");
const planConfig = require("../config/plans");

// Function to remove roles from a member based on plan configuration
const removeRolesFromMember = (member) => {   
    // Remove any plan-specific roles
    const planRoleIds = Object.values(planConfig.planRoles);
    if (planRoleIds.length > 0) {
        for (const roleId of planRoleIds) {
            member?.roles.remove(roleId).catch(() => {});
        }
    } else {
        // Legacy mode - remove the single role defined in .env
        member?.roles.remove(process.env.PAYING_ROLE_ID).catch(() => {});
    }
};

const getExpiredEmbed = (hasSubscriptions = false, roleName = null) => {
    const embed = new EmbedBuilder()
        .setTitle(hasSubscriptions ? 'One of your automatic contribution has expired!' : 'Your automatic contribution has expired!')
        .setURL(`${process.env.STRIPE_PAYMENT_LINK}`)
        .setColor("#73a3c1")
        .setDescription(`Please visit ${process.env.STRIPE_PAYMENT_LINK} to maintain your ${roleName ? `${roleName}` : ''} benefits.`);
    return embed;
};

const makeMemberExpire = async (customer, member, guild, collection) => {

    // Create update object with activeSubscribed set to false
    const updateObj = {
        activeSubscribed: false,
        updatedAt: new Date()
    };
    
    // Set all plan-specific flags to false
    const planRoles = planConfig.planRoles;
    for (const planId in planRoles) {
        updateObj[`plans.${planId}`] = false;
    }
    
    await collection.updateOne(
        { discordId: customer.discordId },
        {
            $set: updateObj
        }
    );
    
    // Use the reusable function to remove roles
    removeRolesFromMember(member);
    
    guild.channels.cache.get(process.env.LOGS_CHANNEL_ID).send(`:arrow_lower_right: **${member?.user?.tag || 'Unknown#0000'}** (${member.id}, <@${member.id}>) lost privileges. Email: \`${customer.email}\`.`); 

};

// Hourly, Daily Check to garantee that all users have the correct roles
module.exports = async function permsCheck(client) {

    const database = await client.database

    const { discordDB } = database;
    const collection = discordDB.collection(process.env.DATABASE_COLLECTION_NAME);

    const customers = await collection.find({}).toArray();
    const guild = client.guilds.cache.get(process.env.GUILD_ID);
    await guild.members.fetch();

    for (const customer of customers) {
        if (!customer.email) continue;

        console.log(`[Account Verification] Checking: ${customer.email}`);
        const member = guild.members.cache.get(customer.discordId);

        // If member is not in the guild, delete them from the database
        if (!member) {
            console.log(`[Account Verification] Customer not in the guild: ${customer.email}. Deleting from database.`);
            
            // Delete the customer from the database
            await collection.deleteOne({ _id: customer._id });
            
            // Log the deletion to the logs channel
            guild.channels.cache.get(process.env.LOGS_CHANNEL_ID).send(`:outbox_tray: Customer with email \`${customer.email}\` (ID: ${customer.discordId}, <@${customer.discordId}>) was removed from the database because they left the server.`);                
            console.log(`[Account Verification] Successfully deleted customer: ${customer.email} from database.`);

            continue;
        }

        const customerIds = await stripe_1.resolveCustomerIdFromEmail(customer.email);

        if (!customerIds || customerIds.length === 0) {

            console.log(`[Account Verification] Could not find any customer ids for ${customer.email}`);

            if (customer.activeSubscribed === true) {
                guild.channels.cache.get(process.env.LOGS_CHANNEL_ID).send(`**Illegal Action:** Something went wrong, please check why **${member?.user?.tag || 'Unknown#0000'}** (${customer.discordId}, <@${customer.discordId}>) has an invalid (not recognized by Stripe) customer email: __${customer.email}__.`);
            }

            if (customer.activeSubscribed === false) {
                // Use the reusable function to remove roles
                removeRolesFromMember(member);
                continue;
            }
        }

        /*
        // Slower version:
        let allSubscriptions = [];
        for (const customerId of customerIds) {
            const customerSubscriptions = await stripe_1.findSubscriptionsFromCustomerId(customerId);
            allSubscriptions = [...allSubscriptions, ...customerSubscriptions];
        }
        */

        // Collect all subscriptions from all customer IDs
        const subscriptions = await Promise.all(
            customerIds.map(async (cId) => {
                return await stripe_1.findSubscriptionsFromCustomerId(cId);
            })
        );
        // Flatten the array of subscription arrays
        const allSubscriptions = subscriptions.flat();
        // Filter the active subscriptions from the list of subscriptions
        const activeSubscriptions = stripe_1.findActiveSubscriptions(allSubscriptions) || [];

        if (activeSubscriptions.length > 0) {
            
            console.log(`[Account Verification] ${customer.email} has active subscription(s).`);

            if (!customer.activeSubscribed) {
                // Create update object with activeSubscribed set to true
                const updateObj = {
                    activeSubscribed: true,
                    updatedAt: new Date()
                };
                
                // Initialize plans object if it doesn't exist
                if (!customer.plans) {
                    updateObj.plans = {};
                }
                
                await collection.updateOne({ _id: customer._id }, {
                    $set: updateObj
                });

                guild.channels.cache.get(process.env.LOGS_CHANNEL_ID).send(`:repeat: **${member?.user?.tag || 'Unknown#0000'}** (${member?.id || customer.discordId}, <@${member?.id || customer.discordId}>) had accesses added again. Email: \`${customer.email}\`.`); 
            }

            // Check if we have plan-specific role mappings
            const planRoles = planConfig.planRoles;
            const planRoleEntries = Object.entries(planRoles);
            
            if (planRoleEntries.length > 0) {
                // Multi-role mode: assign roles based on subscription plan IDs
                let assignedRoles = [];
                let newlyAddedRoles = [];
                
                for (const subscription of activeSubscriptions) {
                    // Get the plan ID from the subscription
                    const planId = subscription.items.data[0]?.plan.id;
                    
                    if (planId && planRoles[planId]) {
                        const roleId = planRoles[planId];
                        // Check if the member already has this role
                        const hasRole = member.roles.cache.has(roleId);
                        
                        // If we have a role mapping for this plan, add the role
                        await member.roles.add(roleId);
                        assignedRoles.push(planId);
                        
                        // If the role is newly added, track it for notification
                        if (!hasRole) {
                            const role = guild.roles.cache.get(roleId);
                            const roleName = role ? role.name : null;
                            newlyAddedRoles.push({ id: roleId, name: roleName, planId });
                        }
                        
                        // Update the database to track this specific plan
                        const planUpdate = {};
                        planUpdate[`plans.${planId}`] = true;
                        planUpdate['updatedAt'] = new Date();
                        await collection.updateOne(
                            { _id: customer._id },
                            { $set: planUpdate }
                        );
                    }
                }
                
                // If any roles were newly added, send a notification
                if (newlyAddedRoles.length > 0) {
                    // Format the roles for display
                    const rolesList = newlyAddedRoles.map(role => 
                        `@${role.name || role.id}`
                    ).join(', ');
                    
                    // Log to the logs channel
                    guild.channels.cache.get(process.env.LOGS_CHANNEL_ID).send(
                        `:inbox_tray: **${member.user.tag}** (${member.id}, <@${member.id}>) received new roles: ${rolesList}. Email: \`${customer.email}\`.`
                    );
                    
                    // Optionally notify the user directly
                    /* try {
                        const userNotification = new EmbedBuilder()
                            .setTitle('New roles assigned!')
                            .setDescription(`You've been assigned the following roles: ${rolesList}.`)
                            .setColor('#73a3c1')
                            .setFooter({ text: 'Thank you for your subscription!' });
                            
                        await member.send({ embeds: [userNotification] });
                    } catch (error) {
                        console.log(`Could not send DM to ${member.user.tag}`);
                    }
                    */
                    
                }
            } else {
                // Legacy mode: just add the single role defined in .env
                await member.roles.add(process.env.PAYING_ROLE_ID);
            }
        }

        const updatedCustomer = await collection.findOne({ _id: customer._id });
        if (!updatedCustomer.activeSubscribed){
            console.log(`[Account Verification] Skipping inactive customer: ${customer.email}.`);

            // Use the reusable function to remove roles
            removeRolesFromMember(member);
    
            continue;
        }

        // Check for expired or canceled subscriptions
        // If there are no active subscriptions but the user had them before, handle expiration
        // Also handle the case where all/every subscriptions are 'unpaid'
        if ((activeSubscriptions.length === 0 || allSubscriptions.every(sub => sub.status === 'unpaid')) && customer.activeSubscribed) {
            console.log(`[Account Verification] No active subscriptions found for: ${customer.email}.`);
            member?.send({ embeds: [getExpiredEmbed()] }).catch(() => {});
            makeMemberExpire(customer, member, guild, collection);
            continue;
        }
        
        // Handle partial subscription expirations (some plans active, some expired or unpaid)
        if (activeSubscriptions.length > 0 && customer.plans) {

            const planRoles = planConfig.planRoles;
            
            // First, check which plans in customer.plans are no longer active
            for (const planId in customer.plans) {
                if (customer.plans[planId] === true) {
                    // Check if this plan is still in the active subscriptions
                    // Also check if the subscription is unpaid
                    const stillActive = activeSubscriptions.some(sub => {
                        const subPlanId = sub.items.data[0]?.plan.id;
                        return subPlanId === planId;
                    });
                    
                    // Check if this plan exists in subscriptions but is unpaid
                    const isUnpaid = allSubscriptions.some(sub => {
                        const subPlanId = sub.items.data[0]?.plan.id;
                        return subPlanId === planId && sub.status === 'unpaid';
                    });
                    
                    if ((!stillActive || isUnpaid) && planRoles[planId]) {
                        // This plan is no longer active, remove its role and update DB
                        console.log(`[Account Verification] Plan ${planId} expired for: ${customer.email}.`);
                        member.roles.remove(planRoles[planId]).catch(() => {});
                        
                        // Update the database to mark this plan as inactive
                        const planUpdate = {};
                        planUpdate[`plans.${planId}`] = false;
                        planUpdate['updatedAt'] = new Date();
                        await collection.updateOne(
                            { _id: customer._id },
                            { $set: planUpdate }
                        );
                        
                        // Get the role name from the guild's roles collection
                        const role = guild.roles.cache.get(planRoles[planId]);
                        const roleName = role ? role.name : null;
                        
                        // Notify the user about the expired subscription
                        member.send({ embeds: [getExpiredEmbed(true, roleName)] }).catch(() => {});
                        
                        // Log the expiration
                        guild.channels.cache.get(process.env.LOGS_CHANNEL_ID).send(`:arrow_lower_right: **${member.user.tag}** (${member.id}, <@${member.id}>) lost privileges for plan ${planId}, role <@&${planRoles[planId]}>. Customer e-mail: \`${customer.email}\`.`);
                    }
                }
            }
            
            // Now, check if there are any roles in planRoles that the user has but aren't in customer.plans
            // This handles the case where a plan ID exists in configuration but not in the user's plans object
            
            // First, collect all role IDs that should be active based on active subscriptions
            const activeRoleIds = new Set();
            for (const subscription of activeSubscriptions) {
                const subPlanId = subscription.items.data[0]?.plan.id;
                if (subPlanId && planRoles[subPlanId]) {
                    activeRoleIds.add(planRoles[subPlanId]);
                }
            }
            
            for (const planId in planRoles) {
                // Skip if this plan is already tracked in customer.plans
                if (customer.plans[planId] !== undefined) continue;
                
                // Check if this plan is in the active subscriptions
                const isActive = activeSubscriptions.some(sub => {
                    const subPlanId = sub.items.data[0]?.plan.id;
                    return subPlanId === planId;
                });
                
                if (!isActive) {
                    // User has the role but not the subscription
                    const roleId = planRoles[planId];
                    const hasRole = member.roles.cache.has(roleId);
                    
                    // Only remove the role if it's not granted by any other active subscription
                    if (hasRole && !activeRoleIds.has(roleId)) {
                        console.log(`[Account Verification] Removing role for plan ${planId} that user has but isn't tracked: ${customer.email}.`);
                        member.roles.remove(roleId).catch(() => {});
                        
                        // Update the database to explicitly mark this plan as inactive
                        const planUpdate = {};
                        planUpdate[`plans.${planId}`] = false;
                        planUpdate['updatedAt'] = new Date();
                        await collection.updateOne(
                            { _id: customer._id },
                            { $set: planUpdate }
                        );
                        
                        // Log the role removal
                        guild.channels.cache.get(process.env.LOGS_CHANNEL_ID).send(`:arrow_lower_right: **${member.user.tag}** (${member.id}, <@${member.id}>) lost privileges for untracked plan ${planId}, role <@&${roleId}>. Customer e-mail: \`${customer.email}\`.`);
                    }
                }
            }
        }
    }
}
