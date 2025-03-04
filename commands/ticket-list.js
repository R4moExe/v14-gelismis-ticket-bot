const { EmbedBuilder } = require("discord.js");
const db = require("croxydb");

module.exports = {
  name: "ticket-list",
  description: "Aktif ticketları, ilgilenen yetkiliyi ve ticket kanalını gösterir.",
  type: 1,
  options: [],
  run: async (client, interaction) => {
    const guildID = interaction.guild.id;
    const categoryID = db.get(`${guildID}_kategoriID`);
    const hataEmbed = new EmbedBuilder()
    .setTitle("❌ Ticket Kategorisi Bulunamadı")
    .setDescription("Ticket kategorisi bulunamadı. Lütfen önce `/ticket-kurulum` komutu ile ticket sistemini kurun.")
    .setColor("Red");
    if (!categoryID) {
      return interaction.reply({ 
        embeds:[hataEmbed], 
        ephemeral: true 
      });
    }
    
    const guild = interaction.guild;

    const channels = guild.channels.cache.filter(channel => channel.parentId === categoryID);

    const activeTickets = [];

    for (const [channelID, channel] of channels) {
      const ticketData = db.get(`ticket_${channelID}`);
      if (ticketData && ticketData.status !== "Kapalı") {
        const member = guild.members.cache.get(ticketData.yetkili);
        activeTickets.push({
          channel: channel,
          status: ticketData.status,
          user: member ? member.user.username : "Henüz bir yetkili atanmadı"
        });
      }
    }
const hataEmbed2 = new EmbedBuilder()
    .setTitle("❌ Aktif Ticket Bulunumadı")
    .setDescription("Aktif ticket bulunamadı")
    .setColor("Red");
    if (activeTickets.length === 0) {
      return interaction.reply({ embeds:[hataEmbed2], ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle("Aktif Ticketlar")
      .setDescription(
        activeTickets.map((ticket, index) => `**${index + 1}. ${ticket.channel.name}**\nDurum: ${ticket.status}\nYetkili: ${ticket.user}`).join("\n\n")
      )
      .setColor("Blue");

    await interaction.reply({ embeds: [embed] });
  }
};
