const { EmbedBuilder } = require('discord.js');
const stripe_1 = require("../integrations/stripe");

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

    member?.roles.remove(process.env.PAYING_ROLE_ID);
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
                continue;
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
                member.roles.add(process.env.PAYING_ROLE_ID);
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
