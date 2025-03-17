/**
 * Removes inactive users from the database who have been inactive for more than the specified number of days
 * Inactive users are those with activeSubscribed set to false
 * 
 * @param {Object} client - Discord client instance
 * @param {number} thresholdDays - Number of days of inactivity before removing users (optional, defaults to INACTIVITY_THRESHOLD_DAYS env var or 30)
 */

// Load language file based on environment variable
const lang = require(`../config/lang/${process.env.DEFAULT_LANGUAGE || 'en'}.js`);

module.exports = async function InactivityCheck(client, database, thresholdDays = null) {
    // Use provided database or get from client
    const { discordDB } = database;
    const collection = discordDB.collection(process.env.DATABASE_COLLECTION_NAME);
    
    // Get the inactivity threshold in days (from parameter or env var)
    let inactivityThresholdDays = thresholdDays;
    
    // If not provided as parameter, use env var or default
    if (inactivityThresholdDays === null) {
        inactivityThresholdDays = '30';
    }
    
    if (isNaN(inactivityThresholdDays) || inactivityThresholdDays <= 0) {
        console.error('[Inactivity Check] Invalid inactivity threshold configuration. Using default of 30 days.');
        inactivityThresholdDays = 30;
    }
    
    console.log(`[Inactivity Check] Running check for users inactive for more than ${inactivityThresholdDays} days`);
    
    // Calculate the cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - inactivityThresholdDays);
    
    /* Update any users without an updatedAt field (both active and inactive)
    // Only uncomment this if you were running an older version of the bot (V1 and V2 Betas)
    await collection.updateMany(
        { updatedAt: { $exists: false } },
        { $set: { updatedAt: new Date() } }
    );
    */
    
    // Find inactive users whose updatedAt date is older than the cutoff date
    const inactiveUsers = await collection.find({
        activeSubscribed: false,
        updatedAt: { $lt: cutoffDate }
    }).toArray();

    // If no inactive users are found, exit
    if (inactiveUsers.length === 0) {
        console.log('[Inactivity Check] No inactive users found to remove.');
        return;
    }
    
    // Log the inactive users
    const usersInfo = inactiveUsers.map(user => ({
        id: user.discordId,
        mention: `<@${user.discordId}>`,
        email: user.email || 'No email',
        inactiveDays: Math.floor((new Date() - user.updatedAt) / (1000 * 60 * 60 * 24))
    }));

    // Delete inactive users from the database
    const result = await collection.deleteMany({
        _id: { $in: inactiveUsers.map(user => user._id) }
    });

    // Log the result
    console.log(`[Inactivity Check] Removed ${result.deletedCount} inactive users.`);


    const guild = client.guilds.cache.get(process.env.GUILD_ID);
    if (!guild) {
        console.error('[Inactivity Check] Could not find guild');
        return;
    }

    // Send a message to the logs channel
    const logsChannel = guild.channels.cache.get(process.env.LOGS_CHANNEL_ID);
    if (logsChannel) {
        const message = usersInfo.map(user =>
            lang.functions.inactivityCheck.logRemovedUser
                .replace('{user_id}', user.id)
                .replace('{user_mention}', user.mention)
                .replace('{days}', user.inactiveDays)
                .replace('{email}', user.email)
        ).join('\n');
        const totalRemoved = lang.functions.inactivityCheck.logTotalRemoved
            .replace('{count}', result.deletedCount);
        
        logsChannel.send(`${message}\n\n${totalRemoved}`);
    }
    
}