const TelegramBot = require('node-telegram-bot-api');
const config = require('../config/config');
const token = config.telegramBotToken;
const bot = new TelegramBot(token, { polling: true });

module.exports = bot;