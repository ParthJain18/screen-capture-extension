document.getElementById('start').addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'start' });
  document.getElementById('status').innerText = 'Status: Running';
});

document.getElementById('stop').addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'stop' });
  document.getElementById('status').innerText = 'Status: Stopped';
});

document.getElementById('view-screenshots').addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('screenshots.html') });
});