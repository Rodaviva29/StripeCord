const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const planConfig = require("../../config/plans");

module.exports = {
    cooldown: 7200,
    data: new SlashCommandBuilder()
        .setName(process.env.COMMAND_NAME_UNLINK || 'unlink')
        .setDMPermission(true)
        .setDescription('Unlink your Stripe Account from your Discord Account and remove all roles.'),

    async execute(client, interaction, database) {
        const { discordDB } = database;
        const collection = discordDB.collection(process.env.DATABASE_COLLECTION_NAME);
        
        try {
            // Find the user in the database
            const userCustomer = await collection.findOne({ 
                discordUserID: interaction.user.id
            });
            
            // If the user is not in the database, let them know
            if (!userCustomer) {
                const embed = new EmbedBuilder()
                    .setDescription(`Hey **${interaction.user.username}**, you don't have an account linked with us. There's nothing to unlink.`)
                    .setColor('#FD5D5D');
                await interaction.reply({ embeds: [embed], flags: "Ephemeral" });
                return;
            }

            // Create confirmation embed
            const embed = new EmbedBuilder()
                .setAuthor({ name: `Account found: ${interaction.user.tag}`, iconURL: 'https://cdn.discordapp.com/emojis/1124730815901868133.webp?size=160&quality=lossless'})
                .setDescription(`> Member: **${interaction.user.tag}** (${interaction.user.id}, <@${interaction.user.id}>)\n> Email: \`${userCustomer.email}\`.`)
                .setColor("D4DEE6")
                .setFooter({ text: 'Are you sure you want to unlink your account and remove all roles?' });
            
            // Create confirmation buttons
            const confirmationMessage = await interaction.reply({ 
                embeds: [embed],
                flags: "Ephemeral",
                components: [
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('confirmUnlink')
                                .setLabel('Confirm Unlink')
                                .setStyle(ButtonStyle.Success),
                            new ButtonBuilder()
                                .setCustomId('cancelUnlink')
                                .setLabel('Cancel')
                                .setStyle(ButtonStyle.Danger),
                        ),
                ],
            });

            // Set up button collector
            const filter = (buttonInteraction) => 
                buttonInteraction.customId === 'confirmUnlink' || 
                buttonInteraction.customId === 'cancelUnlink';

            let buttonClicked = false;
            const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000, max: 1 });
            
            collector.on('collect', async (buttonInteraction) => {
                buttonClicked = true;

                if (buttonInteraction.customId === 'confirmUnlink') {
                    // Delete user from database
                    await collection.deleteOne({ discordUserID: interaction.user.id });
                    
                    // Get member object to remove roles
                    const guild = client.guilds.cache.get(process.env.GUILD_ID);
                    const member = await guild?.members.fetch(interaction.user.id).catch(() => null);
                    
                    if (member) {
                        // Remove any plan-specific roles
                        const planRoleIds = Object.values(planConfig.planRoles);
                        if (planRoleIds.length > 0) {
                            for (const roleId of planRoleIds) {
                                await member.roles.remove(roleId).catch(() => {});
                            }
                        } else {
                            // Legacy mode - remove the single role defined in .env
                            await member.roles.remove(process.env.PAYING_ROLE_ID).catch(() => {});
                        }
                        
                        // Log the unlink action
                        const logsChannel = guild.channels.cache.get(process.env.LOGS_CHANNEL_ID);
                        await logsChannel?.send(`:outbox_tray: **${member.user.tag}** (${member.id}, <@${member.id}>) unlinked their account and removed all roles. Email: \`${userCustomer.email}\`.`);
                    }
                    
                    await buttonInteraction.update({ 
                        content: `Your account with email \`${userCustomer.email}\` has been successfully unlinked and all roles have been removed.`, 
                        components: [], 
                        embeds: [] 
                    });
                } else if (buttonInteraction.customId === 'cancelUnlink') {
                    await buttonInteraction.update({ 
                        content: `The unlinking of your account was cancelled.`, 
                        components: [], 
                        embeds: [] 
                    });
                }
            });
            
            collector.on('end', (collected, reason) => {
                if (!buttonClicked && reason === 'time') {
                    interaction.editReply({ 
                        content: `The request to unlink your account has expired.`, 
                        components: [], 
                        embeds: [] 
                    });
                }
            });

        } catch (error) {
            console.error(error);
            interaction.reply({ content: 'An error occurred while processing your request.', flags: "Ephemeral" });
        }
    }
};