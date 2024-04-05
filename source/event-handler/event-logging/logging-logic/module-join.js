const { EmbedBuilder } = require('discord.js');
const data = new Set();

const joinExtractionLogic = async (reference, service, response, client) => {
  const regex = /.\d{4}.\d{2}.\d{2}.\d{2}.\d{2}.\d{2}.\d{3}..\d{3}.(\d{4}.\d{2}.\d{2}.\d{2}.\d{2}.\d{2}).\s+(\w{0,})\s*(\w{0,})\s*\w{0,}\s*ARK/g;

  try {
    let counter = 0;
    let result = '', pattern = '', unique = '';
    while ((result = regex.exec(response)) !== null && counter <= 10) {
      const [string, date, gamertag, condition] = result;
      const [datePart, timePart] = date.split('_');
      const dateTimeString = `${datePart.replace(/\./g, '-')}T${timePart.replace(/\./g, ':')}`;
      const unix = Math.floor(new Date(dateTimeString).getTime() / 1000);

      switch (condition) {
        case 'joined':
          pattern += `<t:${unix}:F>\n\`\`\`\n🟢 ${gamertag} joined your server!\n\`\`\`\n`;
          if (!data.has(pattern)) {
            data.add(pattern), counter++;
            unique += `<t:${unix}:F>\n\`\`\`\n🟢 ${gamertag} joined your server!\n\`\`\`\n`;
          };
          break;
        case 'left':
          pattern += `<t:${unix}:F>\n\`\`\`\n🟠 ${gamertag} left your server!\n\`\`\`\n`;
          if (!data.has(pattern)) {
            data.add(pattern), counter++;
            unique += `<t:${unix}:F>\n\`\`\`\n🟠 ${gamertag} left your server!\n\`\`\`\n`;
          };
          break;

        default:
          break;
      };
    };

    if (!unique) { return };
    Object.entries(reference.join).forEach(async entry => {
      if (parseInt(entry[0]) === service.id) {
        try {
          const channel = await client.channels.fetch(entry[1]);
          const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setFooter({ text: `Tip: Contact support if there are issues.` })
            .setDescription(`${unique}`);

          await channel.send({ embeds: [embed] });
        } catch (error) { { null } };
      };
    });
  } catch (error) { null };
};

module.exports = { joinExtractionLogic };
