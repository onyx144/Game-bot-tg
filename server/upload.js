const axios = require('axios');
const fs = require('fs');
const path = require('path');
const config = require('../config/config');
const FormData = require('form-data');
const { exec } = require('child_process');
const crypto = require('crypto');

/**
 * Удаляет фон из изображения, используя rembg.
 * @param {string} inputPath - Путь к исходному изображению.
 * @param {string} outputPath - Путь для сохранения результата.
 * @param {Function} callback - Функция обратного вызова.
 */
function removeBackground(inputPath, outputPath, callback) {
    exec(`rembg i ${inputPath} ${outputPath}`, (err, stdout, stderr) => {
        if (err) {
            console.error('Ошибка при удалении фона:', err);
            return callback(err);
        }
        callback(null, outputPath);
    });
}

/**
 * Загружает изображение на сервер.
 * @param {string} imageUrl - URL изображения для загрузки.
 * @param {Function} callback - Функция обратного вызова, которая вызывается после загрузки.
 */

function createRandomFilename(originalUrl) {
    const originalName = path.basename(originalUrl); // Извлекаем оригинальное имя файла
    const randomValue = crypto.randomBytes(8).toString('hex'); // Создаем случайное значение
    const extension = path.extname(originalName); // Извлекаем расширение файла
    const nameWithoutExtension = path.basename(originalName, extension); // Извлекаем имя файла без расширения
    return `${nameWithoutExtension}-${randomValue}${extension}`; // Возвращаем новое имя файла
}
function uploadImageToServer(imageUrl, removeBg, callback) {
    // Получаем изображение по URL и настраиваем поток для его чтения
    axios({
        method: 'get',
        url: imageUrl,
        responseType: 'stream'
    }).then(response => {
        const filename = createRandomFilename(imageUrl);
        const localPath = `public/img/${filename}`;
        const outputPath = `public/img/no-bg-${filename}`;
        const writer = fs.createWriteStream(localPath);

        response.data.pipe(writer);

        writer.on('finish', () => {
            // Проверяем, нужно ли удалять фон
            if (removeBg) {
                // Удаляем фон из изображения
                removeBackground(localPath, outputPath, (err, resultPath) => {
                    if (err) {
                        console.error('Ошибка при обработке изображения:', err);
                        callback(null); // Возвращаем ошибку в callback
                        return;
                    }
                    // Загружаем изображение без фона на сервер
                    uploadImage(resultPath, callback);
                });
            } else {
                // Просто загружаем оригинальное изображение на сервер
                uploadImage(localPath, callback);
            }
        });

        writer.on('error', (error) => {
            console.error('Ошибка при сохранении изображения:', error);
            callback(null); // Возвращаем ошибку в callback
        });
    }).catch(error => {
        console.error('Ошибка при загрузке изображения по URL:', error);
        callback(null); // Возвращаем ошибку в callback
    });
}

function uploadImage(imagePath, callback) {
    const formData = new FormData();
    formData.append('photo', fs.createReadStream(imagePath));

    axios.post(`http://${config.serverIP}:${config.serverPort}/upload`, formData, {
        headers: {
            ...formData.getHeaders(),
        },
    }).then(response => {
        callback(response.data.imageUrl);
    }).catch(error => {
        console.error('Ошибка при загрузке изображения на сервер:', error);
        callback(null); // Возвращаем ошибку в callback
    });
}


module.exports = { uploadImageToServer };
