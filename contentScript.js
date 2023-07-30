// contentScript.js
function calculateHash(str, numericValue) {
  // Simple hash function (not cryptographically secure)
  let hash = numericValue;
  if (str.length === 0) return hash;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32-bit integer
  }
  return hash;
}

function applyHashAnnotation(numericValue, locationName) {
  const anchors = document.querySelectorAll(".post-title");
  anchors.forEach((anchor) => {
    const existingAnnotation = anchor.querySelector(".annotation");
    if (existingAnnotation) {
      existingAnnotation.remove();
    }

    const hash = calculateHash(anchor.innerText, numericValue);
    const hashTextNode = document.createTextNode(` [Hash: ${hash}]`);
    const annotationSpan = document.createElement("span");
    annotationSpan.classList.add("annotation");
    annotationSpan.appendChild(hashTextNode);

    // Append the location name to the annotation
    if (locationName) {
      const locationTextNode = document.createTextNode(` - ${locationName}`);
      annotationSpan.appendChild(locationTextNode);
    }

    anchor.appendChild(annotationSpan);

    // Set background color based on the hash value
    annotationSpan.style.backgroundColor = hash >= 0 ? "palegreen" : "pink";
  });
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message) => {
  applyHashAnnotation(message.numericValue, message.locationData?.name ?? null);
});

// Fetch the numeric value from storage on page load
chrome.storage.sync.get("numericValue", (data) => {
  if (data.numericValue) {
    applyHashAnnotation(data.numericValue, null); // Pass the numeric value to the annotation function
  }
});

// Send a message to the background script with the numeric value
chrome.storage.sync.get("numericValue", (data) => {
  if (data.numericValue) {
    chrome.runtime.sendMessage({ numericValue: data.numericValue });
  }
});

