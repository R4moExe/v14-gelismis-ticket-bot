const { EmbedBuilder } = require("discord.js");
const db = require("croxydb");

module.exports = {
  name: "ticket-ekle",
  description: "Ticket kanalına bir kullanıcı ekler.",
  type: 1,
  options: [
    {
      name: "user_id",
      description: "Eklenecek kullanıcının ID'sini girin.",
      type: 3,
      required: true,
    },
  ],
  run: async (client, interaction) => {
    const yetkiliRolID = db.get(`${interaction.guild.id}_yetkilirolID`);
    const hasRole = interaction.member.roles.cache.has(yetkiliRolID);
    const yetkiEmbed = new EmbedBuilder()
        .setTitle("❌ Yetersiz Yetki")
        .setDescription("Bu butonu kullanmak için yeterli yetkiye sahip değilsiniz.")
        .setColor("Red");
    
    if (!hasRole) {
      return interaction.reply({ 
        embeds:[yetkiEmbed], ephemeral: true 
      });
    }
    
    const userID = interaction.options.getString("user_id");
    const channel = interaction.channel;

    const ticketData = db.get(`ticket_${channel.id}`);
    if (!ticketData || ticketData.status === "Kapalı") {
      const yokEmbed = new EmbedBuilder()
      .setTitle("❌ Ticket Bulunamadı")
      .setDescription("Komutu kullanmak için bir ticket kanalında olmalısınız.")
      .setColor("Red");
      return interaction.reply({embeds:[yokEmbed], ephemeral: true });
    }

    await channel.permissionOverwrites.edit(userID, {
      ViewChannel: true,
      SendMessages: true,
    });

    const member = interaction.guild.members.cache.get(userID);
    const embed = new EmbedBuilder()
      .setTitle("Kullanıcı Ticket'a Eklendi")
      .setDescription(`**${member ? member.user.username : "Bilinmeyen Kullanıcı"}** adlı kullanıcı, ticket kanalı **${channel.name}**'a eklendi.`)
      .setColor("Green");

    const messages = await channel.messages.fetch();
    const ticketMessage = messages.find(msg => msg.id === ticketData.messageId);
    if (ticketMessage) {
      const updatedEmbed = EmbedBuilder.from(ticketMessage.embeds[0])
        .setDescription(ticketMessage.embeds[0].description + `\n👤 **Yeni Katılımcı:** ${member ? member.user.username : userID}`);
      await ticketMessage.edit({ embeds: [updatedEmbed] });
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
