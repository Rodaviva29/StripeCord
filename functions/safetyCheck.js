/**
 * Safety check function to remove roles from users who have roles but aren't registered in the database
 * This helps prevent unauthorized access by ensuring only users in the database have access roles
 * 
 * @param {Object} client - Discord client instance
 * @param {Object} database - Database connection object
 */
const planConfig = require("../config/plans");

// Load language file based on environment variable
const lang = require(`../config/lang/${process.env.DEFAULT_LANGUAGE || 'en'}.js`);

module.exports = async function safetyCheck(client) {
    // Skip safety check if disabled in environment variables
    if (process.env.SAFETY_CHECK_ENABLED !== 'true') {
        console.log('[Safety Check] Safety check is disabled. Skipping...');
        return;
    }

    console.log('[Safety Check] Starting safety check for unauthorized role holders...');
    
    const database = await client.database;
    const { discordDB } = database;
    const collection = discordDB.collection(process.env.DATABASE_COLLECTION_NAME);
    
    // Get the guild
    const guild = client.guilds.cache.get(process.env.GUILD_ID);
    if (!guild) {
        console.error('[Safety Check] Could not find guild');
        return;
    }
    
    // Fetch all guild members
    await guild.members.fetch();
    
    // Get all role IDs that should be checked
    const rolesToCheck = [];
    
    // Add all plan-specific roles
    const planRoleIds = Object.values(planConfig.planRoles);
    if (planRoleIds.length > 0) {
        rolesToCheck.push(...planRoleIds);
    } else if (process.env.PAYING_ROLE_ID) {
        // Legacy mode - use the single role defined in .env
        rolesToCheck.push(process.env.PAYING_ROLE_ID);
    }
    
    if (rolesToCheck.length === 0) {
        console.log('[Safety Check] No roles configured to check. Skipping...');
        return;
    }
    
    console.log(`[Safety Check] Checking ${rolesToCheck.length} roles for unauthorized holders.`);
    
    // Track statistics
    let unauthorizedUsers = 0;
    let processedMembers = 0;
    let unauthorizedUsersList = [];
    
    // Check each member with any of the roles
    for (const [memberId, member] of guild.members.cache) {
        // Skip bots
        if (member.user.bot) continue;
        
        // Check if member has any of the roles to check
        const hasRolesToCheck = member.roles.cache.some(role => rolesToCheck.includes(role.id));
        
        if (hasRolesToCheck) {
            processedMembers++;
            
            // Check if member is in the database
            const userInDb = await collection.findOne({ discordId: memberId });
            
            if (!userInDb) {
                // User has roles but is not in the database - unauthorized access
                unauthorizedUsers++;
                unauthorizedUsersList.push({
                    id: memberId,
                    tag: member.user.tag,
                    mention: `<@${memberId}>`
                });
                
                console.log(`[Safety Check] Unauthorized role holder found: ${member.user.tag} (${memberId})`);
                
                // Remove the roles
                for (const roleId of rolesToCheck) {
                    if (member.roles.cache.has(roleId)) {
                        await member.roles.remove(roleId).catch(error => {
                            console.error(`[Safety Check] Error removing role ${roleId} from ${member.user.tag}:`, error);
                        });
                    }
                }
            }
        }
    }
    
    // Log the results
    console.log(`[Safety Check] Completed. Processed ${processedMembers} members with roles.`);
    console.log(`[Safety Check] Found ${unauthorizedUsers} unauthorized role holders.`);
    
    // Send a message to the logs channel
    const logsChannel = guild.channels.cache.get(process.env.LOGS_CHANNEL_ID);
    if (logsChannel && unauthorizedUsers > 0) {
        const message = unauthorizedUsersList.map(user =>
            lang.functions.safetyCheck.logRemovedUser
                .replace('{user_tag}', user.tag)
                .replace('{user_id}', user.id)
                .replace('{user_mention}', user.mention)
        ).join('\n');
        
        const summary = lang.functions.safetyCheck.logSummary.replace('{count}', unauthorizedUsers);
        
        logsChannel.send(`${message}\n\n${summary}`);
    } else if (logsChannel) {
        logsChannel.send(lang.functions.safetyCheck.logNoUnauthorized);
    }
};