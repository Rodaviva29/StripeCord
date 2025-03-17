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
        const member = guild.members.cache.get(customer.discordUserID);

        // If member is not in the guild, delete them from the database
        if (!member) {
            console.log(`[Account Verification] Customer not in the guild: ${customer.email}. Deleting from database.`);
            
            // Delete the customer from the database
            await collection.deleteOne({ _id: customer._id });
            
            // Log the deletion to the logs channel
            guild.channels.cache.get(process.env.LOGS_CHANNEL_ID).send(`:outbox_tray: Customer with email \`${customer.email}\` (ID: ${customer.discordUserID}, <@${customer.discordUserID}>) was removed from the database because they left the server.`);                
            console.log(`[Account Verification] Successfully deleted customer: ${customer.email} from database.`);

            continue;
        }

        if (!customerId) {

            console.log(`[Account Verification] Could not find customer id for ${customer.email}`);
            guild.channels.cache.get(process.env.LOGS_CHANNEL_ID).send(`**Illegal Action:** Something went wrong, please check why **${member?.user?.tag || 'Unknown#0000'}** (${customer.discordUserID}, <@${customer.discordUserID}>) has an invalid (not recognized by Stripe) customer email: __${customer.email}__, deleted from the database.`);

            // Delete the customer from the database
            await collection.deleteOne({ _id: customer._id });

            if (customer.hadActiveSubscription === true) {
                member?.send({ embeds: [getExpiredEmbed()] }).catch(() => {});
            }

            member?.roles.remove(process.env.PAYING_ROLE_ID);
            continue;
   
        }
      
        const subscriptions = await stripe_1.findSubscriptionsFromCustomerId(customerId);
        const activeSubscriptions = stripe_1.findActiveSubscriptions(subscriptions) || [];

        if (activeSubscriptions.length > 0) {
            
            console.log(`${customer.email} has active subscription(s).`);

            if (!customer.hadActiveSubscription) {
                await collection.updateOne({ _id: customer._id }, {
                    $set: {
                        hadActiveSubscription: true
                    }
                });

                guild.channels.cache.get(process.env.LOGS_CHANNEL_ID).send(`:repeat: **${member?.user?.tag || 'Unknown#0000'}** (${member?.id || customer.discordUserID}, <@${member?.id || customer.discordUserID}>) had accesses added again. Email: \`${customer.email}\`.`); 
            }

            member?.roles.add(process.env.PAYING_ROLE_ID);
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
