const { SlashCommandBuilder, EmbedBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder, PermissionFlagsBits } = require('discord.js');

const stripe_1 = require("../../integrations/stripe");

module.exports = {
    data: new SlashCommandBuilder()
        .setName(process.env.COMMAND_NAME_ADMIN_LINK)
        .setDMPermission(false)
        .setDescription('Link your Stripe Account E-mail with your Discord Account.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addUserOption(option =>
            option.setName('member')
                .setDescription('Force link a member to a certain E-mail.')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('email')
                .setDescription("Enter customer's Stripe Account E-mail.")
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
            discordUserID: customer_discord.id
        });

        const existingEmailCustomer = await collection.findOne({
            email,
            discordUserID: { $ne: customer_discord.id }
        });
        

        /**
         * If the admin types an ~ email that is not valid, we'll let them know.
         * This is triggered when the admin uses the command with an invalid email.
         */
        if (!emailRegex.test(email)) {

            const embed = new EmbedBuilder()
                .setDescription(`Hey **${interaction.user.username}**, e-mail address typed is **not valid**. Please make sure you are typing it correctly and execute this command again.`)
                .setColor('#FD5D5D');
            await interaction.reply({ embeds: [embed], ephemeral: true });

            return;

        } 

        
        /**
         * If the admin types an email that is already associated with another Discord account, we'll let them know.
         * This is triggered when the admin uses the command with an email already in use.
         */
        if (existingEmailCustomer) {

            const embed = new EmbedBuilder()
                .setDescription(`The e-mail address provided is **already in use** by another member. Use another e-mail or check your Database if you think this is an error.`)
                .setColor('#FD5D5D');
            await interaction.reply({ embeds: [embed], ephemeral: true });

            return;

        }

        /**
         * If the admin uses the same e-mail that it's database and typed
         * This is triggered when the admin uses the command with an email valid but it's the same saved in DB.
         */
        if (userCustomer && userCustomer.email && email === userCustomer.email) {

            const embed = new EmbedBuilder()
                .setDescription(`The e-mail provided is **already in use** by the customer himself (${customer_discord.tag}). Use another e-mail or check your Database if you think this is an error.`)
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

        
        // customer id from stripe api with email provided.
        const customerId = await stripe_1.resolveCustomerIdFromEmail(email);

        /**
         * If the user doesn't have an account created in Stripe, we'll let them know.
         * This is triggered when the user uses the command with an email valid and without an stripe account.
         */
        if (!customerId) {

            const embed = new EmbedBuilder()
                .setDescription(`The e-mail provided (${email}) doesn't have an account created in Stripe with us. Please check if your customer already bought a subscription through the link: ${process.env.STRIPE_PAYMENT_LINK} to get started. After a successful purchase, you can use execute this command again.`)
                .setColor('#FDDE5D');
            await interaction.editReply({ embeds: [embed], ephemeral: true });

            return;

        }

        // Get all the subscriptions from the customer ID
        const subscriptions = await stripe_1.findSubscriptionsFromCustomerId(customerId);
        // Filter the active subscriptions from the list of subscriptions
        const activeSubscriptions = stripe_1.findActiveSubscriptions(subscriptions);


        /**
         * If the admin doesn't have an active subscription, we'll let them know.
         * This is triggered when the admin uses the command with an email valid and without an active subscription.
         */
        if (!(activeSubscriptions.length > 0)) {

            const embed = new EmbedBuilder()
                .setDescription(`We found the customer account with the specified e-mail. (${email}) But it seems the **customer don't have an active subscription**. Double Check Stripe Admin Panel if you think this is an error.`)
                .setColor('#FD5D5D');
            await interaction.editReply({ embeds: [embed], ephemeral: true });

            return;

        }

        /**
         * MongoDB Structure
         * Set Discord User ID to the user's ID
         * Set Email to the email provided
         * Set Active Subscription to true
         */
        const customer = {
            discordUserID: customer_discord.id,
            email,
            hadActiveSubscription: true
        };

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

            // Add the subscribe role to the member (configure this in your .env file)
            await member.roles.add(process.env.PAYING_ROLE_ID);

            // Log the event in the logs channel
            const logsChannel = member.guild.channels.cache.get(process.env.LOGS_CHANNEL_ID);
            logsChannel?.send(`:asterisk: **ADMIN:** **${admin.user?.tag || 'Unknown Account'}** (${admin.user?.id}, <@${admin.user?.id}>) linked **${customer_discord?.tag || 'Unknown Account'}** (${member.user?.id}, <@${member.user?.id}>) with: \`${customer.email}\`.`);

            const acessGranted = new EmbedBuilder()
                .setDescription(`:white_check_mark: | Woohoo! **${member.user?.tag || 'Unknown Account'}** account has been **linked successfully** with ${email}.\nNow the customer Discord privileges are automatically renewed.`)
                .setColor('#C4F086');

            // Send the success message to the user who used the command in ephemeral mode
            await interaction.editReply({ embeds: [acessGranted], ephemeral: true });
        }
    }
};