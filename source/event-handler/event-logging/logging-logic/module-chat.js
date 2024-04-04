const { EmbedBuilder } = require('discord.js');
const data = new Set();

const chatExtractionLogic = async (reference, service, response, client) => {
  const regex = /\[\d{4}\.\d{2}\.\d{2}-\d{2}\.\d{2}\.\d{2}:\d{3}\]\[\s*\d+\]([\d.]+_[\d.]+): (\S+(?: \S+)*) \(([^()]+)\): (.+)/g;

  try {
    let counter = 0;
    let result = '', pattern = '', unique = '';
    while ((result = regex.exec(response)) !== null && counter <= 10) {
      const [string, date, gamertag, username, message] = result;
      const [datePart, timePart] = date.split('_');
      const dateTimeString = `${datePart.replace(/\./g, '-')}T${timePart.replace(/\./g, ':')}`;
      const unix = Math.floor(new Date(dateTimeString).getTime() / 1000);

      pattern += `<t:${unix}:f>\n**Player Identity Information**\n[${gamertag}]: ${username} \n${message} \n\n`;
      if (!data.has(pattern)) {
        data.add(pattern), counter++;
        unique += `<t:${unix}:f>\n**Player Identity Information**\n[${gamertag}]: ${username} \n${message} \n\n`;
      };
    };

    if (!unique) { return };
    Object.entries(reference.chat).forEach(async entry => {
      if (parseInt(entry[0]) === service.id) {
        try {
          const channel = await client.channels.fetch(entry[1]);
          const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setFooter({ text: `Tip: Contact support if there are issues.` })
            .setDescription(`${unique}`);

          await channel.send({ embeds: [embed] });
        } catch (error) {
          if (error.code === 10003) { console.log('Missing Access') };
        };
      };
    });
  } catch (error) { console.log(error) };
};

module.exports = { chatExtractionLogic };
