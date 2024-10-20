const DB_NAME = 'screenshotDB';
const DB_VERSION = 1;
const STORE_NAME = 'screenshots';
const CAPTURE_INTERVAL = 5000; // 5 seconds

let intervalId = null;

function takeScreenshot() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];

        if (tabs.length > 0) {
            if (activeTab.url.startsWith("chrome://") || activeTab.url.startsWith("https://chrome.google.com/webstore")) {
                console.log("Restricted tab, skipping screenshot.");
                return;
            }

            chrome.tabs.captureVisibleTab(activeTab.windowId, { format: "png" }, (imageData) => {
                if (chrome.runtime.lastError) {
                    console.error("Screenshot capture failed:", chrome.runtime.lastError.message);
                    return;
                }
                saveScreenshot(imageData);
            });
        } else {
            console.error('No active tab found');
        }
    });
}


function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        };

        request.onsuccess = (event) => {
            resolve(event.target.result);
        };

        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

async function saveScreenshot(imageData, metadata = {}) {
    const db = await openDatabase();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const screenshot = {
        imageData: imageData,
        timestamp: Date.now(),
        ...metadata
    };

    store.add(screenshot);

    transaction.oncomplete = () => {
        console.log('Screenshot saved successfully');
    };

    transaction.onerror = (event) => {
        console.error('Error saving screenshot:', event.target.error);
    };
}

async function getScreenshots(query) {
    const db = await openDatabase();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
        const request = store.getAll();

        request.onsuccess = (event) => {
            const results = event.target.result.filter(screenshot => {
                return Object.keys(query).every(key => screenshot[key] === query[key]);
            });
            resolve(results);
        };

        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'start') {
        if (!intervalId) {
            console.log("Starting");
            intervalId = setInterval(takeScreenshot, CAPTURE_INTERVAL);
        }
    } else if (message.action === 'stop') {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
    } else if (message.action === 'getScreenshots') {
        getScreenshots(message.query).then(sendResponse).catch(error => {
            console.error('Error fetching screenshots:', error);
            sendResponse([]);
        });
        return true;
    }
});