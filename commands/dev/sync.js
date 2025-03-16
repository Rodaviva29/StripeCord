const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const permsCheck = require('../../functions/permsCheck');

// If you have a lot of members please wait until you can use this command again. 
// Please don't use this command more than once an hour or two.

module.exports = {
    cooldown: 180,
    data: new SlashCommandBuilder()
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setName(process.env.COMMAND_NAME_ADMIN_SYNC)
        .setDescription('Manually trigger the daily check.'),

    async execute(client, interaction, database) {
        console.log("Manually triggering perms (and if active safety) checks...");

        // Run permissions check to add or remove roles from users in DB
        permsCheck(client, database);
        
        // Run safety check to remove unauthorized role holders without DB entry
        safetyCheck(client, database);

        await interaction.reply({ content: "🔄 | Stripe check **triggered**!\n\n⚠️ Please don't use this command more than __once an hour or two__.", flags: "Ephemeral" });
    },
};