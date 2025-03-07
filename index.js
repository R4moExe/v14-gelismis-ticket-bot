const { 
    PermissionsBitField, EmbedBuilder, ButtonStyle, Client, ChannelType, Partials, 
    ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder 
} = require("discord.js");
const Discord = require("discord.js");
const db = require("croxydb");
const chalk = require("chalk");

const client = new Client({
    intents: Object.values(Discord.IntentsBitField.Flags),
    partials: Object.values(Partials)
});

global.client = client;
client.commands = (global.commands = []);
const { readdirSync } = require("fs");

readdirSync('./commands').forEach(f => {
    if (!f.endsWith(".js")) return;
    const props = require(`./commands/${f}`);
    client.commands.push({
        name: props.name.toLowerCase(),
        description: props.description,
        options: props.options,
        dm_permission: false,
        type: 1
    });
    console.log(chalk.red`[COMMAND]` + ` ${props.name} komutu yüklendi.`);
});

readdirSync('./events').forEach(e => {
    const eve = require(`./events/${e}`);
    const name = e.split(".")[0];
    client.on(name, (...args) => eve(client, ...args));
    console.log(chalk.blue`[EVENT]` + ` ${name} eventi yüklendi.`);
});

client.once("ready", async () => {
    await client.application.commands.set(client.commands);
    console.log(chalk.green`[BOT]` + " Komutlar başarıyla yüklendi.");
});

client.on("interactionCreate", async (interaction) => {
    if (interaction.isStringSelectMenu()) {
        if (interaction.customId === "ticket_kategori") {
            await createTicket(interaction);
        }
    }

    if (interaction.isButton()) {
        if (interaction.customId === "ticket_kapat") {
            await closeTicket(interaction);
        } else if (interaction.customId === "ticket_devral") {
            await claimTicket(interaction);
        }
    }
});

