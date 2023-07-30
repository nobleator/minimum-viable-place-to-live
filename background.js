// background.js
function fetchLocationData(numericValue) {
  const apiUrl = `https://pokeapi.co/api/v2/location/${numericValue}/`;

  return fetch(apiUrl)
    .then((response) => response.json())
    .catch((error) => {
      console.error("Error fetching data:", error);
      return null;
    });
}

var allTabs = new Set();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // receives messages from both content script and popup
  if (sender?.tab?.id && !allTabs.has(sender.tab.id)) {
    allTabs.add(sender.tab.id);
  }

  if (message.numericValue) {
    const numericValue = message.numericValue;

    fetchLocationData(numericValue)
      .then((data) => {
        // Send the fetched data back to all registered content scripts
        allTabs.forEach(tabId => {
          chrome.tabs.sendMessage(tabId, { 
            locationData: data 
          });
        });
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
  }
});
