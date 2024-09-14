const express = require("express");
const multer = require("multer");
const path = require("path");
const { generateHTML } = require("./server/generateHtml");
const { uploadImageToServer } = require("./server/upload");

// Настройка сервера и загрузки файлов
const app = express();
const PORT = process.env.PORT || 3000;
const bot = require("./server/bot");
const config = require("./config/config")
const { waitForDebugger } = require("inspector");
let customData = {};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/img/"); // Убедитесь, что этот путь существует
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});
const upload = multer({ storage: storage });

app.post("/upload", upload.single("photo"), (req, res) => {
  if (req.file) {
    res.json({ imageUrl: `/img/${req.file.filename}` });
  } else {
    res.status(400).send("No file uploaded.");
  }
});
const botDescription =
  `Вітаю! Я Бот для створення ігор.\n\n` +
  `З моєю допомогою ти можеш створити унікальну гру про людину, завантаживши її фото та заповнивши необхідний текст!\n\n` +
  `Приклад: <a href='http://gamebot.kyiv.ua/'> Спіймай Друга </a> , у цій грі потрібно чотири рази спіймати картинка для перемоги`;

const options = {
  reply_markup: JSON.stringify({
    inline_keyboard: [
      [{ text: "Настроити та створити гру", callback_data: "configure_game" }],
      [{ text: "Запропонувати гру", callback_data: "suggest_game" }],
      [{ text: "Таріфи", callback_data: "tarif" }],
    ],
  }),
};
function updateGameData(chatId, key, messageText, notificationText) {
    console.log(chatId);
    customData[chatId][key] = messageText;
    sendMessageWithGameConfiguration(chatId);
    bot.sendMessage(chatId, `${notificationText}: ${messageText}`);
  
}
function updateImageData(chatId, key, message  , notificationText , remBg ) {
    bot.sendMessage(chatId, "Зачекайте, йде обробка фото").then(() => {
      const fileId = message[message.length - 1].file_id; // Берем фотографию с наивысшим разрешением

      bot
        .getFileLink(fileId)
        .then((link) => {
          // Здесь вызываем функцию для загрузки изображения на сервер
          uploadImageToServer(link, remBg, (imageUrl) => {
            // Сохраняем URL изображения после загрузки
            customData[chatId][key].text = "Зображення збережено";
            customData[chatId][key].image_url = imageUrl;         
             // Повторно отправить сообщение с конфигурацией
            bot.sendMessage(chatId, `${notificationText}`);
            sendMessageWithGameConfiguration(chatId);
          });
        })
        .catch((error) => {
          console.error("Ошибка при получении ссылки на фото:", error);
          bot.sendMessage(
            chatId,
            "Произошла ошибка при загрузке фотографии."
          );
        });
    });  
}
bot.on("callback_query", (callbackQuery) => {
  const msg = callbackQuery.message;
  const chatId = msg.chat.id;
  const data = callbackQuery.data;
  if (!customData[chatId]) {
    customData[chatId] = {
      waitingFor: 0,
      title: "Пусто",
      image: {
        text : "Пусто",
        image_url: 0,
      },
      text1: "Пусто",
      failCounter: "Пусто",
      textFail: "Пусто",
      imageFail: {
        text : "Пусто",
        image_url: 0,
      },
      background: {
        text : "Пусто",
        image_url: 0,
      },
      backgroundMobile: {
        text : "Пусто",
        image_url: null,
      },
      victoryText: "Пусто",
    };
  }

  switch (data) {
    case "configure_game":
      customData[chatId] = {
        waitingFor: 0,
        title: "Пусто",
        image: {
          text : "Пусто",
          image_url: 0,
        },
        text1: "Пусто",
        failCounter: "Пусто",
        textFail: "Пусто",
        imageFail: {
          text : "Пусто",
          image_url: 0,
        },
        background: {
          text : "Пусто",
          image_url: 0,
        },
        backgroundMobile: {
          text : "Пусто",
          image_url: 0,
        },
        victoryText: "Пусто",
      };
      sendMessageWithGameConfiguration(chatId);
      break;
    case "suggest_game":
      if (!customData[chatId]) {
        customData[chatId] = {}; // Инициализируем пустым объектом или базовой структурой
      }
      console.log(customData[chatId]);
      customData[chatId].waitingAwait = "awaiting_game";
      bot.sendMessage(chatId, 'Напишіть свою пропозицию:');
      break;  
    case "tarif":
      if (!customData[chatId]) {
        customData[chatId] = {}; // Инициализируем пустым объектом или базовой структурой
      }
      sendMessageTarifPay(chatId);

     break; 
     case "pay_game":
      if (!customData[chatId]) {
        customData[chatId] = {}; 
      }
      bot.sendMessage(chatId, 'Нажаль мы очікуємо еквайрінг від LiqPay, як вони його нададуть , ви зможете скористатися нашими послугами');
     break;
    case "set_title":
      customData[chatId].waitingFor = "title";
      customData[chatId].name = "назви гри";
      bot.sendMessage(chatId, "Напишіть назву гри:");
      break;
    case "set_image":
      customData[chatId].waitingImage = "image";
      customData[chatId].booleanType = true;
      customData[chatId].name = "зображення персонажу гри";
      bot.sendMessage(chatId, "Завантажте зображення:");
      break;

    case "set_text1":
      customData[chatId].waitingFor = "text1";
      customData[chatId].name = "тексту першого екрану";
      bot.sendMessage(chatId, "Напишіть текст першого екрану:");
      break;

    case "set_fail_counter":
      customData[chatId].waitingFor = "failCounter";
      customData[chatId].name = "кількість кліків перед поразкою";
      bot.sendMessage(chatId, "Вкажіть кількість кліків перед поразкою:");
      break;

    case "set_text_fail":
      customData[chatId].waitingFor = "textFail";
      customData[chatId].name = "тексту поразки";
      bot.sendMessage(chatId, "Напишіть текст поразки:");
      break;

    case "set_image_fail":
      customData[chatId].waitingImage = "imageFail";
      customData[chatId].booleanType = true;
      customData[chatId].name = "зображення поразки";
      bot.sendMessage(chatId, "Завантажте зображення поразки:");
      break;

    case "set_backgraund":
      customData[chatId].waitingImage = "background";
      customData[chatId].booleanType = false;
      customData[chatId].name = "фона гри";
      bot.sendMessage(chatId, "Завантажте фон:");
      break;

    case "set_backgraund_mobile":
      customData[chatId].waitingImage = "backgroundMobile";
      customData[chatId].booleanType = false;
      customData[chatId].name = "фона для мобільних телефонів та планшетів";
      bot.sendMessage(chatId, "Завантажте фон для телефонів та планшетів:");
      break;

    case "set_victoryText":
      customData[chatId].waitingFor = "victoryText";
      customData[chatId].name = "тексту перемоги";
      bot.sendMessage(chatId, "Напишіть текст перемоги:");
      break;
    case "set_replacementText":
      customData[chatId].waitingFor = "victoryText";
      customData[chatId].name = "тексту заміни";
      bot.sendMessage(chatId, "Напишіть текст перемоги:");
      break;

    case "create_game":
         if (
        !customData[chatId] ||
        !customData[chatId].title ||
        customData[chatId].title === "Пусто" ||
        !customData[chatId].image ||
        customData[chatId].image === "Пусто" ||
        !customData[chatId].text1 ||
        customData[chatId].text1 === "Пусто" ||
        !customData[chatId].victoryText ||
        customData[chatId].victoryText === "Пусто" ||
        !customData[chatId].imageFail ||
        customData[chatId].imageFail === "Пусто" ||
        !customData[chatId].background ||
        customData[chatId].background === "Пусто"
        
      ) {
        bot.sendMessage(
          chatId,
          "Не всі дані заповнені. Будь ласка, переконайтеся, що всі поля налаштовані перед створенням гри"
        );
      } else {
        // Все данные заполнены, можно создавать HTML
        bot.sendMessage(chatId, "На жаль, у вас не сплачено створення гри, будь ласка сплатіть за обраний тариф і ви зможете створити вашу гру");
        sendMessageTarifPay(chatId);

        // }
      break;
  }}
});

