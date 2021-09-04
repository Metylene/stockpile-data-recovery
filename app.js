let canvasElt = document.getElementById('canvas');
let context = canvasElt.getContext('2d');
let canvasW, canvasH;

let stockpileNameH = 31;

let base_image = new Image();
base_image.onload = function () {
    canvasW = canvasElt.width = base_image.width;
    canvasH = canvasElt.height = base_image.height;
    context.drawImage(base_image, 0, 0);
    loadScreenshot();
}
base_image.src = 'screenshots/2.png';

document.getElementById('clipStockpile').onclick = loadScreenshot;
document.getElementById('clipStockpilesContent').onclick = clipStockpilesContent;

function loadScreenshot() {
    const imgData = context.getImageData(0, 0, canvasW, canvasH);
    const data = imgData.data;
    clipStockpile(data);
    loadItemsImages();
}

function loadItemsImages() {
    let rootPathname = window.location.pathname;
    let xhr = new XMLHttpRequest();
    xhr.open("GET", window.location.pathname + "items", true);
    xhr.responseType = 'document';
    xhr.onload = () => {
        if (xhr.status === 200) {
            let elements = xhr.response.getElementsByTagName("a");
            for (x of elements) {
                if (x.href.match(/\.(jpe?g|png|gif)$/)) {
                    let img = document.createElement("img");
                    img.src = x.href.replace(x.pathname, rootPathname.slice(0, -1) + x.pathname);
                    document.getElementById('itemsIcon').appendChild(img);
                }
            };
        }
        else {
            console.log('Request failed. Returned status of ' + xhr.status);
        }
    }
    xhr.send();
    let xhr2 = new XMLHttpRequest();
    xhr2.open("GET", window.location.pathname + "numbers", true);
    xhr2.responseType = 'document';
    xhr2.onload = () => {
        if (xhr2.status === 200) {
            let elements = xhr2.response.getElementsByTagName("a");
            for (x of elements) {
                if (x.href.match(/\.(jpe?g|png|gif)$/)) {
                    let img = document.createElement("img");
                    img.src = x.href.replace(x.pathname, rootPathname.slice(0, -1) + x.pathname);
                    console.log(x.pathname, rootPathname);
                    document.getElementById('itemsNumber').appendChild(img);
                }
            };
        }
        else {
            console.log('Request failed. Returned status of ' + xhr2.status);
        }
    }
    xhr2.send();
}

function clipStockpile(data) {
    let pos = findStockpileCorner(data);
    if (!pos.valid) {
        return;
    }

    // context.fillStyle = "rgba(0,255,0,255)";
    // context.fillRect(pos.x, pos.y, 1, 1);

    let stockpileHeight = findStockpileHeight(data, pos.x, pos.y);

    let img = clipImageFromCanvas(canvasElt, pos.x, pos.y - stockpileNameH, 389, stockpileHeight + stockpileNameH);
    document.getElementById('stockpiles').append(img);

}

function xyIsBlackPixel(data, x, y) {
    let start = (y * canvasW + x) * 4;
    let r = data[start + 0];
    let g = data[start + 1];
    let b = data[start + 2];
    return (r <= 40 && g <= 40 && b <= 40);
}

function xyIsThisColorPixel(data, x, y, width, color) {
    let start = (y * width + x) * 4;
    let r = data[start + 0];
    let g = data[start + 1];
    let b = data[start + 2];
    let deltaR = Math.abs(color.r - r);
    let deltaG = Math.abs(color.g - g);
    let deltaB = Math.abs(color.b - b);
    return (deltaR < 5 && deltaG < 5 && deltaB < 5);
}

function findStockpileCorner(data) {
    for (let y = 0; y < canvasH; y++) {
        for (let x = 0; x < canvasW; x++) {
            if (xyIsBlackPixel(data, x, y)) {
                let isInLineOfBlackPixel = true;
                for (let i = 0; i < 297; i++) {
                    if (!xyIsBlackPixel(data, x + i, y)) {
                        isInLineOfBlackPixel = false;
                        break;
                    }
                }
                let isInRowOfBlackPixel = true;
                for (let i = 0; i < 44; i++) {
                    if (!xyIsBlackPixel(data, x, y + i)) {
                        isInRowOfBlackPixel = false;
                        break;
                    }
                }
                if (isInLineOfBlackPixel && isInRowOfBlackPixel) {
                    return ({
                        x: x,
                        y: y,
                        valid: true
                    });
                }
            }
        }
    }
    return ({
        x: -1,
        y: -1,
        valid: false
    });
}

function findStockpileHeight(data, x, y) {
    let yBottom = y;
    let bottomFounded = false
    while (yBottom <= canvasH && !bottomFounded) {
        yBottom++;
        let nextBlackPixelsCount = 0;
        if (!xyIsBlackPixel(data, x, yBottom)) {
            let nextY = 0;
            while (nextY < 45 && nextBlackPixelsCount < 30) {
                nextY++;
                if (yBottom + nextY > canvasH) { break; }
                if (xyIsBlackPixel(data, x, yBottom + nextY)) {
                    nextBlackPixelsCount++;
                }
            }
            if (nextBlackPixelsCount < 30) {
                bottomFounded = true;
            }
        }
    }
    return yBottom - y;
}

