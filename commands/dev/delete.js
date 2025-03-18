const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, PermissionFlagsBits } = require('discord.js');

const planConfig = require("../../config/plans");

// Load language file based on environment variable
const lang = require(`../../config/lang/${process.env.DEFAULT_LANGUAGE || 'en'}.js`);

module.exports = {
    data: new SlashCommandBuilder()
        .setName(process.env.COMMAND_NAME_ADMIN_DROP || 'delete-admin')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDescription(lang.commands.dev.delete.slashCommandDescription)
        .addUserOption(option =>
            option.setName('member')
                .setDescription(lang.commands.dev.delete.slashCommandUserOption)
                .setRequired(true)
        ),

    async execute(client, interaction, database) {

        const customer_discord = interaction.options.getUser('member')

        const admin = await interaction.guild?.members.fetch(interaction.user.id)?.catch(() => { });
        const member = await interaction.guild?.members.fetch(customer_discord.id)?.catch(() => { });

        if (!member) {
            const userNotInServerMessage = lang.commands.dev.delete.userNotInServer
                .replace('{user_tag}', customer_discord?.tag || 'Unknown Account')
                .replace(/{user_id}/g, customer_discord?.id);
            interaction.reply({ content: userNotInServerMessage, flags: "Ephemeral" });
            return;
        }

        const logsChannel = member.guild.channels.cache.get(process.env.LOGS_CHANNEL_ID);

        const { discordDB } = database;
        const collection = discordDB.collection(process.env.DATABASE_COLLECTION_NAME);
        
        try {

            const userCustomer = await collection.findOne({ 
                discordId: customer_discord.id
            });
    
            if (!userCustomer) {
                const userNotInDatabaseMessage = lang.commands.dev.delete.userNotInDatabase
                    .replace('{user_tag}', customer_discord?.tag || 'Unknown Account')
                    .replace(/{user_id}/g, member.user?.id);
                interaction.reply({ content: userNotInDatabaseMessage, flags: "Ephemeral" });
                return;
            }

            const accountFoundAuthor = lang.commands.dev.delete.accountFoundAuthor
                .replace('{user_tag}', customer_discord?.tag || 'Unknown Account');
                
            const accountFoundDescription = lang.commands.dev.delete.accountFoundDescription
                .replace('{user_tag}', customer_discord?.tag || 'Unknown Account')
                .replace(/{user_id}/g, member.user?.id)
                .replace('{email}', userCustomer.email);
                
            const embed = new EmbedBuilder()
                .setAuthor({ name: accountFoundAuthor, iconURL: 'https://cdn.discordapp.com/emojis/1124730815901868133.webp?size=160&quality=lossless'})
                .setDescription(accountFoundDescription)
                .setColor("D4DEE6")
                .setFooter({ text: lang.commands.dev.delete.confirmationFooter });
                
    
            const confirmationMessage = await interaction.reply({ embeds: [embed],
                flags: "Ephemeral",
                components: [
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('confirmDelete')
                                .setLabel(lang.commands.dev.delete.confirmButtonLabel)
                                .setStyle('Success'),
                            new ButtonBuilder()
                                .setCustomId('cancelDelete')
                                .setLabel(lang.commands.dev.delete.cancelButtonLabel)
                                .setStyle('Danger'),
                        ),
                ],
            });
    
            const filter = (buttonInteraction) => buttonInteraction.customId === 'confirmDelete' || buttonInteraction.customId === 'cancelDelete';

            let buttonClicked = false;

            const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000, max: 1  });
            
            collector.on('collect', async (buttonInteraction) => {
                buttonClicked = true;

                if (buttonInteraction.customId === 'confirmDelete') {

                    if (userCustomer.activeSubscribed) {

                        // Legacy version of the flow
                        // interaction.reply({ content: `❌ | It is not possible to remove the user. There is still an active subscription at **${userCustomer.email}**.`, flags: "Ephemeral" });
                        // return;
                        
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
                    }
                    
                    await collection.deleteOne({ discordId: customer_discord.id });
                    const successMessage = lang.commands.dev.delete.successMessage
                        .replace('{user_tag}', customer_discord?.tag || 'Unknown Account')
                        .replace(/{user_id}/g, member.user?.id)
                        .replace('{email}', userCustomer.email);
                    await buttonInteraction.update({ content: successMessage, components: [], embeds: [] });
                    const logsMessage = lang.commands.dev.delete.logsMessage
                        .replace('{admin_tag}', admin.user?.tag || 'Unknown Account')
                        .replace(/{admin_id}/g, admin.user?.id)
                        .replace('{user_tag}', customer_discord?.tag || 'Unknown Account')
                        .replace(/{user_id}/g, member.user?.id)
                        .replace('{email}', userCustomer.email);
                    await logsChannel?.send(logsMessage);

                } else if (buttonInteraction.customId === 'cancelDelete') {
                    const cancelMessage = lang.commands.dev.delete.cancelMessage
                        .replace('{email}', userCustomer.email);
                    await buttonInteraction.update({ content: cancelMessage, components: [], embeds: [] });
                }
            });
            
            collector.on('end', (collected, reason) => {
                if (!buttonClicked && reason === 'time') {
                    const timeoutMessage = lang.commands.dev.delete.timeoutMessage
                        .replace('{email}', userCustomer.email);
                    interaction.editReply({ content: timeoutMessage, components: [], embeds: [] });
                }
            });

        } catch (error) {
            console.error(error);
            interaction.reply({ content: lang.commands.dev.delete.errorMessage, flags: "Ephemeral" });
        }
    }
};
