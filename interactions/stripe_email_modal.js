const { EmbedBuilder } = require('discord.js');
const stripe_1 = require("../integrations/stripe");
const planConfig = require("../config/plans");

module.exports = {
    customId: 'stripe_email_modal',
    
    async execute(interaction, client, database) {
        const email = interaction.fields.getTextInputValue('email_input');
        const { discordDB } = database;
        const collection = discordDB.collection(process.env.DATABASE_COLLECTION_NAME);

        // Regex to validate the email
        const emailRegex = /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

        const userCustomer = await collection.findOne({ 
            discordUserID: interaction.user.id
        });

        const existingEmailCustomer = await collection.findOne({
            email,
            discordUserID: { $ne: interaction.user.id }
        });

        // Email validation
        if (!emailRegex.test(email)) {
            const embed = new EmbedBuilder()
                .setDescription(`Hey **${interaction.user.username}**, e-mail address typed is **not valid**. Please make sure you are typing it correctly and try again.`)
                .setColor('#FD5D5D');
            await interaction.reply({ embeds: [embed], flags: "Ephemeral" });
            return;
        }

        // Check if email is already in use by another user
        if (existingEmailCustomer) {
            const embed = new EmbedBuilder()
                .setDescription(`The e-mail address provided is **already in use** by another member. Use another e-mail or contact our team if you think this is an error.`)
                .setColor('#FD5D5D');
            await interaction.reply({ embeds: [embed], flags: "Ephemeral" });
            return;
        }

        // Check if user is trying to use the same email they already have
        if (userCustomer && userCustomer.email && email === userCustomer.email) {
            const embed = new EmbedBuilder()
                .setDescription(`The e-mail provided is **already in use** by yourself. Use another e-mail or contact our team if you think this is an error.`)
                .setColor('#FD5D5D');
            await interaction.reply({ embeds: [embed], flags: "Ephemeral" });
            return;
        }

        // Waiting message while we check the user's account status
        const waitMessage = new EmbedBuilder()
            .setColor("#2B2D31")
            .setThumbnail("https://cdn.discordapp.com/emojis/653399136737165323.gif?v=1")
            .setDescription("We're checking your account status for more information.")
            .setFooter({ text: 'Hold on tight. This may take a few seconds.'});

        await interaction.reply({ embeds: [waitMessage], flags: "Ephemeral" });

        // Get customer ID from Stripe API
        const customerId = await stripe_1.resolveCustomerIdFromEmail(email);

        // If customer doesn't exist in Stripe
        if (!customerId) {
            const embed = new EmbedBuilder()
                .setDescription(`The e-mail provided doesn't have an account created in Stripe with us. Please buy a subscription through the link: ${process.env.STRIPE_PAYMENT_LINK} to get started. After a successful purchase, you can try again.`)
                .setColor('#FDDE5D');
            await interaction.editReply({ embeds: [embed], flags: "Ephemeral" });
            return;
        }

        // Get subscriptions and check if any are active
        const subscriptions = await stripe_1.findSubscriptionsFromCustomerId(customerId);
        const activeSubscriptions = stripe_1.findActiveSubscriptions(subscriptions);

        if (!(activeSubscriptions.length > 0)) {
            const embed = new EmbedBuilder()
                .setDescription(`We found your account! But it seems **you don't have an active subscription**. Check your dashboard: ${process.env.STRIPE_PORTAL_LINK} or subscribe through the following link: ${process.env.STRIPE_PAYMENT_LINK} to get started.`)
                .setColor('#FD5D5D');
            await interaction.editReply({ embeds: [embed], flags: "Ephemeral" });
            return;
        }

        // Create or update customer record
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

        if (userCustomer) {
            await collection.updateOne({ _id: userCustomer._id }, { $set: customer });
        } else {
            await collection.insertOne(customer);
        }

        // Get the member and assign roles
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
                
                // If no plan-specific roles were assigned but we have active subscriptions,
                // fall back to the default role
                if (assignedRoles.length === 0 && planConfig.defaultRole) {
                    await member.roles.add(planConfig.defaultRole);
                    assignedRoleIds.push(planConfig.defaultRole);
                }
            } else {
                // Legacy mode: just add the single role defined in .env
                await member.roles.add(process.env.PAYING_ROLE_ID);
                assignedRoleIds.push(process.env.PAYING_ROLE_ID);
            }

            // Log the event in the logs channel
            const logsChannel = member.guild.channels.cache.get(process.env.LOGS_CHANNEL_ID);
            const roleIdsText = assignedRoleIds.length > 0 ? `Roles assigned: ${assignedRoleIds.map(id => `<@&${id}> (${id})`).join(', ')}` : 'No roles assigned';
            logsChannel?.send(`:link: **${member.user.tag}** (${member.user.id}, <@${member.user.id}>) linked their account with: \`${customer.email}\`.\n${roleIdsText}`);

            const accessGranted = new EmbedBuilder()
                .setDescription(`:white_check_mark: | Woohoo! Your account has been **linked successfully**.\n\nRoles assigned: ${assignedRoleIds.map(id => `<@&${id}> (${id})`).join(', ')}`)
                .setFooter({ text: 'Now your Discord privileges are automatically renewed.'})
                .setColor('#C4F086');

            await interaction.editReply({ embeds: [accessGranted], flags: "Ephemeral" });
        }
    },
};