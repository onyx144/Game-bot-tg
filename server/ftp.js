const ftp = require("basic-ftp");

async function uploadFileToFTP(Local , Remote) {
    const client = new ftp.Client();
    client.ftp.verbose = true; // Включите для вывода подробной информации о каждом шаге.
    try {
        await client.access({
            host: env.Host,
            user: env.User,
            password: env.Password,
            secure: true 
        });
        await client.uploadFrom(Local , Remote);
        console.log("Файл успешно загружен");
    }
    catch(err) {
        console.error("Ошибка при загрузке файла:", err);
        throw err;
    }
    finally {
        client.close();
    }
    client.close();
}

module.exports =  uploadFileToFTP ;