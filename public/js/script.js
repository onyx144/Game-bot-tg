let movingImage = false;
const image = document.getElementById('image');
const message = document.getElementById('message');
const win = document.getElementById('win');
let counter = 0;
let vx = Math.random() < 0.5 ? -1 : 1;
let vy = Math.random() < 0.5 ? -1 : 1;
let = updateCollumns = true;
let speed = 10;
const messageReplacement = document.getElementById('message-replacement');
const replacementImageUrl = document.getElementById('brevno');
const failImageUrl = document.getElementById('image_fail');
let base = 1;
let fraps = 1;
let clickCounter = 0; 
let initialClick = false; 
const failLimit = parseInt(document.getElementById('fail_value').value, 10) - 1;
function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function checkClickCounter() {
    if (clickCounter > failLimit) {
        document.getElementById('fail').style.display = 'block';
        image.style.display = 'none';
        messageReplacement.style.display = 'none';
        replacementImageUrl.style.display = 'none';
        failImageUrl.style.display = 'none';
        win.style.display = 'none'; 
        return 0;
    }
}

function updatePosition() {
    if (!movingImage) return;
     if (fraps % 100 === 0) {
        vx = Math.random() < 0.5 ? -1 : 1;
        vy = Math.random() < 0.5 ? -1 : 1;
    }
    let rect = image.getBoundingClientRect();
    let newX = rect.left + vx * speed;
    let newY = rect.top + vy * speed;
    if (isMobile()) {
	 if (newX < 0 || newX + rect.width > window.innerWidth) {
        vx = -vx; // Изменяем направление движения на противоположное по горизонтали
        // Корректируем положение, чтобы изображение не "застревало" за пределами экрана
        newX = newX < 0 ? 0 : window.innerWidth - rect.width;
    }
    // Проверяем столкновение с верхним и нижним краями экрана
    if (newY < 0 || newY + rect.height > window.innerHeight) {
        vy = -vy; // Изменяем направление движения на противоположное по вертикали
        // Корректируем положение, чтобы изображение не "застревало" за пределами экрана
        newY = newY < 0 ? 0 : window.innerHeight - rect.height;
    }
    }
    else {	
    if (newX < 0 || newX + rect.width > window.innerWidth) {
        newX = newX < 0 ? window.innerWidth - rect.width : 0;
    }
    if (newY < 0 || newY + rect.height > window.innerHeight) {
        newY = newY < 0 ? window.innerHeight - rect.height : 0;
    }
    }
    image.style.left = `${newX}px`;
    image.style.top = `${newY}px`;
    fraps++;
    requestAnimationFrame(updatePosition);
}

function adjustSpeedAndDirection(x, y) {
	if (isMobile()) {
     return 0;
    }
	else {
    let rect = image.getBoundingClientRect();
    let centerX = rect.left + rect.width / 2;
    let centerY = rect.top + rect.height / 2;
    let distance = Math.sqrt(Math.pow(centerX - x, 2) + Math.pow(centerY - y, 2));

    speed = Math.min(10, 5 + 200 / distance);

    if (Math.random() < 0.1) {
        vx = Math.random() < 0.5 ? -1 : 1;
        vy = Math.random() < 0.5 ? -1 : 1;
    }
	}
}

document.addEventListener('mousemove', e => {
    if (movingImage) {
			if(!isMobile()) {
        adjustSpeedAndDirection(e.clientX, e.clientY);
			}
    }
});

document.addEventListener('mousedown', e => {
    checkClickCounter();
    clickCounter++;
   if (e.target === image) {
		base = 2;
        replaceImage();

    } if (base == 1) {
        startMove(e);
    }
    
    
});

document.addEventListener('mouseup', endMove);

document.addEventListener('touchmove', e => {
    if (movingImage) {
        let touch = e.touches[0];
		if(!isMobile()) {
        adjustSpeedAndDirection(touch.clientX, touch.clientY);
		}
    }
}, false);

document.addEventListener('touchstart', e => {
    checkClickCounter();
    if (e.target === image) {
		base = 2;
        replaceImage();

    } if (base == 1) {
        startMove(e);
    }
   
}, false);

document.addEventListener('touchend', endMove, false);

function startMove(e) {
    if (counter < 3 && clickCounter < failLimit ) {
        movingImage = true;
        image.style.display = 'block';
        message.style.display = 'none';
		if (updateCollumns) {
		updateCollumns = false;
		updatePosition();
		}
    }
}

function endMove() {
}
function replaceImage() {
	image.style.display = 'none';
    if (counter < 3) {
		if (counter == 2) {
			speed = speed * 2;
		}
        speed = speed + 7;
        let fontSize = 16;
        let imageSize = 50;
        replacementImageUrl.style.width = `${imageSize}px`;
        replacementImageUrl.style.height = `${imageSize}px`;
        messageReplacement.style.fontSize = `${fontSize}px`;
        messageReplacement.style.display = 'block';
        replacementImageUrl.style.display = 'block';
        counter++;
        const interval = setInterval(() => {
            fontSize++;
            imageSize += 3;
            messageReplacement.style.fontSize = `${fontSize}px`;
            replacementImageUrl.style.width = `${imageSize}px`;
            replacementImageUrl.style.height = `${imageSize}px`;
        }, 100);

        setTimeout(() => {
            clearInterval(interval);
            messageReplacement.style.display = 'none';
            replacementImageUrl.style.display = 'none';
			base = 1;
            image.style.display = 'block';
        }, 3000);
    } else {
        win.style.display = 'block';
        let imageSize = 10;
        speed = 3;
        image.style.width = `${imageSize}px`;
        image.style.height = `${imageSize}px`;
        image.style.display = 'block';
        const interval = setInterval(() => {
            imageSize += 10;
            image.style.width = `${imageSize}px`;
            image.style.height = `${imageSize}px`;
        }, 100);
        setTimeout(() => {
            clearInterval(interval);
        }, 10000);
    }
}
//image.addEventListener('mouseover', replaceImage);
