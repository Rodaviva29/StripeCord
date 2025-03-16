const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, PermissionFlagsBits } = require('discord.js');

const planConfig = require("../../config/plans");

module.exports = {
    data: new SlashCommandBuilder()
        .setName(process.env.COMMAND_NAME_ADMIN_DROP)
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDescription('Admin command to remove a user from the database.')
        .addUserOption(option =>
            option.setName('member')
                .setDescription('Choose the user you want to remove from the database.')
                .setRequired(true)
        ),

    async execute(client, interaction, database) {

        const customer_discord = interaction.options.getUser('member')

        const admin = await interaction.guild?.members.fetch(interaction.user.id)?.catch(() => { });
        const member = await interaction.guild?.members.fetch(customer_discord.id)?.catch(() => { });

        if (!member) {
            interaction.reply({ content: `❌ | ${customer_discord?.tag || 'Unknown Account'} (${customer_discord?.id}) __it's not in Discord Server__, please remove the data directly from the DB!`, flags: "Ephemeral" });
            return;
        }

        const logsChannel = member.guild.channels.cache.get(process.env.LOGS_CHANNEL_ID);

        const { discordDB } = database;
        const collection = discordDB.collection(process.env.DATABASE_COLLECTION_NAME);
        
        try {

            const userCustomer = await collection.findOne({ 
                discordUserID: customer_discord.id
            });
    
            if (!userCustomer) {
                interaction.reply({ content: `❌ | ${customer_discord?.tag || 'Unknown Account'} (${member.user?.id}) __it's not in the database__!`, flags: "Ephemeral" });
                return;
            }

            const embed = new EmbedBuilder()
                .setAuthor({ name: `Account found: ${customer_discord?.tag || 'Unknown Account'}`, iconURL: 'https://cdn.discordapp.com/emojis/1124730815901868133.webp?size=160&quality=lossless'})
                .setDescription(`> Member: **${customer_discord?.tag || 'Unknown Account'}** (${member.user?.id}, <@${member.user?.id}>)\n> Email: \`${userCustomer.email}\`.`)
                .setColor("D4DEE6")
                .setFooter({ text: 'Are you sure you want to remove this user from the database?'});
                
    
            const confirmationMessage = await interaction.reply({ embeds: [embed],
                flags: "Ephemeral",
                components: [
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('confirmDelete')
                                .setLabel('Confirm Drop')
                                .setStyle('Success'),
                            new ButtonBuilder()
                                .setCustomId('cancelDelete')
                                .setLabel('Cancel')
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
                    
                    await collection.deleteOne({ discordUserID: customer_discord.id });
                    await buttonInteraction.update({ content: `The account of **${customer_discord?.tag || 'Unknown Account'}** (${member.user?.id}, <@${member.user?.id}>) with the e-mail address: \`${userCustomer.email}\` was **successfully dropped**!`, components: [], embeds: [] });
                    await logsChannel?.send(`:asterisk: **ADMIN:** **${admin.user?.tag || 'Unknown Account'}** (${admin.user?.id}, <@${admin.user?.id}>) deleted **${customer_discord?.tag || 'Unknown Account'}** (${member.user?.id}, <@${member.user?.id}>) Account with the e-mail address: \`${userCustomer.email}\`.`);

                } else if (buttonInteraction.customId === 'cancelDelete') {
                    await buttonInteraction.update({ content: `The action regarding the __${userCustomer.email}__ was **cancelled**!`, components: [], embeds: [] });
                }
            });
            
            collector.on('end', (collected, reason) => {
                if (!buttonClicked && reason === 'time') {
                    interaction.editReply({ content: `The request for confirmation of deletion of __${userCustomer.email}__ **expired**.`, components: [], embeds: [] });
                }
            });

        } catch (error) {
            console.error(error);
            interaction.reply({ content: 'An error was logged when executing this command.', flags: "Ephemeral" });
        }
    }
};
