const { Events, InteractionType } = require('discord.js');
 
module.exports = {
    name: Events.InteractionCreate,
 
    async execute(interaction, client) {
        //if (!interaction.guild) return interaction.reply(`You cannot user commands here!`);
 
        if (interaction.isCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            const database = await interaction.client.database
            
            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }
 
            try {
                await command.execute(client, interaction, database);
            } catch (error) {
                console.error(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
                } else {
                    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
                }
            }
        }
    },
};