function sendMessageWithGameConfiguration(chatId) {
  const gameData = customData[chatId];
  const text = `Назва гри: ${gameData.title}\nЗображеня персонажа: ${gameData.image.text}\nТекст перед грою: ${gameData.text1}\nКількість кліків перед поразкою${gameData.failCounter && gameData.failCounter !== "Пусто" ? `: ${gameData.failCounter}` : ' (За замовчуванням, 10)'}.\nТекст поразки: ${gameData.textFail}\nЗображення поразки: ${gameData.imageFail.text}\nФон: ${gameData.background.text}\nФон для телефонів та планшетів(Якщо не завантаженно , встановиться звичайний фон): ${gameData.backgroundMobile.text}\nТекст заміни: ${gameData.replacementText}\nЗображения заміни: ${gameData.imageReplacement.text}\nТекст перемоги: ${gameData.victoryText}`;
const options = {
    reply_markup: JSON.stringify({
        inline_keyboard: [
            [{ text: "Задати назву гри" , callback_data: "set_title" }],
            [{ text: "Завантажте зображення персонажа", callback_data: "set_image" }],
            [{ text: "Задати текст перед грою", callback_data: "set_text1" }],
            [{ text: "Задати кількість кліків перед поразкою ", callback_data: "set_fail_counter" }],
            [{ text: "Задати текст поразки", callback_data: "set_text_fail" }],
            [{ text: "Завантажте зображення поразки", callback_data: "set_image_fail" }],
            [{ text: "Завантажте фон", callback_data: "set_backgraund" }],
            [{ text: "Завантажте фон для телефонів та планшетів", callback_data: "set_backgraund_mobile" }],
            [{ text: "Задати текст заміны", callback_data: "set_replacementText" }],
            [{ text: "Завантажте зображения заміны", callback_data: "set_image_replacement" }],
            [{ text: "Задати текст перемоги", callback_data: "set_victoryText" }],
            [{ text: "Створити гру", callback_data: "create_game" }],
        ],
    }),
};



  // Отправляем новое сообщение и сохраняем его идентификатор
  bot.sendMessage(chatId, text, options).then((sentMsg) => {
    gameData.messageId = sentMsg.message_id;
  });
}
function sendMessageTarifPay(chatId) {
  const gameData = customData[chatId];
  const text = 'Тарифи оплати за гру:\n Одна гра 40 гривень\n Підписка з 10 іграми на місяць: 60 гривень\n Підписка з безлімітним створенням ігр на місяць: 100 гривен\n'
  const options = {
    reply_markup: JSON.stringify({
        inline_keyboard: [
            [{ text: "Сплатити за одну гру" , callback_data: "pay_game" }],
            [{ text: "Сплатити підписку за 80 грн", callback_data: "pay_game" }],
            [{ text: "Сплатити підписку за 100 грн", callback_data: "pay_game" }],
        ],
    }),
  };
  bot.sendMessage(chatId, text, options).then((sentMsg) => {
    gameData.messageId = sentMsg.message_id;
  });
}
bot.on("polling_error", (error) => {
  console.log(error); // Посмотрите подробную информацию об ошибке
});
function onUserMessage(chatId, msg) {
  // Проверяем, ожидается ли от пользователя ввод.
  if (customData[chatId]) {
    if(customData[chatId].waitingFor) {
    const inputType = customData[chatId].waitingFor;
    if(inputType == 'failCounter') {
      if(!isNaN(parseInt(msg.text, 10))){
        updateGameData(
          chatId,
          inputType,
          msg.text,
          `Ваше значеня для ${customData[chatId].name} збереженно`
        );
        customData[chatId].waitingFor = null;
      }
      else bot.sendMessage(chatId, "Будь ласка, надішліть число.");

    }
    else {
    updateGameData(
      chatId,
      inputType,
      msg.text,
      `Ваше значеня для ${customData[chatId].name} збереженно`
    );
    // Сброс ожидания ввода, поскольку мы уже получили нужные данные.
    customData[chatId].waitingFor = null;
    }
    }
    else if (customData[chatId].waitingImage) {
      if (msg.photo && msg.photo.length > 0) {
      const inputType = customData[chatId].waitingImage; 
      const booleanType = customData[chatId].booleanType;  
      updateImageData(chatId , inputType , msg.photo , `Зображення ${customData[chatId].name} , збереженно` , booleanType);
      customData[chatId].waitingImage = null;
      }
      else  bot.sendMessage(chatId, "Будь ласка, надішліть зображення.");
    }
    
  }
}

