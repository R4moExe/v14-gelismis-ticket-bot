const { EmbedBuilder } = require("discord.js");
const db = require("croxydb");

module.exports = {
  name: "ticket-ayarlar",
  description: "Ticket sisteminin mevcut ayarlarını gösterir.",
  type: 1,
  options: [],
  run: async (client, interaction) => {
    const guildID = interaction.guild.id;
    
    const kategoriID = db.get(`${guildID}_kategoriID`);
    const yetkiliRolID = db.get(`${guildID}_yetkilirolID`);
    const logChannelID = db.get(`${guildID}_logChannelID`);
    const ticketChannelID = db.get(`${guildID}_ticketChannelID`);
    
    const hataEmbed = new EmbedBuilder()
      .setTitle("❌ Ticket Kurulumu Yapılmadı")
      .setDescription("Ticket sistemi kurulumu yapılmadı. Lütfen önce `/ticket-kurulum` komutunu kullanarak sistemi kurun.")
      .setColor("Red");
    
    if (!kategoriID && !yetkiliRolID && !logChannelID && !ticketChannelID) {
      return interaction.reply({ 
        embeds: [hataEmbed], 
        ephemeral: true 
      });
    }
    
    const kategori = kategoriID ? interaction.guild.channels.cache.get(kategoriID) : null;
    const yetkiliRol = yetkiliRolID ? interaction.guild.roles.cache.get(yetkiliRolID) : null;
    const logChannel = logChannelID ? interaction.guild.channels.cache.get(logChannelID) : null;
    const ticketChannel = ticketChannelID ? interaction.guild.channels.cache.get(ticketChannelID) : null;
    
    const ayarlarEmbed = new EmbedBuilder()
      .setTitle("🎫 Ticket Ayarları")
      .setDescription(`Aşağıda bu sunucu için yapılmış ticket ayarları gösterilmektedir.`)
      .addFields(
        { 
          name: "📁 Ticket Kategorisi", 
          value: kategori ? `<#${kategoriID}> (${kategoriID})` : "❌ Ayarlanmamış", 
          inline: true 
        },
        { 
          name: "👮 Yetkili Rolü", 
          value: yetkiliRol ? `<@&${yetkiliRolID}> (${yetkiliRolID})` : "❌ Ayarlanmamış", 
          inline: true 
        },
        { 
          name: "📝 Log Kanalı", 
          value: logChannel ? `<#${logChannelID}> (${logChannelID})` : "❌ Ayarlanmamış", 
          inline: true 
        },
        { 
          name: "🎫 Ticket Kanalı", 
          value: ticketChannel ? `<#${ticketChannelID}> (${ticketChannelID})` : "❌ Ayarlanmamış", 
          inline: true 
        }
      )
      .setColor("Blue")
      .setFooter({ text: `${interaction.guild.name} Ticket Sistemi` })
      .setTimestamp();
      
    await interaction.reply({ embeds: [ayarlarEmbed] });
  }
};
