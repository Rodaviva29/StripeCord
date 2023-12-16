const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config();

const { MongoClient } = require('mongodb');

module.exports = {
    LoadCommands: async function (client) {
        const commands = [];
        // Grab all the command files from the commands directory you created earlier
        const foldersPath = path.join(__dirname, 'commands');
        const commandFolders = fs.readdirSync(foldersPath);

        for (const folder of commandFolders) {
            // Grab all the command files from the commands directory you created earlier
            const commandsPath = path.join(foldersPath, folder);
            const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
            // Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
            for (const file of commandFiles) {
                const filePath = path.join(commandsPath, file);
                const command = require(filePath);
                if ('data' in command && 'execute' in command) {
                    commands.push(command.data.toJSON());
                    client.commands.set(command.data.name, command);
                } else {
                    console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
                }
            }
        }

        // Construct and prepare an instance of the REST module
        const rest = new REST().setToken(process.env.DISCORD_CLIENT_TOKEN);

        // and deploy your commands!
        (async () => {
            try {
                console.log(`Started refreshing ${commands.length} application (/) commands.`);

                // The put method is used to fully refresh all commands in the guild with the current set
                const data = await rest.put(
                    Routes.applicationCommands(process.env.CLIENT_ID),
                    { body: commands },
                );

                console.log(`Successfully reloaded ${data.length} application (/) commands.`);
            } catch (error) {
                // And of course, make sure you catch and log any errors!
                console.error(error);
            }
        })();
    },

    LoadEvents: async function (client) {
        const eventsPath = path.join(__dirname, 'events');
        const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

        for (const file of eventFiles) {
            const filePath = path.join(eventsPath, file);
            const event = require(filePath);
            if (event.once) {
                client.once(event.name, (...args) => event.execute(...args, client));
            } else {
                client.on(event.name, (...args) => event.execute(...args, client));
            }
        }
        console.log(`Loading ${eventFiles.length} ${eventFiles.length === 1 ? "event" : "events"}.`);
    },


    mongoDBHandler: async () => {        
        try {
            const mongoClient = new MongoClient(process.env.DATABASE_URL);
    
            await mongoClient.connect();
            console.log("Connection with MongoDB established.");

            const discordDB = mongoClient.db(process.env.DATABASE_NAME);

            return { discordDB };
            
        } catch (error) {
            console.error("Connection with MongoDB failed:", error);
        }
    }

};