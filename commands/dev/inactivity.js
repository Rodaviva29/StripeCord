const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const inactivityCheck = require('../../functions/inactivityCheck');

module.exports = {
    cooldown: 180,
    data: new SlashCommandBuilder()
        .setName(process.env.COMMAND_NAME_ADMIN_INACTIVITY)
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDescription('Remove inactive users from the database.')
        .addIntegerOption(option =>
            option.setName('days')
                .setDescription('Number of days of inactivity before removing users.')
                .setRequired(true)
                .setMinValue(30)
                .setMaxValue(10000)
        ),

    async execute(client, interaction, database) {
        const thresholdDays = interaction.options.getInteger('days');
        
        await interaction.reply({ content: `🔄 | Running inactivity check for users inactive for more than **${thresholdDays} days**...`, flags: "Ephemeral" });
        
        try {
            await inactivityCheck(client, database, thresholdDays);
            await interaction.editReply({ content: `✅ | Inactivity check completed! Users inactive for more than **${thresholdDays} days** have been removed from the database.`, flags: "Ephemeral" });
        } catch (error) {
            console.error('Error during inactivity check:', error);
            await interaction.editReply({ content: '❌ | An error occurred while running the inactivity check.', flags: "Ephemeral" });
        }
    },
};