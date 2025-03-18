const { SlashCommandBuilder, EmbedBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder, PermissionFlagsBits } = require('discord.js');

const stripe_1 = require("../../integrations/stripe");
const planConfig = require("../../config/plans");

// Load language file based on environment variable
const lang = require(`../../config/lang/${process.env.DEFAULT_LANGUAGE || 'en'}.js`);

module.exports = {
    data: new SlashCommandBuilder()
        .setName(process.env.COMMAND_NAME_ADMIN_LINK || 'link-admin')
        .setDMPermission(false)
        .setDescription(lang.commands.admin.link.slashCommandDescription)
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addUserOption(option =>
            option.setName('member')
                .setDescription(lang.commands.admin.link.slashCommandUserOption)
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('email')
                .setDescription(lang.commands.admin.link.slashCommandStringOption)
                .setRequired(true)
        ),

    async execute(client, interaction, database) {

        const email = interaction.options.getString('email');
        const customer_discord = interaction.options.getUser('member')

        // Regex to validate the email
        const emailRegex = /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

        const { discordDB } = database;
        const collection = discordDB.collection(process.env.DATABASE_COLLECTION_NAME);

        const userCustomer = await collection.findOne({ 
            discordId: customer_discord.id
        });

        const existingEmailCustomer = await collection.findOne({
            email,
            discordId: { $ne: customer_discord.id }
        });
        

        /**
         * If the admin types an ~ email that is not valid, we'll let them know.
         * This is triggered when the admin uses the command with an invalid email.
         */
        if (!emailRegex.test(email)) {

            const emailRegexDescription = lang.commands.admin.link.embedEmailRegexDescription.replace('{username}', interaction.user.username);
            
            const embed = new EmbedBuilder()
                .setDescription(emailRegexDescription)
                .setColor('#FD5D5D');
            await interaction.reply({ embeds: [embed], flags: "Ephemeral" });

            return;

        } 

        
        /**
         * If the admin types an email that is already associated with another Discord account, we'll let them know.
         * This is triggered when the admin uses the command with an email already in use.
         */
        if (existingEmailCustomer) {

            const embed = new EmbedBuilder()
                .setDescription(lang.commands.admin.link.embedExistingEmailCustomerDescription)
                .setColor('#FD5D5D');
            await interaction.reply({ embeds: [embed], flags: "Ephemeral" });

            return;

        }

        /**
         * If the admin uses the same e-mail that it's database and typed
         * This is triggered when the admin uses the command with an email valid but it's the same saved in DB.
         */
        if (userCustomer && userCustomer.email && email === userCustomer.email) {

            const sameEmailDescription = lang.commands.admin.link.embedSameEmailDescription.replace('{customer_tag}', customer_discord.tag);
            
            const embed = new EmbedBuilder()
                .setDescription(sameEmailDescription)
                .setColor('#FD5D5D');
            await interaction.reply({ embeds: [embed], flags: "Ephemeral" });

            return;

        }


        // Waiting message while we check the user's account status.
        const waitMessageDescription = lang.commands.admin.link.embedWaitMessageDescription.replace('{customer_tag}', customer_discord.tag);
        
        const waitMessage = new EmbedBuilder()
        .setColor("#2B2D31")
        .setThumbnail("https://cdn.discordapp.com/emojis/653399136737165323.gif?v=1")
        .setDescription(waitMessageDescription)
        .setFooter({ text: lang.commands.admin.link.embedWaitMessageFooter});

        await interaction.reply({ embeds: [waitMessage], flags: "Ephemeral" });

        
        // customer ids from stripe api with email provided.
        const customerIds = await stripe_1.resolveCustomerIdFromEmail(email);

        /**
         * If the user doesn't have an account created in Stripe, we'll let them know.
         * This is triggered when the user uses the command with an email valid and without an stripe account.
         */
        if (!customerIds || customerIds.length === 0) {

            const noCustomerIdDescription = lang.commands.admin.link.embedNoCustomerIdDescription
                .replace('{email}', email);

            const embed = new EmbedBuilder()
                .setDescription(noCustomerIdDescription)
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
         * If the admin doesn't have an active subscription, we'll let them know.
         * This is triggered when the admin uses the command with an email valid and without an active subscription.
         */
        if (!(activeSubscriptions.length > 0)) {

            const noActiveSubscriptionDescription = lang.commands.admin.link.embedNoActiveSubscriptionDescription
                .replace('{email}', email);
                
            const embed = new EmbedBuilder()
                .setDescription(noActiveSubscriptionDescription)
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
            discordId: customer_discord.id,
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
        const admin = await interaction.guild?.members.fetch(interaction.user.id)?.catch(() => { });
        const member = await interaction.guild?.members.fetch(customer_discord.id)?.catch(() => { });

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
            
            // Format role IDs for display
            const roleIdsText = assignedRoleIds.length > 0 ? 
                lang.commands.admin.link.logsAssignedRolesMap.replace('{assigned_roles}', assignedRoleIds.map(id => `<@&${id}> (${id})`).join(', ')) : 
                lang.commands.admin.link.logsNoAssignedRolesMap;
            
            // Format log message with all dynamic variables
            const logMessage = lang.commands.admin.link.logsLinkedAccount
                .replace('{admin_tag}', admin.user?.tag || 'Unknown Account')
                .replace(/{admin_id}/g, admin.user?.id)
                .replace('{customer_tag}', customer_discord?.tag || 'Unknown Account')
                .replace(/{member_id}/g, member.user?.id)
                .replace('{customer_email}', customer.email)
                .replace('{roles_text}', roleIdsText);
                
            logsChannel.send(logMessage);

            // Format success message with all dynamic variables
            const accessGrantedDescription = lang.commands.admin.link.embedAccessGrantedDescription
                .replace('{member_tag}', member.user?.tag || 'Unknown Account')
                .replace('{email}', email)
                .replace('{roles_text}', roleIdsText);

            const accessGranted = new EmbedBuilder()
                .setDescription(accessGrantedDescription)
                .setColor('#C4F086');

            // Send the success message to the user who used the command in flags: "Ephemeral" mode
            await interaction.editReply({ embeds: [accessGranted], flags: "Ephemeral" });
        }
    }
};
