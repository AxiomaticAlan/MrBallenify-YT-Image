var images = [];
var maxNumber = 38;
var blacklistStatus
var overlayStatus
var intervalId

var button = document.createElement("button");
button.innerHTML = "Toggle Image Overlay";
button.style.position = "fixed";
button.style.top = "60px";
button.style.right = "10px";
button.style.zIndex = "9999";

document.body.appendChild(button)

for (var i = 1; i <= maxNumber; i++) {
    images.push("MrBallen" + i + ".png");
}

var imagesPath = "yt-images/";

function getRandomImageURL(index) {
    return chrome.runtime.getURL(`${imagesPath}${images[index]}`);
}
async function checkImageExistence(index) {
    const testedURL = getRandomImageURL(index)
    return fetch(testedURL)
        .then(() => {
            return true
        }).catch(error => {
            return false
        })
}
function applyOverlay(thumbnailElement, overlayImageURL) {
    const overlayImage = document.createElement("img");
    overlayImage.src = overlayImageURL;
    overlayImage.style.position = "absolute";
    overlayImage.style.top = overlayImage.style.left = "0%";
    overlayImage.style.width = "100%";
    overlayImage.style.zIndex = "0";
    thumbnailElement.parentElement.insertBefore(overlayImage, thumbnailElement.nextSibling);
};
function FindThumbnails() {
    var thumbnailImages = document.querySelectorAll("ytd-thumbnail:not(.ytd-video-preview, .ytd-rich-grid-slim-media) a > yt-image > img.yt-core-image:only-child:not(.yt-core-attributed-string__image-element)");
    var notificationImages = document.querySelectorAll('img.style-scope.yt-img-shadow[width="86"]');
    const targetAspectRatio = [16 / 9, 4 / 3];
    const errorMargin = 0.02;
    const allImages = [
        ...Array.from(thumbnailImages),
        ...Array.from(notificationImages),
    ];
    var listAllThumbnails = allImages.filter(image => {
        if (image.height === 0) {
            return false;
        }
        const aspectRatio = image.width / image.height;
        let isCorrectAspectRatio = (Math.abs(aspectRatio - targetAspectRatio[0]) < errorMargin) || (Math.abs(aspectRatio - targetAspectRatio[1]) < errorMargin);
        return isCorrectAspectRatio;
    });
    var videowallImages = document.querySelectorAll(".ytp-videowall-still-image:not([style*='extension:'])");
    listAllThumbnails = listAllThumbnails.concat(Array.from(videowallImages));
    return listAllThumbnails.filter(image => {
        const parent = image.parentElement;
        const isVideoPreview = parent.closest("#video-preview") !== null || parent.tagName == "YTD-MOVING-THUMBNAIL-RENDERER"
        const isChapter = parent.closest("#endpoint") !== null
        const processed = Array.from(parent.children).filter(child => {
            return (
                child.src &&
                child.src.includes("extension") ||
                isVideoPreview || isChapter)
        });
        return processed.length == 0;
    });
}
const size_of_non_repeat = 8
const last_indexes = Array(size_of_non_repeat)
function getRandomImageFromDirectory() {
    let randomIndex = -1
    while (last_indexes.includes(randomIndex) || randomIndex < 0) {
        randomIndex = Math.floor(Math.random() * highestImageIndex) + 1;
    }
    last_indexes.shift()
    last_indexes.push(randomIndex)
    return randomIndex
}
function applyOverlayToThumbnails() {
    thumbnailElements = FindThumbnails()
    thumbnailElements.forEach((thumbnailElement) => {
        let loops = Math.random() > 0.001 ? 1 : 20;
        for (let i = 0; i < loops; i++) {
            const overlayImageIndex = getRandomImageFromDirectory();
            overlayImageURL = getRandomImageURL(overlayImageIndex);
            applyOverlay(thumbnailElement, overlayImageURL);
        }
    });
}
var highestImageIndex;
async function getHighestImageIndex() {
    let i = 38;
    while (await checkImageExistence(i)) {
        i *= 2;
    }
    let min = i <= 4 ? 1 : i / 2;
    let max = i;
    while (min <= max) {
        let mid = Math.floor((min + max) / 2);
        if (await checkImageExistence(mid)) {
            min = mid + 1;
        } else {
            max = mid - 1;
        }
    }
    highestImageIndex = max;
}
button.addEventListener("click", function () {
    overlayStatus = !overlayStatus;
    this.innerHTML = overlayStatus ? "Turn Off Image Overlay" : "Toggle Image Overlay";
    if (overlayStatus) {
        getHighestImageIndex()
            .then(() => {
                intervalId = setInterval(applyOverlayToThumbnails, 1000);
            });
    } else {
        var overlays = document.querySelectorAll("img[src*='yt-images/MrBallen']");
        clearInterval(intervalId);
        overlays.forEach(function (overlay) {
            overlay.remove();
        });
    }
});