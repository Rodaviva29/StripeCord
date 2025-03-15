const { Events } = require('discord.js');
const permsCheck = require('../functions/permsCheck');

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(_, client, database) {
        console.log(`Ready! Logged in as ${client.user.tag}.`);
        setInterval(() => {        
            console.log("Account verifications in progress. . .");
            permsCheck(client, database);
            
        }, process.env.CHECK_HOURS * 60 * 60 * 1000); // Time in milliseconds for the daily check to run
        // If you want to change the time, you can use this website to convert it: https://www.timecalculator.net/seconds-to-milliseconds
    },
};