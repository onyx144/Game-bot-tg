const crypto = require('crypto');
const fs = require('fs');
const config = require('../config/config');
const bot = require('./bot');
const uploadFileToFTP = require('./ftp');
const randomValue = crypto.randomBytes(4).toString('hex'); // Генерирует случайную строку из 8 символов (4 байта в hex)

//const create_game_text = `Игра создана! Вы зможете пограти  <a href="http://gamebot.kyiv.ua/${filename}">тут</a>.`;
async function generateHTML(datas , chatId) {
    const data = datas;
    const filename = `game_${data.title}_${randomValue}.html`;

const options = {
    reply_markup: JSON.stringify({
        inline_keyboard: [
            [{ text: 'Створити нову гру', callback_data: 'configure_game' }],
            [{ text: 'Грати', url: `http://gamebot.kyiv.ua/${filename}` }]
        ]
    })
};
    console.log(data.background);
    if (!data) {
        return bot.sendMessage(chatId, 'Произошла ошибка в создании игры.');
    }
    if (!data.background.image_url) {
        data.background.image_url = '/img/default_bg.jpg';
    }
    if (!data.backgroundMobile.image_url) {
        data.backgroundMobile.image_url = data.background.image_url;
    }
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="ru">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${data.title}</title>
        <link rel="stylesheet" href="css/style.css?v=1.0.1">
        <style>
            body {
                background-image: url(${data.background.image_url}); /* Путь к изображению для ПК */
                background-size: cover; /* Растягивает изображение, чтобы оно покрывало весь экран */
                background-position: center; /* Центрирует изображение на экране */
                background-attachment: fixed; /* Фиксирует изображение, так что оно не двигается при прокрутке */
                width: 100%;
            }
    
            /* Медиа-запрос для устройств с максимальной шириной 768px (обычно это планшеты и телефоны) */
            @media (max-width: 768px) {
                body {
                    background-image: url(${data.backgroundMobile.image_url}); /* Путь к изображению для мобильных устройств */
                }
            }
        </style>
    </head>
    <body>
        <input type="number" style="display:none;" id="fail_value" value="${data.failCounter && data.failCounter !== 'Пусто' ? data.failCounter : '10'}">
        <div id="message">${data.text1}</div>
        <div id="win">${data.victoryText}</div>
        <div id="message-replacement" style="display: none;">Техніка заміни</div>
        <div id="fail" style="display:none;">${data.textFail}</div> 
        <img id="image_fail" src="${data.imageFail.image_url}" alt="Цель" style="display: none;">
        <img id="image" src="${data.image.image_url}" alt="Цель" style="display: none;">

        <img id="brevno" src="img/brevno.png" alt="Цель" style="display: none;">
    
        <script src="js/script.js?v=1.2.31"></script>
    </body>
    </html>
    `;

    const htmlLocalPath = `${config.wayFolder}/${filename}`;
    const htmlRemotePath = `/www/gamebot.kyiv.ua/${filename}`;
  
        try {
            await fs.writeFileSync(`public/${filename}`, htmlContent, 'utf8');
            await uploadFileToFTP(htmlLocalPath, htmlRemotePath);
            if (data.image.image_url) {
            const imageName = data.image.image_url.split('/').pop();
            const imageLocalPath = `${config.wayFolder}${data.image.image_url}`; // Предполагаем, что изображение уже сохранено локально
            const imageRemotePath = `/www/gamebot.kyiv.ua/img/${imageName}`;
            await uploadFileToFTP(imageLocalPath, imageRemotePath);
            }
            if (data.imageFail.image_url) {
                const imageName = data.imageFail.image_url.split('/').pop();
                const imageLocalPath = `${config.wayFolder}${data.imageFail.image_url}`; // Предполагаем, что изображение уже сохранено локально
                const imageRemotePath = `/www/gamebot.kyiv.ua/img/${imageName}`;
                await uploadFileToFTP(imageLocalPath, imageRemotePath);
            }
            if (data.background.image_url) {
            const imageName = data.background.image_url.split('/').pop();
            const imageLocalPath = `${config.wayFolder}${data.background.image_url}`; // Предполагаем, что изображение уже сохранено локально
            const imageRemotePath = `/www/gamebot.kyiv.ua/img/${imageName}`;
            await uploadFileToFTP(imageLocalPath, imageRemotePath);
            } 
            if (data.backgroundMobile.image_url) {
                const imageName = data.backgroundMobile.image_url.split('/').pop();
                const imageLocalPath = `${config.wayFolder}${data.backgroundMobile.image_url}`; // Предполагаем, что изображение уже сохранено локально
                const imageRemotePath = `/www/gamebot.kyiv.ua/img/${imageName}`;
                await uploadFileToFTP(imageLocalPath, imageRemotePath);
            }   
            bot.sendMessage(chatId, `Гра створена! Натисніть кнопку грати` , { parse_mode: 'HTML', ...options });
        } catch (err) {
            console.log(err);
            bot.sendMessage(chatId, 'Произошла ошибка при создании или загрузке HTML файла.');
        }
    
}

module.exports = { generateHTML };