bot.on("message", (msg) => {
  const chatId = msg.chat.id;

  if (customData[chatId] && (customData[chatId].waitingFor || customData[chatId].waitingImage)) {
    onUserMessage(chatId, msg);
  }
  else if (customData[chatId] && customData[chatId].waitingAwait == 'awaiting_game') {
    const user = msg.from;
    console.log(user);
    bot.sendMessage(config.targetChatId, `Вам нове пропозицію від користувача ${user.username}: ${msg.text}`);
    bot.sendMessage(chatId, 'Вашу пропозицію було відправлено.');
    customData[chatId].waitingAwait = null;
  }

});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, botDescription, { parse_mode: "HTML", ...options });
});
/*
bot.on('message', (msg) => {
    const chatId = msg.chat.id;

    // Проверяем, не команда ли это (например, '/start')
    if (msg.text && /\/start/.test(msg.text)) {
        // Здесь может быть ваш код для обработки команды '/start'
        bot.sendMessage(chatId, botDescription , options);
        return; // Прекращаем дальнейшее выполнение функции
    }

    if (msg.photo && msg.photo.length > 0) {
        if (!customData[chatId]) {
            customData[chatId] = { texts: [], image: null };
        }

        bot.sendMessage(chatId, 'Подождите, идет обработка фото').then(() => {
            const fileId = msg.photo[msg.photo.length - 1].file_id; // Берем фотографию с наивысшим разрешением

            bot.getFileLink(fileId).then((link) => {
                // Здесь вызываем функцию для загрузки изображения на сервер
                uploadImageToServer(link, (imageUrl) => {
                    // Сохраняем URL изображения после загрузки
                    customData[chatId].image = imageUrl;
                    bot.sendMessage(chatId, 'Фотография загружена успешно. Теперь напишите текст 1.');
                });
            }).catch((error) => {
                console.error('Ошибка при получении ссылки на фото:', error);
                bot.sendMessage(chatId, 'Произошла ошибка при загрузке фотографии.');
            });
        });
    } else {
        // Обработка текстовых сообщений, если это не команда /start
        handleTextMessage(msg);
    }
});*/
