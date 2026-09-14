const { Events, InteractionType, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
 
// Load all interaction handlers from the interactions directory
const interactionHandlers = new Map();
const interactionsPath = path.join(__dirname, '..', 'interactions');

// Load language file based on environment variable
const lang = require(`../config/lang/${process.env.DEFAULT_LANGUAGE || 'en'}.js`);

if (fs.existsSync(interactionsPath)) {
    const interactionFiles = fs.readdirSync(interactionsPath).filter(file => file.endsWith('.js'));
    
    for (const file of interactionFiles) {
        const interaction = require(path.join(interactionsPath, file));
        interactionHandlers.set(interaction.customId, interaction);
    }
}

// Cooldown applied to modal submissions (e.g. the email link modal). Without it a
// user could submit unlimited emails to probe which ones have an active subscription.
const MODAL_COOLDOWN_SECONDS = 10;

/**
 * Per-user cooldown shared by slash commands and modal submissions.
 * Replies with the cooldown message and returns true when the user must wait.
 */
const isOnCooldown = async (interaction, key, seconds) => {
    const { cooldowns } = interaction.client;

    if (!cooldowns.has(key)) {
        cooldowns.set(key, new Collection());
    }

    const now = Date.now();
    const timestamps = cooldowns.get(key);
    const cooldownAmount = seconds * 1_000;

    if (timestamps.has(interaction.user.id)) {
        const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;

        if (now < expirationTime) {
            const expiredTimestamp = Math.round(expirationTime / 1_000);
            await interaction.reply({ content: lang.events.interactionCreate.cooldownInteraction.replace('{commandName}', key).replace('{expiredTimestamp}', `<t:${expiredTimestamp}:R>`), flags: "Ephemeral" });
            return true;
        }
    }

    timestamps.set(interaction.user.id, now);
    setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);
    return false;
};

module.exports = {
    name: Events.InteractionCreate,

    async execute(interaction, client) {
        const database = await client.database;

        // Handle slash commands
        if (interaction.isCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);

            const defaultCooldownDuration = 3;
            if (await isOnCooldown(interaction, command.data.name, command.cooldown ?? defaultCooldownDuration)) {
                return;
            }

            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }
 
            try {
                await command.execute(client, interaction, database);
            } catch (error) {
                console.error(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: lang.events.interactionCreate.errorCommand, flags: "Ephemeral" });
                } else {
                    await interaction.reply({ content: lang.events.interactionCreate.errorCommand, flags: "Ephemeral" });
                }
            }
        }

        // Handle button interactions and modal submissions using the interaction handlers
        if ((interaction.isButton() || interaction.isModalSubmit()) && interactionHandlers.has(interaction.customId)) {
            // Buttons only open the modal; the Stripe lookup happens on submit, so throttle submits.
            if (interaction.isModalSubmit() && await isOnCooldown(interaction, interaction.customId, MODAL_COOLDOWN_SECONDS)) {
                return;
            }

            try {
                await interactionHandlers.get(interaction.customId).execute(interaction, client, database);
            } catch (error) {
                console.error(`Error executing interaction handler for ${interaction.customId}:`, error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: lang.events.interactionCreate.errorInteraction, flags: "Ephemeral" });
                } else {
                    await interaction.reply({ content: lang.events.interactionCreate.errorInteraction, flags: "Ephemeral" });
                }
            }
        }
    },
};
