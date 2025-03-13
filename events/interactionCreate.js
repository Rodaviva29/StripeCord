const { Events, InteractionType, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
 
// Load all interaction handlers from the interactions directory
const interactionHandlers = new Map();
const interactionsPath = path.join(__dirname, '..', 'interactions');

if (fs.existsSync(interactionsPath)) {
    const interactionFiles = fs.readdirSync(interactionsPath).filter(file => file.endsWith('.js'));
    
    for (const file of interactionFiles) {
        const interaction = require(path.join(interactionsPath, file));
        interactionHandlers.set(interaction.customId, interaction);
    }
}

module.exports = {
    name: Events.InteractionCreate,
 
    async execute(interaction, client) {
        const database = await client.database;

        // Handle slash commands
        if (interaction.isCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);

            const { cooldowns } = interaction.client;

            if (!cooldowns.has(command.data.name)) {
                cooldowns.set(command.data.name, new Collection());
            }
            
            const now = Date.now();
            const timestamps = cooldowns.get(command.data.name);
            const defaultCooldownDuration = 3;
            const cooldownAmount = (command.cooldown ?? defaultCooldownDuration) * 1_000;
            
            if (timestamps.has(interaction.user.id)) {
                const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;
            
                if (now < expirationTime) {
                    const expiredTimestamp = Math.round(expirationTime / 1_000);
                    return interaction.reply({ content: `Please wait, you are on a cooldown for \`${command.data.name}\`. You can use it again <t:${expiredTimestamp}:R>.`, flags: "Ephemeral" });
                }
            }
    
            timestamps.set(interaction.user.id, now);
            setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);
            
            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }
 
            try {
                await command.execute(client, interaction, database);
            } catch (error) {
                console.error(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'There was an error while executing this command!', flags: "Ephemeral" });
                } else {
                    await interaction.reply({ content: 'There was an error while executing this command!', flags: "Ephemeral" });
                }
            }
        }

        // Handle button interactions and modal submissions using the interaction handlers
        if ((interaction.isButton() || interaction.isModalSubmit()) && interactionHandlers.has(interaction.customId)) {
            try {
                await interactionHandlers.get(interaction.customId).execute(interaction, client, database);
            } catch (error) {
                console.error(`Error executing interaction handler for ${interaction.customId}:`, error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'There was an error while processing your interaction!', flags: "Ephemeral" });
                } else {
                    await interaction.reply({ content: 'There was an error while processing your interaction!', flags: "Ephemeral" });
                }
            }
        }
    },
};
