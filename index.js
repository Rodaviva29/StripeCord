const { Partials, GatewayIntentBits, Client, Collection, } = require('discord.js');
const handler = require('./handlers');
const path = require('node:path');

require('dotenv').config({ path: path.join(__dirname, 'config', '.env') });

const client = new Client({
    partials: [
        Partials.Channel,
        Partials.Message,
        Partials.Reaction
    ],

    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.commands = new Collection();
client.cooldowns = new Collection();

client.database = handler.mongoDBHandler();

handler.LoadEvents(client);
handler.LoadCommands(client);

client.login(process.env.DISCORD_CLIENT_TOKEN);
