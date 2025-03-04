const { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require("discord.js");
const db = require("croxydb");

module.exports = {
  name: "ticket-panel",
  description: "Ticket Panel Mesajı Gönderir.",
  type: 1,
  options: [],
  run: async (client, interaction) => {
    const guildID = interaction.guild.id;
    const ticketChannelId = db.get(`${guildID}_ticketChannelID`);
    const hataEmbed = new EmbedBuilder()
    .setTitle("❌ Ticket Kurulumu Yapılmadı")
    .setDescription("Ticket sistemi kurulumu yapılmadı. Lütfen önce `/ticket-kurulum` komutunu kullanarak sistemi kurun.")
    .setColor("Red");
    if (!ticketChannelId) {
      return interaction.reply({ 
        embeds:[hataEmbed], 
        ephemeral: true 
      });
    }
    
    const ticketChannel = interaction.guild.channels.cache.get(ticketChannelId);
const hataEmbed2 = new EmbedBuilder()
    .setTitle("❌ Ticket Kurulumu Yapılmadı")
    .setDescription("Ticket mesajı gönderilecek kanal bulunamadı. Lütfen önce `/ticket-kurulum` komutunu kullanarak sistemini kurun.")
    .setColor("Red");
    if (!ticketChannel) {
      return interaction.reply({ 
        embeds:[hataEmbed2], 
        ephemeral: true 
      });
    }

    const embed = new EmbedBuilder()
      .setTitle(`${interaction.guild.name} | Destek Sistemi`)
      .setDescription(`
        <:openticket:1337080611701002280> ・ Lütfen sorunuz ile **eşleşen başlığı** seçerek destek talebi açınız ve ticket kurallarına uyunuz.

**DESTEK SAATLERİ**
\`\`\`» 13.00 - 00.00\`\`\`
      `)
      .setColor("Blue")
      .setFooter({ text: "Seçilen kategoriye göre ticket açılacaktır." })
      .setThumbnail(interaction.guild.iconURL());

    const menu = new StringSelectMenuBuilder()
      .setCustomId("ticket_kategori")
      .setPlaceholder("⚠️ Sorununuz İle İlgili Kategoriyi Seçiniz")
      .addOptions([
        { label: "Teknik Destek", value: "teknik_destek", emoji: "<:teknikdestek:1337893481338769503>" },
        { label: "Satış Öncesi Destek", value: "satis_oncesi", emoji: "<:shoppingcart:1337083324841070692>" },
        { label: "Genel Destek", value: "genel_destek", emoji: "<:geneldestek:1337894476382998609>" },
      ]);

    const row = new ActionRowBuilder().addComponents(menu);

    await ticketChannel.send({ embeds: [embed], components: [row] });
    const basariliEmbed = new EmbedBuilder()
    .setTitle("✅ Ticket Kurulumu Başarılı")
    .setDescription(`Ticket sistemi başarıyla kuruldu ve` + `${ticketChannel} kanalına gönderildi.`)
    .setColor("Green");

    await interaction.reply({ 
      embeds:[basariliEmbed], 
      ephemeral: true 
    });
  }
};
