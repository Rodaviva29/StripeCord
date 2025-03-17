const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, PermissionFlagsBits } = require('discord.js');

const stripe_1 = require("../../integrations/stripe");
const planConfig = require("../../config/plans");

// Load language file based on environment variable
const lang = require(`../../config/lang/${process.env.DEFAULT_LANGUAGE || 'en'}.js`);

module.exports = {
    data: new SlashCommandBuilder()
        .setName(process.env.COMMAND_NAME_BUTTON || 'button-admin')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDescription(lang.commands.admin.button.slashCommandDescription),

    async execute(client, interaction) {
        // Create the embed message
        const embed = new EmbedBuilder()
            .setTitle(lang.commands.admin.button.embedTitle)
            .setDescription(lang.commands.admin.button.embedDescription)
            .setColor('#73a3c1')
            .setFooter({ text: lang.commands.admin.button.embedFooter });

        // Create the button
        const linkButton = new ButtonBuilder()
            .setCustomId('stripe_link_button')
            .setLabel(lang.commands.admin.button.buttonLinkLabel)
            .setStyle(ButtonStyle.Primary);

        // Create subscriptions portal button
        const portalButton = new ButtonBuilder()
           .setLabel(lang.commands.admin.button.buttonPortalLabel)
           .setStyle(ButtonStyle.Link)
           .setURL(`${process.env.STRIPE_PORTAL_LINK}`);

        // Add the buttons to an action row
        const row = new ActionRowBuilder()
            .addComponents(linkButton, portalButton);

        // Send the message with the button
        await interaction.reply({ content: lang.commands.admin.button.slashCommandInteraction, flags: "Ephemeral" });
        await interaction.channel.send({ embeds: [embed], components: [row] });
    }
};