// **🎟️ Ticket Açma Fonksiyonu**
async function createTicket(interaction) {
    const guildID = interaction.guild.id;
    const categoryID = db.get(`${guildID}_kategoriID`);
    const yetkiliRolID = db.get(`${guildID}_yetkilirolID`);

    const categories = {
        "teknik_destek": "⚙️ Teknik Destek",
        "satis_oncesi": "🛒 Satış Öncesi Destek",
        "genel_destek": "📩 Genel Destek"
    }; // Daha Fazla Kategori Ekleyebilirsin

    const selectedCategory = interaction.values[0];
    const categoryName = categories[selectedCategory] || "Bilinmeyen Kategori";

    const guild = interaction.guild;
    const user = interaction.user;

    const channel = await guild.channels.create({
        name: `ticket-${user.username}`,
        type: ChannelType.GuildText,
        parent: categoryID,
        permissionOverwrites: [
            { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
            { id: user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
            { id: yetkiliRolID, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
        ]
    });
  
    const embed = new EmbedBuilder()
        .setTitle("🎫 Ticket Açıldı")
        .setDescription(`ℹ️ Lütfen yetkililerin mesaj yazmasını beklemeden sorununuzu anlatınız.\n\n👑 **Ticket Sahibi :** ${user}\n\n📁 **Kategori :** ${categoryName}\n\n👤 **İlgilenen Yetkili :** Henüz Yok\n\n🎫 **Ticket Durumu :** Beklemede`)
        .setColor("Blue");

    const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("ticket_devral")
            .setLabel("Devral")
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId("ticket_kapat")
            .setLabel("Kapat")
            .setStyle(ButtonStyle.Danger)
    );

    const ticketMessage = await channel.send({
        content: `${user} & ${guild.roles.cache.get(yetkiliRolID)}`,
        embeds: [embed],
        components: [buttons]
    });

    db.set(`ticket_${channel.id}`, { messageId: ticketMessage.id, status: "Beklemede", yetkili: null });

    interaction.reply({ content: `Ticket oluşturuldu ${channel}`, ephemeral: true });
}

async function closeTicket(interaction) {
    const channel = interaction.channel;
    const ticketData = db.get(`ticket_${channel.id}`);
    const yetkiliRolID = db.get(`${interaction.guild.id}_yetkilirolID`);
    
    const hasRole = interaction.member.roles.cache.has(yetkiliRolID);
    const yetkiEmbed = new EmbedBuilder()
        .setTitle("❌ Yetersiz Yetki")
        .setDescription("Bu butonu kullanmak için yeterli yetkiye sahip değilsiniz.")
        .setColor("Red");
    if (!hasRole) {
        return interaction.reply({ embeds:[yetkiEmbed], ephemeral: true });
    }
    const kapatEmbed = new EmbedBuilder()
        .setTitle("⏳ Ticket Kapatılıyor...")
        .setDescription("Bu kanal 3 saniye içinde silinecek...")
        .setColor("Green");
    await interaction.reply({ embeds: [kapatEmbed], ephemeral: true });
    
    try {
        const messages = await channel.messages.fetch({ limit: 1000 });
        
        const orderedMessages = Array.from(messages.values()).reverse();
        
        let logText = `=== TICKET KAYDI: ${channel.name} ===\n`;
        logText += `Oluşturulma Tarihi: ${new Date(channel.createdTimestamp).toLocaleString('tr-TR')}\n`;
        
        if (ticketData && ticketData.yetkili) {
            const yetkili = await interaction.guild.members.fetch(ticketData.yetkili).catch(() => null);
            logText += `İlgilenen Yetkili: ${yetkili ? yetkili.user.tag : 'Bilinmiyor'}\n`;
        }
        
        logText += `Durum: ${ticketData ? ticketData.status : 'Bilinmiyor'}\n`;
        logText += `Kapatan Kullanıcı: ${interaction.user.tag}\n`;
        logText += `Kapanış Tarihi: ${new Date().toLocaleString('tr-TR')}\n\n`;
        logText += `=== MESAJLAR ===\n\n`;

        orderedMessages.forEach((msg) => {
            const time = new Date(msg.createdTimestamp).toLocaleString('tr-TR');
            logText += `[${time}] ${msg.author.tag}: ${msg.content}\n`;
            
            if (msg.embeds.length > 0) {
                msg.embeds.forEach(embed => {
                    logText += `[EMBED] Başlık: ${embed.title || 'Başlıksız'}\n`;
                    if (embed.description) logText += `[EMBED] Açıklama: ${embed.description}\n`;
                });
            }
            
            if (msg.attachments.size > 0) {
                msg.attachments.forEach(attachment => {
                    logText += `[DOSYA] ${attachment.name}: ${attachment.url}\n`;
                });
            }
            
            logText += `\n`;
        });
        
        const logChannelId = db.get(`${interaction.guild.id}_logChannelID`);
        const logChannel = interaction.guild.channels.cache.get(logChannelId);
        
        if (logChannel) {
            const ticketOwner = channel.name.replace('ticket-', '');
            const fileName = `ticket-${ticketOwner}-${Date.now()}.txt`;
            
            await logChannel.send({
                content: `📝 **${channel.name}** adlı ticket'ın kayıtları:`,
                files: [{
                    attachment: Buffer.from(logText, 'utf-8'),
                    name: fileName
                }]
            });
        }
        
    } catch (error) {
        console.error("Ticket log oluşturulurken hata:", error);
        await interaction.followUp({ 
            content: "Ticket mesajları kaydedilirken bir hata oluştu!", 
            ephemeral: true 
        }).catch(() => {});
    }
    
    setTimeout(() => {
        channel.delete().catch(err => console.error("Kanal silinirken hata:", err));
    }, 3000);
}

// Ticket devralma
async function claimTicket(interaction) {
    const user = interaction.user;
    const channel = interaction.channel;
    const yetkiliRolID = db.get(`${interaction.guild.id}_yetkilirolID`);
    
    const hasRole = interaction.member.roles.cache.has(yetkiliRolID);
    if (!hasRole) {
        return interaction.reply({ content: "❌ Bu butonu sadece yetkililer kullanabilir!", ephemeral: true });
    }

    const ticketData = db.get(`ticket_${channel.id}`);
    if (!ticketData) return interaction.reply({ content: "Ticket bilgisi bulunamadı!", ephemeral: true });

    const messages = await channel.messages.fetch({ limit: 10 });
    const ticketMessage = messages.get(ticketData.messageId);
    if (!ticketMessage) return interaction.reply({ content: "Ticket mesajı bulunamadı!", ephemeral: true });
  
    const newEmbed = EmbedBuilder.from(ticketMessage.embeds[0])
        .setDescription(ticketMessage.embeds[0].description
            .replace("🎫 **Ticket Durumu :** Beklemede", "🎫 **Ticket Durumu :** İnceleniyor")
            .replace("👤 **İlgilenen Yetkili :** Henüz yok", `👤 **İlgilenen Yetkili :** ${user}`)
        );

    const devralEmbed = new EmbedBuilder()
        .setTitle("Ticket Devralındı")
        .setDescription(`Ticket ${user} İsimli Yetkili Tarafından İncelenmeye Başlandı!`)
        .setColor("Blue");
  
    const updatedButtons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("ticket_devral")
            .setLabel("Devral")
            .setStyle(ButtonStyle.Success)
            .setDisabled(true),
        new ButtonBuilder()
            .setCustomId("ticket_kapat")
            .setLabel("Kapat")
            .setStyle(ButtonStyle.Danger)
    );
  
    await ticketMessage.edit({ embeds: [newEmbed], components: [updatedButtons] });
    await channel.permissionOverwrites.edit(user.id, {
        ViewChannel: true,
        SendMessages: true
    });

    // Yetkili ticket sayısı arttırma
    let ticketCount = db.get(`ticket_count_${user.id}`) || 0;
    db.set(`ticket_count_${user.id}`, ticketCount + 1);
    db.set(`ticket_${channel.id}`, { messageId: ticketMessage.id, status: "İnceleniyor", yetkili: user.id });

    await interaction.reply({ embeds: [devralEmbed], ephemeral: false });
}

// Hata oluştuğunda botu kapatmama
process.on("unhandledRejection", async (error) => {
    console.error(chalk.red(`[UNHANDLED REJECTION]`), error);
});

client.login(process.env.token);
