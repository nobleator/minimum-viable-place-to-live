// popup.js
document.addEventListener("DOMContentLoaded", () => {
  const numericInput = document.getElementById("numericInput");
  const applyButton = document.getElementById("applyButton");

  // Get the stored numeric value and set the input field value
  browser.storage.sync.get("numericValue").then((data) => {
    if (data.numericValue) {
      numericInput.value = data.numericValue;
    }
  });

  applyButton.addEventListener("click", () => {
    const numericValue = parseInt(numericInput.value, 10);
    // Store the numeric value for persistence
    browser.storage.sync.set({ numericValue: numericValue });
    chrome.runtime.sendMessage({ numericValue: numericValue });
  });
});
