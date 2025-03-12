const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    customId: 'stripe_link_button',
    
    async execute(interaction, client, database) {
        // Create the modal for email input
        const modal = new ModalBuilder()
            .setCustomId('stripe_email_modal')
            .setTitle('Link your Stripe Account');

        // Add the email input field to the modal
        const emailInput = new TextInputBuilder()
            .setCustomId('email_input')
            .setLabel('Enter your Stripe Account Email')
            .setPlaceholder('your.email@example.com')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        // Add the input field to an action row
        const firstActionRow = new ActionRowBuilder().addComponents(emailInput);

        // Add the action row to the modal
        modal.addComponents(firstActionRow);

        // Show the modal to the user
        await interaction.showModal(modal);
    },
};