const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

const stripe_1 = require("../../integrations/stripe");
const planConfig = require("../../config/plans");

module.exports = {
    data: new SlashCommandBuilder()
        .setName(process.env.COMMAND_NAME_BUTTON)
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDescription('Send a message with a button to link your Stripe account.'),

    async execute(client, interaction) {
        // Create the embed message
        const embed = new EmbedBuilder()
            .setTitle(`${process.env.SUBSCRIPTION_NAME} - Account Linking`)
            .setDescription(`Click the button below to link your Stripe account email with your Discord account.\n\nThis will give you access to subscriber-only content and features.`)
            .setColor('#73a3c1')
            .setFooter({ text: 'You can also use the /link command directly with your email.' });

        // Create the button
        const linkButton = new ButtonBuilder()
            .setCustomId('stripe_link_button')
            .setLabel('Link Stripe Account')
            .setStyle(ButtonStyle.Primary);

        // Add the button to an action row
        const row = new ActionRowBuilder()
            .addComponents(linkButton);

        // Send the message with the button
        await interaction.reply({ embeds: [embed], components: [row] });
    }
};