// stockpiles content \/
function clipStockpilesContent() {
    let stockpileImgElt = document.getElementById('stockpiles').children[0];
    if (stockpileImgElt == null) {
        console.log("Didn't find any stockpile screenshot to parse");
        return;
    }
    let tempCanvas = document.createElement('canvas');
    tempCanvas.width = stockpileImgElt.width;
    tempCanvas.height = stockpileImgElt.height;
    let tempContex = tempCanvas.getContext('2d');
    tempContex.drawImage(stockpileImgElt, 0, 0);
    // Todo remove next line
    // document.getElementById('stockpilesContent').append(tempCanvas);
    let pos = ({
        x: -1,
        y: -1,
        valid: true
    });
    while (pos.valid) {
        let data = tempContex.getImageData(0, 0, tempCanvas.width, tempCanvas.height).data;
        pos = findNexItemNumbCorner(data, tempCanvas);
        if (pos.valid) {
            tempContex.fillStyle = "rgba(0,255,0,255)";

            let div = document.createElement("div");

            let itemIconImg = clipImageFromCanvas(tempCanvas, pos.x - 50, pos.y, 50, 31);
            div.append(itemIconImg);
            tempContex.fillRect(pos.x - 50, pos.y, 50, 31);

            let itemNumberImg = clipImageFromCanvas(tempCanvas, pos.x, pos.y, 41, 31);
            div.append(itemNumberImg);
            tempContex.fillRect(pos.x, pos.y, 41, 31);

            document.getElementById('stockpilesContent').append(div);
        }
    }
}

// from https://gist.github.com/ahgood/bfc57a7f44d6ab7803f3ee2ec0abb980
function getBase64Image(img) {
    let canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    let ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    let dataURL = canvas.toDataURL("image/png");
    return dataURL.replace(/^data:image\/(png|jpg);base64,/, "");
}

function findNexItemNumbCorner(data, canvas) {
    let bgColor = { r: 98, g: 98, b: 98 };
    for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
            if (xyIsThisColorPixel(data, x, y, canvas.width, bgColor)) {
                // let context = canvas.getContext('2d');
                // context.fillStyle = "rgba(0,255,0,255)";
                // context.fillRect(x, y, 1, 1);

                let isInLineOfBgColorPixel = true;
                for (let i = 0; i < 41; i++) {
                    if (!xyIsThisColorPixel(data, x + i, y, canvas.width, bgColor)) {
                        isInLineOfBgColorPixel = false;
                        break;
                    }
                }
                let isInRowOfBgColorPixel = true;
                for (let i = 0; i < 31; i++) {
                    if (!xyIsThisColorPixel(data, x, y + i, canvas.width, bgColor)) {
                        isInRowOfBgColorPixel = false;
                        break;
                    }
                }
                if (isInLineOfBgColorPixel && isInRowOfBgColorPixel) {
                    return ({
                        x: x,
                        y: y,
                        valid: true
                    });
                }
            }
        }
    }
    return ({
        x: -1,
        y: -1,
        valid: false
    });
}

function saveIcons() {
    let zip = new JSZip();
    let imageElts = document.getElementById("stockpilesContent").children;
    for (let i = 0; i < imageElts.length; i++) {
        const itemElt = imageElts[i];

        let img = getBase64Image(itemElt);
        zip.file("output_" + i + ".png", img, { base64: true });

    }
    zip.generateAsync({ type: "blob" })
        .then(function (blob) {
            // see FileSaver.js
            saveAs(blob, "itemImages.zip");
        });
}

function clipImageFromCanvas(canvas, x, y, w, h) {
    let tempCanvas = document.createElement('canvas');
    let tempContex = tempCanvas.getContext('2d');
    tempCanvas.width = w;
    tempCanvas.height = h;
    tempContex.drawImage(canvas, x, y, w, h, 0, 0, w, h);
    let img = new Image(w, h);
    img.src = tempCanvas.toDataURL();
    return img;
}

function recognizeItems() {
    let itemElts = document.getElementById("stockpilesContent").children;
    for (let i = 0; i < itemElts.length; i++) {
        const itemElt = itemElts[i];

        const itemIcon = itemElt.children[0];
        let iconMatch = findMatch(itemIcon, 'icon');
        itemElt.appendChild(iconMatch.cloneNode());

        const itemNumber = itemElt.children[1];
        let numberMatch = findMatch(itemNumber, 'number');
        itemElt.appendChild(numberMatch.cloneNode());
    }
}

function findMatch(img, type) {
    let bestMatchElt;
    let minDiffPixels = Infinity;
    let surveyArray;
    if (type === 'icon') {
        surveyArray = document.getElementById('itemsIcon').children;
    } else if (type === 'number') {
        surveyArray = document.getElementById('itemsNumber').children;
    }
    for (let i = 0; i < surveyArray.length; i++) {
        const surveyImg = surveyArray[i];

        let numDiffPixels = pixelmatch(getImageData(img), getImageData(surveyImg), null, img.width, img.height, { threshold: 0 });

        if (numDiffPixels < minDiffPixels) {
            minDiffPixels = numDiffPixels;
            bestMatchElt = surveyImg;
        }
        if (minDiffPixels == 0) {

            break;
        };
    }
    img.parentElement.append(document.createElement('span').innerText = minDiffPixels);
    return bestMatchElt;
}

function getImageData(img) {
    let canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    let ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    return ctx.getImageData(0, 0, canvas.width, canvas.height).data;
}