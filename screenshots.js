document.addEventListener('DOMContentLoaded', async () => {
  const query = {}; // Adjust the query if needed
  const screenshots = await chrome.runtime.sendMessage({ action: 'getScreenshots', query });
  const screenshotsContainer = document.getElementById('screenshots');
  screenshotsContainer.innerHTML = '';

  screenshots.forEach(screenshot => {
    const img = document.createElement('img');
    img.src = screenshot.imageData;
    img.alt = `Screenshot taken at ${new Date(screenshot.timestamp).toLocaleString()}`;
    img.style.width = '100%'; // Adjust the style as needed
    screenshotsContainer.appendChild(img);
  });
});