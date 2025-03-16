const { Events } = require('discord.js');
const permsCheck = require('../functions/permsCheck');
const safetyCheck = require('../functions/safetyCheck');

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(_, client, database) {
        console.log(`Ready! Logged in as ${client.user.tag}.`);
        setInterval(() => {        
            console.log("[Interval Checks] Account verifications in progress. . .");

            // Run permissions check to add or remove roles from users in DB
            permsCheck(client, database);
            
            // Run safety check to remove unauthorized role holders without DB entry
            safetyCheck(client, database);
            
        }, process.env.CHECK_HOURS * 60 * 60 * 1000); // Time in milliseconds for the daily check to run
        // If you want to change the time, you can use this website to convert it: https://www.timecalculator.net/seconds-to-milliseconds
    },
};