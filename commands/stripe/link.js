const { SlashCommandBuilder, EmbedBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder, PermissionFlagsBits } = require('discord.js');

const stripe_1 = require("../../integrations/stripe");
const planConfig = require("../../config/plans");

module.exports = {
    data: new SlashCommandBuilder()
        .setName(process.env.COMMAND_NAME_LINK)

        // Set the command to be used only in DMs
        // If false, it will be disabled in DMs
        // If true, it will be enabled in DMs

        .setDMPermission(true)
        .setDescription('Link your Stripe Account E-mail with your Discord Account.')
        .addStringOption(option =>
            option.setName('email')
            .setDescription('Enter your Stripe Account E-mail.')
            .setRequired(false)),

    async execute(client, interaction, database) {

        const email = interaction.options.getString('email');

        // Regex to validate the email
        const emailRegex = /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

        const { discordDB } = database;
        const collection = discordDB.collection(process.env.DATABASE_COLLECTION_NAME);

        const userCustomer = await collection.findOne({ 
            discordUserID: interaction.user.id
        });

        const existingEmailCustomer = await collection.findOne({
            email,
            discordUserID: { $ne: interaction.user.id }
        });

        /**
         * If the user already has an email associated with Discord, we'll let them know.
         * This is triggered when the user uses the command without an email.
         */

        if (userCustomer && !email) {

            const embed = new EmbedBuilder()
                .setDescription(`Hey **${interaction.user.username}**, you already have an e-mail associated with Discord.\n\n> Current e-mail associated: **${userCustomer.email}**.\n\nIf you want to change your e-mail address, just enter your new e-mail.`)
                .setColor('#FDDE5D');
            await interaction.reply({ embeds: [embed], flags: "Ephemeral" });

            return;

        }
        
        /**
         * If the user doesn't have an email associated with Discord and account, we'll let them know.
         * This is triggered when the user uses the command without an email.
         */
        
        if (!email) {

            const embed = new EmbedBuilder()
                .setDescription(`> Hey **${interaction.user.username}**, you can buy a subscription plan within this link: ${process.env.STRIPE_PAYMENT_LINK}.\n\nIf you already use Stripe as your payment method, try to execute this command again with an e-mail address to get access to auto renewal permissions.`)
                .setColor('#73a3c1');
            await interaction.reply({ embeds: [embed], flags: "Ephemeral" });

            return;

        }

        /**
         * If the user types an ~ email that is not valid, we'll let them know.
         * This is triggered when the user uses the command with an email.
         */
        if (!emailRegex.test(email)) {

            const embed = new EmbedBuilder()
                .setDescription(`Hey **${interaction.user.username}**, e-mail address typed is **not valid**. Please make sure you are typing it correctly and execute this command again.`)
                .setColor('#FD5D5D');
            await interaction.reply({ embeds: [embed], flags: "Ephemeral" });

            return;

        } 

        
        /**
         * If the user types an email that is already associated with another Discord account, we'll let them know.
         * This is triggered when the user uses the command with an email.
         */
        if (existingEmailCustomer) {

            const embed = new EmbedBuilder()
                .setDescription(`The e-mail address provided is **already in use** by another member. Use another e-mail or contact our team if you think this is an error.`)
                .setColor('#FD5D5D');
            await interaction.reply({ embeds: [embed], flags: "Ephemeral" });

            return;

        }

        /*
         * If the user uses the same e-mail that it's database and typed
         * This is triggered when the user uses the command with an email valid but it's the same saved in DB.
         * If you want, you can add this code block to deny users to force sync their new roles or renew their past ones. (legacy code)
        
        if (userCustomer && userCustomer.email && email === userCustomer.email) {

            const embed = new EmbedBuilder()
                .setDescription(`The e-mail provided is **already in use** by yourself. Use another e-mail or contact our team if you think this is an error.`)
                .setColor('#FD5D5D');
            await interaction.reply({ embeds: [embed], flags: "Ephemeral" });

            return;

        }*/

        // Waiting message while we check the user's account status.
        const waitMessage = new EmbedBuilder()
            .setColor("#2B2D31")
            .setThumbnail("https://cdn.discordapp.com/emojis/653399136737165323.gif?v=1")
            .setDescription("Were checking your account status for more information.")
            .setFooter({ text: 'Hold on teight. This may take a few seconds.'});

        await interaction.reply({ embeds: [waitMessage], flags: "Ephemeral" });

        
        // customer id from stripe api with email provided.
        const customerIds = await stripe_1.resolveCustomerIdFromEmail(email);

        /**
         * If the user doesn't have an account created in Stripe, we'll let them know.
         * This is triggered when the user uses the command with an email valid and without an stripe account.
         */
        if (!customerIds || customerIds.length === 0) {

            const embed = new EmbedBuilder()
                .setDescription(`The e-mail provided doesn't have an account created in Stripe with us. Please buy a subscription through the link: ${process.env.STRIPE_PAYMENT_LINK} to get started. After a successful purchase, you can use execute this command again.`)
                .setColor('#FDDE5D');
            await interaction.editReply({ embeds: [embed], flags: "Ephemeral" });

            return;

        }

        // Collect all subscriptions from all customer IDs
        const subscriptions = await Promise.all(
            customerIds.map(async (cId) => {
                return await stripe_1.findSubscriptionsFromCustomerId(cId);
            })
        );
        // Flatten the array of subscription arrays
        const allSubscriptions = subscriptions.flat();
        // Filter the active subscriptions from the list of subscriptions
        const activeSubscriptions = stripe_1.findActiveSubscriptions(allSubscriptions);


        /**
         * If the user doesn't have an active subscription, we'll let them know.
         * This is triggered when the user uses the command with an email valid and without an active subscription.
         */
        if (!(activeSubscriptions.length > 0)) {

            const embed = new EmbedBuilder()
                .setDescription(`We found your account! But it seems **you don't have an active subscription**. Check your dashboard: ${process.env.STRIPE_PORTAL_LINK} or subscribe through the following link: ${process.env.STRIPE_PAYMENT_LINK} to get started.`)
                .setColor('#FD5D5D');
            await interaction.editReply({ embeds: [embed], flags: "Ephemeral" });

            return;

        }

        /**
         * MongoDB Structure
         * Set Discord User ID to the user's ID
         * Set Email to the email provided
         * Set Active Subscription to true
         * Track individual subscription plans
         */
        const customer = {
            discordUserID: interaction.user.id,
            email,
            activeSubscribed: true,
            plans: {},
            updatedAt: new Date()
        };
        
        // Initialize plan-specific tracking
        for (const subscription of activeSubscriptions) {
            const planId = subscription.items.data[0]?.plan.id;
            if (planId && planConfig.planRoles[planId]) {
                customer.plans[planId] = true;
            }
        }

        /**
         * If the user already has an entry, we'll update it.
         * Otherwise, we'll create a new entry.
         */
        if (userCustomer) {
            await collection.updateOne({ _id: userCustomer._id }, { $set: customer });
        } else {
            await collection.insertOne(customer);
        }


        // Get the member of the interaction on the guild
        const member = await interaction.guild?.members.fetch(interaction.user.id)?.catch(() => { });

        if (member) {
            // Check if we have plan-specific role mappings
            const planRoles = planConfig.planRoles;
            const planRoleEntries = Object.entries(planRoles);
            
            // Track assigned roles with their IDs for logging
            let assignedRoleIds = [];
            
            if (planRoleEntries.length > 0) {
                // Multi-role mode: assign roles based on subscription plan IDs
                let assignedRoles = [];
                
                for (const subscription of activeSubscriptions) {
                    // Get the plan ID from the subscription
                    const planId = subscription.items.data[0]?.plan.id;
                    
                    if (planId && planRoles[planId]) {
                        // If we have a role mapping for this plan, add the role
                        const roleId = planRoles[planId];
                        await member.roles.add(roleId);
                        assignedRoles.push(planId);
                        assignedRoleIds.push(roleId);
                    }
                }
            } else {
                // Legacy mode: just add the single role defined in .env
                await member.roles.add(process.env.PAYING_ROLE_ID);
                assignedRoleIds.push(process.env.PAYING_ROLE_ID);
            }

            // Log the event in the logs channel
            const logsChannel = member.guild.channels.cache.get(process.env.LOGS_CHANNEL_ID);
            const roleIdsText = assignedRoleIds.length > 0 ? `Roles assigned: ${assignedRoleIds.map(id => `<@&${id}> (${id})`).join(', ')}` : 'No roles assigned';

            if (userCustomer && userCustomer.email && email === userCustomer.email) {
                logsChannel?.send(`:repeat: **${member.user.tag}** (${member.user.id}, <@${member.user.id}>) used link to resync their account with: \`${customer.email}\`.\n${roleIdsText}`);
            } else {
                logsChannel?.send(`:link: **${member.user.tag}** (${member.user.id}, <@${member.user.id}>) linked their account with: \`${customer.email}\`.\n${roleIdsText}`);
            }
            const accessGranted = new EmbedBuilder()
                .setDescription(`:white_check_mark: | Woohoo! Your account has been **linked successfully**.\n\nRoles assigned: ${assignedRoleIds.map(id => `<@&${id}> (${id})`).join(', ')}`)
                .setFooter({ text: 'Now your Discord privileges are automatically renewed.'})
                .setColor('#C4F086');

            // Send the success message to the user who used the command in flags: "Ephemeral" mode
            await interaction.editReply({ embeds: [accessGranted], flags: "Ephemeral" });
        }
    }
};