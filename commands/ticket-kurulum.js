const { EmbedBuilder } = require("discord.js");
const db = require("croxydb");

module.exports = {
  name: "ticket-kurulum",
  description: "Ticket sistemini ayarlar.",
  type: 1,
  options: [
    {
      name: "kategori",
      description: "Ticketların açılacağı kategori ID'sini girin.",
      type: 3,
      required: true,
    },
    {
      name: "yetkili-rol",
      description: "Destek ekibi rolünün ID'sini girin.",
      type: 3,
      required: true,
    },
    {
      name: "log-kanal",
      description: "Ticket loglarının gönderileceği kanal ID'sini girin.",
      type: 3,
      required: true,
    },
    {
      name: "ticket-kanal",
      description: "Ticket açma mesajının gönderileceği kanal ID'sini girin.",
      type: 3,
      required: true,
    }
  ],
  run: async (client, interaction) => {
    const kategoriID = interaction.options.getString("kategori");
    const yetkiliRolID = interaction.options.getString("yetkili-rol");
    const logChannelID = interaction.options.getString("log-kanal");
    const ticketChannelID = interaction.options.getString("ticket-kanal");
    
    const guildID = interaction.guild.id;
    
    db.set(`${guildID}_kategoriID`, kategoriID);
    db.set(`${guildID}_yetkilirolID`, yetkiliRolID);
    db.set(`${guildID}_logChannelID`, logChannelID);
    db.set(`${guildID}_ticketChannelID`, ticketChannelID);
    
    const basariliEmbed = new EmbedBuilder()
      .setTitle("✅ Başarılı")
      .setDescription(`
        Ticket ayarları başarıyla kaydedildi:
        
        📁 **Kategori:** <#${kategoriID}>
        👮 **Yetkili Rol:** <@&${yetkiliRolID}>
        📝 **Log Kanalı:** <#${logChannelID}>
        🎫 **Ticket Kanalı:** <#${ticketChannelID}>
      `)
      .setColor("Green");
      
    await interaction.reply({ embeds: [basariliEmbed] });
  }
};
