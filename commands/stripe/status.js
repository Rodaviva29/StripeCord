const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

const stripe_1 = require("../../integrations/stripe");

module.exports = {
    data: new SlashCommandBuilder()
        .setName(process.env.COMMAND_NAME_STATUS)
        .setDMPermission(false)
        .setDescription('Verify your Stripe Account Status.')

        // Set the permission to see and use the command to Administrator only
        // You can check permissions types in documentation:
        // https://discord.com/developers/docs/topics/permissions#permissions-bitwise-permission-flags
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

        .addUserOption(option =>
            option.setName('member')
            .setDescription('Search for a member.')),

    async execute(client, interaction, database) {

        const user = interaction.options.getUser('member') || interaction.user;

        const { discordDB } = database;
        const collection = discordDB.collection(process.env.DATABASE_COLLECTION_NAME);

        const discordCustomer = await collection.findOne({ 
            discordUserID : user.id
        });


        /**
         * If the user doesn't have an account created in Stripe, we'll let them know.
         * This is triggered when the admin uses the command to check a member without an account in Stripe.
         */
        if (!discordCustomer) {
            const embed = new EmbedBuilder()
                .setDescription(`:x: | There is no **Stripe Account** associated with ${user.tag} account.`)
                .setColor('#FD5D5D');
            await interaction.reply({ embeds: [embed], ephemeral: true });

            return;
        } 

        // Waiting message while we check the user's account status.
        const waitMessage = new EmbedBuilder()
        .setColor("#2B2D31")
        .setThumbnail("https://cdn.discordapp.com/emojis/653399136737165323.gif?v=1")
        .setDescription(`Were checking ${user.tag} account status for more information.`)
        .setFooter({ text: 'Hold on teight. This may take a few seconds.'});

        await interaction.reply({ embeds: [waitMessage], ephemeral: true });
        
        const customerId = await stripe_1.resolveCustomerIdFromEmail(discordCustomer.email);
        const subscriptions = await stripe_1.findSubscriptionsFromCustomerId(customerId);

        const status = new EmbedBuilder()
        .setAuthor({
            name: `${user.tag}' Access`,
            iconURL: user.displayAvatarURL()
        })
        .setColor('#73a3c1')
        .addFields([
            {
                name: `All Subscriptions from ${process.env.SUBSCRIPTION_NAME}`,
                value: subscriptions.length > 0 ? subscriptions.map((subscription) => {
                    let name = subscription.items.data[0]?.plan.id
                        .replace(/_/g, ' ')
                        .replace(/^\w|\s\w/g, (l) => l.toUpperCase());
                    
                    if (name.includes('Membership')) {
                        name = name.slice(0, name.indexOf('Membership') + 'Membership'.length);
                    }
        
                    let status = "";
        
                    if (subscription.cancel_at) {
                        status = "❌ Renewal Cancelled (yet to be expired)";
                    } else {
                        status = "✅ Renewal Active";
                    }
        
                    // Convert timestamp to human-readable date and time
                    const renewalTimestamp = subscription.current_period_end * 1000;
                    const formattedRenewalDate = renewalTimestamp
                    ? new Date(renewalTimestamp).toLocaleString('en-GB', {
                        day: 'numeric',
                        month: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: 'numeric',
                        hour12: false,
                      })
                    : "";
        
                    return `> ${name}\n > Status: ${status}\n > Renewal Date: ${formattedRenewalDate}\n`;
                }).join('\n') : "There are no subscriptions for this customer."
            },
        ]);
        await interaction.editReply({ embeds: [status], ephemeral: true });
    }
};