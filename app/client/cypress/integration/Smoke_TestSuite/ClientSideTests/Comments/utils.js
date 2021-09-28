export function setFlagForTour() {
  return new Promise((resolve) => {
    const request = indexedDB.open("Appsmith", 2); // had to use version: 2 here, TODO: check why
    request.onerror = function(event) {
      // eslint-disable-next-line no-console
      console.log("Error loading database", event);
    };
    request.onsuccess = function(event) {
      const db = request.result;
      const transaction = db.transaction("keyvaluepairs", "readwrite");
      const objectStore = transaction.objectStore("keyvaluepairs");
      objectStore.put(true, "CommentsIntroSeen");
      resolve();
    };
  });
}

export function typeIntoDraftEditor(selector, text) {
  cy.get(selector).then((input) => {
    var textarea = input.get(0);
    textarea.dispatchEvent(new Event("focus"));

    var textEvent = document.createEvent("TextEvent");
    textEvent.initTextEvent("textInput", true, true, null, text);
    textarea.dispatchEvent(textEvent);

    textarea.dispatchEvent(new Event("blur"));
  });
}
