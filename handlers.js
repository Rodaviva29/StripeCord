const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

const { MongoClient } = require('mongodb');

module.exports = {
    LoadCommands: async function (client) {
        // Commands are split by scope:
        //   - "stripe" folder (/link, /unlink) is registered GLOBALLY so it also works in DMs.
        //   - "admin" and "dev" folders are registered ONLY on GUILD_ID. Global admin commands
        //     would be usable by anyone who adds the bot to their own server (where they are
        //     Administrator) against this bot's database.
        const GUILD_ONLY_FOLDERS = new Set(['admin', 'dev']);
        const globalCommands = [];
        const guildCommands = [];

        // Grab all the command files from the commands directory you created earlier
        const foldersPath = path.join(__dirname, 'commands');
        const commandFolders = fs.readdirSync(foldersPath);

        for (const folder of commandFolders) {
            // Grab all the command files from the commands directory you created earlier
            const commandsPath = path.join(foldersPath, folder);
            const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
            const target = GUILD_ONLY_FOLDERS.has(folder) ? guildCommands : globalCommands;
            // Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
            for (const file of commandFiles) {
                const filePath = path.join(commandsPath, file);
                const command = require(filePath);
                if ('data' in command && 'execute' in command) {
                    target.push(command.data.toJSON());
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
                console.log(`Started refreshing ${globalCommands.length} global and ${guildCommands.length} guild application (/) commands.`);

                // The put method is used to fully refresh all commands with the current set.
                // Any admin command previously registered globally is removed by this refresh.
                const globalData = await rest.put(
                    Routes.applicationCommands(process.env.CLIENT_ID),
                    { body: globalCommands },
                );

                const guildData = await rest.put(
                    Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
                    { body: guildCommands },
                );

                console.log(`Successfully reloaded ${globalData.length} global and ${guildData.length} guild application (/) commands.`);
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
        console.log(`Successfully loaded ${eventFiles.length} ${eventFiles.length === 1 ? "event" : "events"}.`);
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