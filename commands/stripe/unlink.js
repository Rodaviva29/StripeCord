const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const planConfig = require("../../config/plans");

// Load language file based on environment variable
const lang = require(`../../config/lang/${process.env.DEFAULT_LANGUAGE || 'en'}.js`);

module.exports = {
    cooldown: 7200,
    data: new SlashCommandBuilder()
        .setName(process.env.COMMAND_NAME_UNLINK || 'unlink')
        .setDMPermission(true)
        .setDescription(lang.commands.stripe.unlink.slashCommandDescription),

    async execute(client, interaction, database) {
        const { discordDB } = database;
        const collection = discordDB.collection(process.env.DATABASE_COLLECTION_NAME);
        
        try {
            // Find the user in the database
            const userCustomer = await collection.findOne({ 
                discordId: interaction.user.id
            });
            
            // If the user is not in the database, let them know
            if (!userCustomer) {
                const embed = new EmbedBuilder()
                    .setDescription(lang.commands.stripe.unlink.noAccountLinked
                        .replace('{username}', interaction.user.username))
                    .setColor('#FD5D5D');
                await interaction.reply({ embeds: [embed], flags: "Ephemeral" });
                return;
            }

            // Create confirmation embed
            const accountFoundAuthor = lang.commands.stripe.unlink.accountFoundAuthor
                .replace('{user_tag}', interaction.user.tag);
                
            const accountFoundDescription = lang.commands.stripe.unlink.accountFoundDescription
                .replace('{user_tag}', interaction.user.tag)
                .replace(/{user_id}/g, interaction.user.id)
                .replace('{email}', userCustomer.email);
                
            const embed = new EmbedBuilder()
                .setAuthor({ name: accountFoundAuthor, iconURL: 'https://cdn.discordapp.com/emojis/1124730815901868133.webp?size=160&quality=lossless'})
                .setDescription(accountFoundDescription)
                .setColor("D4DEE6")
                .setFooter({ text: lang.commands.stripe.unlink.confirmationFooter });
            
            // Create confirmation buttons
            const confirmationMessage = await interaction.reply({ 
                embeds: [embed],
                flags: "Ephemeral",
                components: [
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('confirmUnlink')
                                .setLabel(lang.commands.stripe.unlink.confirmButtonLabel)
                                .setStyle(ButtonStyle.Success),
                            new ButtonBuilder()
                                .setCustomId('cancelUnlink')
                                .setLabel(lang.commands.stripe.unlink.cancelButtonLabel)
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
                    await collection.deleteOne({ discordId: interaction.user.id });
                    
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
                        const logsMessage = lang.commands.stripe.unlink.logsMessage
                            .replace('{user_tag}', member.user.tag)
                            .replace(/{user_id}/g, member.id)
                            .replace('{email}', userCustomer.email);
                        await logsChannel?.send(logsMessage);
                    }
                    
                    const successMessage = lang.commands.stripe.unlink.successMessage
                        .replace('{email}', userCustomer.email);
                    await buttonInteraction.update({ 
                        content: successMessage, 
                        components: [], 
                        embeds: [] 
                    });
                } else if (buttonInteraction.customId === 'cancelUnlink') {
                    await buttonInteraction.update({ 
                        content: lang.commands.stripe.unlink.cancelMessage, 
                        components: [], 
                        embeds: [] 
                    });
                }
            });
            
            collector.on('end', (collected, reason) => {
                if (!buttonClicked && reason === 'time') {
                    interaction.editReply({ 
                        content: lang.commands.stripe.unlink.timeoutMessage, 
                        components: [], 
                        embeds: [] 
                    });
                }
            });

        } catch (error) {
            console.error(error);
            interaction.reply({ content: lang.commands.stripe.unlink.errorMessage, flags: "Ephemeral" });
        }
    }
};