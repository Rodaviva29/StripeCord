const { EmbedBuilder } = require('discord.js');
const stripe_1 = require("../integrations/stripe");
const planConfig = require("../config/plans");

const getExpiredEmbed = () => {
    const embed = new EmbedBuilder()
        .setTitle('Your automatic contribution has expired!')
        .setURL(`${process.env.STRIPE_PAYMENT_LINK}`)
        .setColor("#73a3c1")
        .setDescription(`Please visit ${process.env.STRIPE_PAYMENT_LINK} to maintain your benefits.`);
    return embed;
};

const makeMemberExpire = async (customer, member, guild, collection) => {

    await collection.updateOne(
        { discordUserID: customer.discordUserID },
        {
            $set: {
                hadActiveSubscription: false
            }
        }
    );

    // If the member is not in the guild, we can't remove the role
    // Log specifically that they left the group and the role was already removed before they left
    if (!member) {
        guild.channels.cache.get(process.env.LOGS_CHANNEL_ID).send(`:arrow_lower_right: **${member?.user?.tag || 'Unknown#0000'}** (${customer.discordUserID}, <@${customer.discordUserID}>) __left the group__ and lost privileges. Email: \`${customer.email}\`.`); 
        return;
    }

    // Remove the default role if it exists
    if (planConfig.defaultRole) {
        member?.roles.remove(planConfig.defaultRole);
    }
    
    // Remove any plan-specific roles
    const planRoleIds = Object.values(planConfig.planRoles);
    if (planRoleIds.length > 0) {
        for (const roleId of planRoleIds) {
            member?.roles.remove(roleId).catch(() => {});
        }
    } else {
        // Legacy mode - remove the single role defined in .env
        member?.roles.remove(process.env.PAYING_ROLE_ID);
    }
    
    guild.channels.cache.get(process.env.LOGS_CHANNEL_ID).send(`:arrow_lower_right: **${member?.user?.tag || 'Unknown#0000'}** (${member.id}, <@${member.id}>) lost privileges. Email: \`${customer.email}\`.`); 

};

// function to run daily
module.exports = async function DailyCheck(client) {

    const database = await client.database

    const { discordDB } = database;
    const collection = discordDB.collection(process.env.DATABASE_COLLECTION_NAME);

    const customers = await collection.find({}).toArray();
    const guild = client.guilds.cache.get(process.env.GUILD_ID);
    await guild.members.fetch();

    for (const customer of customers) {
        if (!customer.email) continue;

        console.log(`[Account Verification] Checking: ${customer.email}`);
        const customerId = await stripe_1.resolveCustomerIdFromEmail(customer.email);

        if (!customerId) {

            const member = guild.members.cache.get(customer.discordUserID);

            console.log(`[Account Verification] Could not find customer id for ${customer.email}`);

            if (customer.hadActiveSubscription === true) {
                await collection.updateOne({ _id: customer._id }, {
                    $set: {
                        hadActiveSubscription: false
                    }
                    
            });

            // If the member is not in the guild, we can't remove the role
            // Log specifically that they left the group and the role was already removed before they left
            if (!member) {
                guild.channels.cache.get(process.env.LOGS_CHANNEL_ID).send(`**Illegal Action:**: **${member?.user?.tag || 'Unknown#0000'}** (${customer.discordUserID}, <@${customer.discordUserID}>) __left the group__ and has an Email that is not being recognized. Email: \`${customer.email}\`.`); 
                return;
            }

            guild.channels.cache.get(process.env.LOGS_CHANNEL_ID).send(`**Illegal Action:** Something went wrong, please check why **${member?.user?.tag || 'Unknown#0000'}** (${customer.discordUserID}, <@${customer.discordUserID}>) has an invalid (not recognized by Stripe) customer email: __${customer.email}__.`);
            
        }
      }

        const subscriptions = await stripe_1.findSubscriptionsFromCustomerId(customerId);
        const activeSubscriptions = stripe_1.findActiveSubscriptions(subscriptions) || [];

        if (activeSubscriptions.length > 0) {

            const member = guild.members.cache.get(customer.discordUserID);
            
            console.log(`${customer.email} has active subscription(s).`);

            if (!customer.hadActiveSubscription) {
                await collection.updateOne({ _id: customer._id }, {
                    $set: {
                        hadActiveSubscription: true
                    }
            });

                guild.channels.cache.get(process.env.LOGS_CHANNEL_ID).send(`:repeat: **${member?.user?.tag || 'Unknown#0000'}** (${member?.id || customer.discordUserID}, <@${member?.id || customer.discordUserID}>) had accesses added again. Email: \`${customer.email}\`.`); 
            }

            if (member) {
                // Check if we have plan-specific role mappings
                const planRoles = planConfig.planRoles;
                const planRoleEntries = Object.entries(planRoles);
                
                if (planRoleEntries.length > 0) {
                    // Multi-role mode: assign roles based on subscription plan IDs
                    let assignedRoles = [];
                    
                    for (const subscription of activeSubscriptions) {
                        // Get the plan ID from the subscription
                        const planId = subscription.items.data[0]?.plan.id;
                        
                        if (planId && planRoles[planId]) {
                            // If we have a role mapping for this plan, add the role
                            await member.roles.add(planRoles[planId]);
                            assignedRoles.push(planId);
                        }
                    }
                    
                    // If no plan-specific roles were assigned but we have active subscriptions,
                    // fall back to the default role
                    if (assignedRoles.length === 0 && planConfig.defaultRole) {
                        await member.roles.add(planConfig.defaultRole);
                    }
                } else {
                    // Legacy mode: just add the single role defined in .env
                    await member.roles.add(process.env.PAYING_ROLE_ID);
                }
            }

            continue;
        }

        if (!customer.hadActiveSubscription){
            console.log(`[Account Verification] Skipping inactive customer: ${customer.email}`);
            continue;
        }

        if (!subscriptions.some((sub) => sub.status === 'unpaid')) {
            const member = guild.members.cache.get(customer.discordUserID);
            console.log(`[Account Verification] Found subscription unpaid: ${customer.email}`);
            member?.send({ embeds: [getExpiredEmbed(0)] }).catch(() => {});
            makeMemberExpire(customer, member, guild, collection);
            continue;
        }
    }
}
