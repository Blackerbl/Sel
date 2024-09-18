require('dotenv').config(); // dotenv'i projenize dahil edin
const Discord = require('discord.js-selfbot-v13');
const express = require('express'); // Basit bir sunucu oluşturmak için Express'i kullanacağız

const client = new Discord.Client();
const app = express();

// Çevresel değişkenleri alıyoruz
const token = process.env.DISCORD_TOKEN;
const port = process.env.PORT || 3000; // Varsayılan olarak 3000 portunu kullanır
const channelId = process.env.CHANNEL_ID;

client.on('ready', async () => {
    console.log(`${client.user.username} is ready!`);

    async function processMessages(channel) {
        try {
            const messages = await channel.messages.fetch({ limit: 10 }); // Son 10 mesajı al

            let allClaimed = true; // Başlangıçta tüm mesajların 'Claimed by keke_km' olduğunu varsay

            for (const message of messages.values()) {
                if (message.components.length > 0) {
                    let messageClaimed = false;

                    for (const row of message.components) {
                        for (const button of row.components) {
                            if (button.label.includes('Claimed by keke_km')) {
                                messageClaimed = true;
                            }
                        }
                    }

                    if (!messageClaimed) {
                        allClaimed = false; // Eğer herhangi bir mesaj "Claimed by keke_km" içermiyorsa, tümü claimlenmiş değil
                    }
                } else {
                    allClaimed = false; // Eğer bir mesajda buton yoksa, bu mesaj da claimlenmiş değil
                }
            }

            if (allClaimed) {
                // Eğer tüm mesajlar "Claimed by keke_km" ise, hepsini sil
                for (const message of messages.values()) {
                    await message.delete();
                    console.log(`Mesaj ID: ${message.id} silindi.`);
                }
            } else {
                // Eğer "Claim waifu" içeren buton varsa, ona tıkla
                for (const message of messages.values()) {
                    if (message.components.length > 0) {
                        for (const row of message.components) {
                            for (const button of row.components) {
                                if (button.label.includes('Claim waifu')) {
                                    await retryClickButton(message, button); // Butona tıkla ve mesajı sil
                                }
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Hata:', error);
        }
    }

    async function retryClickButton(message, button, retryCount = 0) {
        if (retryCount >= 5) {
            console.log(`Buton ${button.customId} 5 denemede tıklanamadı. İşlem iptal ediliyor.`);
            return;
        }

        try {
            await message.clickButton(button.customId);
            console.log(`Mesaj ID: ${message.id}, Buton ID: ${button.customId} - Butona tıklandı!`);
            await message.delete(); // Tıkladıktan sonra mesajı sil
            console.log(`Mesaj ID: ${message.id} silindi.`);
        } catch (error) {
            if (error.message.includes('INTERACTION_FAILED')) {
                console.log(`Butona tıklanamadı (Mesaj ID: ${message.id}, Buton ID: ${button.customId}) - Hata: INTERACTION_FAILED`);
                setTimeout(() => retryClickButton(message, button, retryCount + 1), 5000); // 5 saniye sonra tekrar dene
            } else {
                console.error(`Butona tıklanamadı (Mesaj ID: ${message.id}, Buton ID: ${button.customId}) - Hata:`, error);
            }
        }
    }

    async function continuousCheck() {
        const channel = await client.channels.fetch(channelId);
        if (!channel) {
            console.log('Kanal bulunamadı.');
            return;
        }

        // Sürekli döngüyle mesajları kontrol et
        setInterval(async () => {
            await processMessages(channel);
        }, 5000); // Her 5 saniyede bir mesajları kontrol et
    }

    continuousCheck(); // Mesajları kontrol eden döngüyü başlat
});

client.login(token);

// Basit bir sunucu oluşturuyoruz
app.get('/', (req, res) => {
    res.send('Bot çalışıyor!');
});

app.listen(port, () => {
    console.log(`Sunucu port ${port} üzerinde çalışıyor.`);
});
