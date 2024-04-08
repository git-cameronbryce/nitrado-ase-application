const { EmbedBuilder } = require('discord.js')

module.exports.Unauthorized = function(role) {
    return new EmbedBuilder()
    .setColor('#e67e22')
    .setDescription(`**Unauthorized Access**\nYou do not have the required permissions.\nPlease ask an administrator for access.\n${role}\n\n ** Additional Information **\nThe role was generated upon token setup.`)
    .setFooter({ text: 'Tip: Contact support if there are issues.' })
}

module.exports.PendingAuthorization = function(success, total) {
return new EmbedBuilder()
.setColor('#2ecc71')
.setDescription(`**Pending Action Authorization**\nGrant permission to access your services.\nThe bot will begin installing your logging.\n\`🔐\` Pending: x${success} \`🟠\` Failure: x${total - success}\n\n**Additional Information**\nMultiple threads will be generated.`)
.setFooter({ text: 'Tip: Contact support if there are issues.' })
}


module.exports.DatabaseCommandFailure = new EmbedBuilder()
.setColor('#e67e22')
.setDescription(`**Database Command Failure**\nQueried player data not stored.\nBan information isn\'t stored.`)
.setFooter({ text: 'Tip: Contact support if there are issues.' })
.setThumbnail('https://i.imgur.com/PCD2pG4.png');


module.exports.DatabaseCommandSuccess = function(reason, admin) {
    return new EmbedBuilder()
    .setColor('#2ecc71')
    .setDescription(`**Database Command Success**\nPlayer information retrieved.\n\nRemoved for ${reason}.\n__ID: ${admin}__`)
    .setFooter({ text: 'Tip: Contact support if there are issues.' })
    .setThumbnail('https://i.imgur.com/CzGfRzv.png')
}

module.exports.NoAccount = new EmbedBuilder()
.setColor('#e67e22')
.setDescription(`**Unauthorized Access**\nYou do not have a connected account.\nPlease authorize with your provider.\n\`/setup-account\`\n\n**Additional Information**\nEnsure you follow setup procedures.`)
.setFooter({ text: 'Tip: Contact support if there are issues.' })


module.exports.SystemSetup = new EmbedBuilder()
.setColor('#2ecc71')
.setDescription(`**Account Setup & Overview**\nHello, thank you for choosing our service. Below, you'll have the option to link your token, along with a [video preview](https://i.imgur.com/a3b9GkZ.mp4) to display the process.\n\n**Additional Information**\nEnsure this guild is a [community](https://i.imgur.com/q8ElPKj.mp4) server, otherwise, the bot will not be able to connect properly. \n\n**[Partnership & Information](https://nitra.do/obeliskdevelopment "Nitrado Partner Link")**\nConsider using our partnership link to purchase your personal servers to help fund our services!`)
.setFooter({ text: 'Tip: Contact support if there are issues.' })
.setImage('https://i.imgur.com/2ZIHUgx.png')

module.exports.GameCommandSuccess = function(success,current) {
 return new EmbedBuilder()
.setColor('#2ecc71')
.setDescription(`**Game Command Success**\nGameserver action completed.\nExecuted on \`${success}\` of \`${current}\` servers.`)
.setFooter({ text: 'Tip: Contact support if there are issues.' })
.setThumbnail('https://i.imgur.com/CzGfRzv.png')
}

module.exports.PlayerCommandLoggingPlayerWhitelist = function(input,interaction) {
    return new EmbedBuilder()
    .setColor('#2ecc71')
    .setFooter({ text: `Tip: Contact support if there are issues.` })
    .setDescription(`**Player Command Logging**\nGameserver action completed.\n\`/ase-player-whitelist\`\n\`${input.username}\`\n\n**ID: ${interaction.user.id}**`);
}

module.exports.ServerCommandSuccess  = new EmbedBuilder()
.setColor('#2ecc71')
.setDescription(`**Server Command Success**\nBackup has been automatically collected.\nNitrado uptime is required to save fully.\n\`🟢\` \`1 Gameserver Stopping\`\n\n**Additional Information**\nNo negative effects to this action.`)
.setFooter({ text: 'Tip: Contact support if there are issues.' })

module.exports.ServerCommandSuccessBackup = new EmbedBuilder()
.setColor('#2ecc71')
.setDescription(`**Server Command Success**\nBackup has been automatically collected.\nNitrado uptime is required to save fully.\n\`🟢\` \`1 Gameserver Restarting\`\n\n**Additional Information**\nNo negative effects to this action.`)
.setFooter({ text: 'Tip: Contact support if there are issues.' })