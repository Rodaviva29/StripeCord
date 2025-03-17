const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

const stripe_1 = require("../../integrations/stripe");

// Load language file based on environment variable
const lang = require(`../../config/lang/${process.env.DEFAULT_LANGUAGE || 'en'}.js`);

module.exports = {
    data: new SlashCommandBuilder()
        .setName(process.env.COMMAND_NAME_STATUS)
        .setDMPermission(false)
        .setDescription(lang.commands.admin.status.slashCommandDescription)

        // Set the permission to see and use the command to Administrator only
        // You can check permissions types in documentation:
        // https://discord.com/developers/docs/topics/permissions#permissions-bitwise-permission-flags
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

        .addUserOption(option =>
            option.setName('member')
            .setDescription(lang.commands.admin.status.slashCommandUserOption)),

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

        const embedNoDiscordCustomerDescription = lang.commands.admin.status.embedNoDiscordCustomerDescription.replace('{usertag}', user.tag);

        if (!discordCustomer) {
            const embed = new EmbedBuilder()
                .setDescription(embedNoDiscordCustomerDescription)
                .setColor('#FD5D5D');
            await interaction.reply({ embeds: [embed], flags: "Ephemeral" });

            return;
        } 

        // Waiting message while we check the user's account status.
        const waitMessageDescription = lang.commands.admin.link.embedWaitMessageDescription.replace('{customer_tag}', user.tag);

        // Waiting message while we check the user's account status.
        const waitMessage = new EmbedBuilder()
        .setColor("#2B2D31")
        .setThumbnail("https://cdn.discordapp.com/emojis/653399136737165323.gif?v=1")
        .setDescription(waitMessageDescription)
        .setFooter({ text: lang.commands.admin.link.embedWaitMessageFooter});

        await interaction.reply({ embeds: [waitMessage], flags: "Ephemeral" });
        
        const customerId = await stripe_1.resolveCustomerIdFromEmail(discordCustomer.email);
        const subscriptions = await Promise.all(
            customerId.map(async (cId) => {
                return await stripe_1.findSubscriptionsFromCustomerId(cId);
            })
        );
        
        // Flatten the array of subscription arrays
        const allSubscriptions = subscriptions.flat();

        const status = new EmbedBuilder()
        .setAuthor({
            name: lang.commands.admin.status.authorNameAccess.replace('{user_tag}', user.tag),
            iconURL: user.displayAvatarURL()
        })
        .setColor('#73a3c1')
        .setFooter({ text: lang.commands.admin.status.embedFooter.replace('{email}', discordCustomer.email || 'N/A') })
        .addFields([
            {
                name: lang.commands.admin.status.subscriptionsFieldName,
                value: allSubscriptions.length > 0 ? allSubscriptions.map((subscription) => {
                    let name = subscription.items.data[0]?.plan.id
                        .replace(/_/g, ' ')
                        .replace(/^\w|\s\w/g, (l) => l.toUpperCase());
                    
                    if (name.includes('Membership')) {
                        name = name.slice(0, name.indexOf('Membership') + 'Membership'.length);
                    }
        
                    let status = "";
        
                    if (subscription.cancel_at) {
                        status = lang.commands.admin.status.renewalCancelledStatus;
                    } else {
                        status = lang.commands.admin.status.renewalActiveStatus;
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
        
                    return `> ${name}\n > ${lang.commands.admin.status.renewalStatusText} ${status}\n > ${lang.commands.admin.status.renewalDateLabel} ${formattedRenewalDate}\n`;
                }).join('\n') : lang.commands.admin.status.noSubscriptionsMessage
            },
        ]);
        await interaction.editReply({ embeds: [status], flags: "Ephemeral" });
    }
};
