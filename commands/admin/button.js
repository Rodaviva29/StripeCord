const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, PermissionFlagsBits } = require('discord.js');

const stripe_1 = require("../../integrations/stripe");
const planConfig = require("../../config/plans");

// Load language file based on environment variable
const lang = require(`../../config/lang/${process.env.DEFAULT_LANGUAGE || 'en'}.js`);

module.exports = {
    data: new SlashCommandBuilder()
        .setName(process.env.COMMAND_NAME_BUTTON)
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDescription('Send a message with a button to link your Stripe account.'),

    async execute(client, interaction) {
        // Create the embed message
        const embed = new EmbedBuilder()
            .setTitle(lang.subscription.accountLinking)
            .setDescription(lang.subscription.linkDescription)
            .setColor('#73a3c1')
            .setFooter({ text: lang.subscription.linkButtonFooter });

        // Create the button
        const linkButton = new ButtonBuilder()
            .setCustomId('stripe_link_button')
            .setLabel(lang.buttons.linkStripeAccount)
            .setStyle(ButtonStyle.Primary);

        // Create subscriptions portal button
        const portalButton = new ButtonBuilder()
           .setLabel(lang.buttons.manageSubscriptions)
           .setStyle(ButtonStyle.Link)
           .setURL(`${process.env.STRIPE_PORTAL_LINK}`);

        // Add the buttons to an action row
        const row = new ActionRowBuilder()
            .addComponents(linkButton, portalButton);

        // Send the message with the button
        await interaction.reply({ content: lang.commands.button.success, flags: "Ephemeral" });
        await interaction.channel.send({ embeds: [embed], components: [row] });
    }
};