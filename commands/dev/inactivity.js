const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const inactivityCheck = require('../../functions/inactivityCheck');

// Load language file based on environment variable
const lang = require(`../../config/lang/${process.env.DEFAULT_LANGUAGE || 'en'}.js`);

module.exports = {
    cooldown: 180,
    data: new SlashCommandBuilder()
        .setName(process.env.COMMAND_NAME_ADMIN_INACTIVITY || 'inactivity-admin')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDescription(lang.commands.dev.inactivity.slashCommandDescription)
        .addIntegerOption(option =>
            option.setName('days')
                .setDescription(lang.commands.dev.inactivity.slashCommandDaysOption)
                .setRequired(true)
                .setMinValue(30)
                .setMaxValue(10000)
        ),

    async execute(client, interaction, database) {
        const thresholdDays = interaction.options.getInteger('days');
        
        const processingMessage = lang.commands.dev.inactivity.processingMessage.replace('{days}', thresholdDays);
        await interaction.reply({ content: processingMessage, flags: "Ephemeral" });
        
        try {
            await inactivityCheck(client, database, thresholdDays);
            const successMessage = lang.commands.dev.inactivity.successMessage.replace('{days}', thresholdDays);
            await interaction.editReply({ content: successMessage, flags: "Ephemeral" });
        } catch (error) {
            console.error('Error during inactivity check:', error);
            await interaction.editReply({ content: lang.commands.dev.inactivity.errorMessage, flags: "Ephemeral" });
        }
    },
};