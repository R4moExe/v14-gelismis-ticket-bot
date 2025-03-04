const { EmbedBuilder } = require("discord.js");
const db = require("croxydb");

module.exports = {
  name: "ticket-top",
  description: "Yetkili rolündeki herkesin ticket sayısını sıralar.",
  type: 1,
  options: [],
  run: async (client, interaction) => {
    const guildID = interaction.guild.id;
    const yetkiliRolID = db.get(`${guildID}_yetkilirolID`);
    const hataEmbed = new EmbedBuilder()
    .setTitle("❌ Yetkili Rolü Bulunamadı")
    .setDescription("Yetkili rolü ayarlanmamış. Lütfen önce `/ticket-kurulum` komutunu kullanarak ticket sistemini kurun.")
    .setColor("Red");
    if (!yetkiliRolID) {
      return interaction.reply({ 
        embeds:[hataEmbed], 
        ephemeral: true 
      });
    }

    const yetkiliRol = interaction.guild.roles.cache.get(yetkiliRolID);
    const hataEmbed2 = new EmbedBuilder()
    .setTitle("❌ Yetkili Rolü Bulunamadı")
    .setDescription("Ayarlamış Olduğunuz Yetkili Rolü Bulunamadı. Lütfen `/ticket-kurulum` komutu ile sistemi yeniden kurun.")
    .setColor("Red");
    if (!yetkiliRol) return interaction.reply({
      embeds:[hataEmbed2], ephemeral: true
    });

    const yetkililer = yetkiliRol.members.map(member => member.id);

    const ticketCounts = yetkililer
      .map(yetkili => ({
        yetkili,
        count: db.fetch(`ticket_count_${yetkili}`) || 0
      }))
      .filter(entry => entry.count > 0)
      .sort((a, b) => b.count - a.count);

    const description = ticketCounts.length
      ? ticketCounts.map((t, i) => `**${i + 1}.** <@${t.yetkili}> - **${t.count} Ticket**`).join("\n")
      : "Henüz ticket ile ilgilenen yetkili yok.";

    const embed = new EmbedBuilder()
      .setTitle("📊 Ticket Sıralaması")
      .setDescription(description)
      .setColor("Blue");
    interaction.reply({ embeds: [embed] });
  }
};
