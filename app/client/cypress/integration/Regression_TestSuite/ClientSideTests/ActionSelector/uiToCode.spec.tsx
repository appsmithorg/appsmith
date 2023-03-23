import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const {
  AggregateHelper,
  ApiPage,
  CommonLocators,
  EntityExplorer,
  JSEditor,
  PropertyPane,
} = ObjectsRegistry;

describe("UI to Code", () => {
  before(() => {
    cy.fixture("buttondsl").then((val: any) => {
      AggregateHelper.AddDsl(val);
    });
    ApiPage.CreateApi("Api1", "GET");
    ApiPage.CreateApi("Api2", "POST");
  });

  beforeEach(() => {
    EntityExplorer.SelectEntityByName("Button1", "Widgets");
    cy.get(CommonLocators._jsToggle("onclick")).click();
    PropertyPane.UpdatePropertyFieldValue("onClick", "");
    cy.get(CommonLocators._jsToggle("onclick")).click();
  });

  it("adds an action", () => {
    PropertyPane.AddAction("onClick");
    cy.get(CommonLocators._dropDownValue("Show Alert")).click();
    AggregateHelper.TypeText(
      CommonLocators._actionSelectorFieldByLabel("Message"),
      "Hello!",
    );
    cy.get(`${CommonLocators._actionSelectorPopup} .t--close`).click();
    cy.get(CommonLocators._jsToggle("onclick")).click();
    PropertyPane.ValidatePropertyFieldValue(
      "onClick",
      `{{showAlert('Hello!', '');}}`,
    );
    cy.get(CommonLocators._jsToggle("onclick")).click();
  });

  it("adds multiple actions", () => {
    // Add first action
    PropertyPane.AddAction("onClick");
    cy.get(CommonLocators._dropDownValue("Show Alert")).click();
    AggregateHelper.TypeText(
      CommonLocators._actionSelectorFieldByLabel("Message"),
      "Hello!",
    );
    cy.get(`${CommonLocators._actionSelectorPopup} .t--close`).click();

    // Add second action
    PropertyPane.AddAction("onClick");
    cy.get(CommonLocators._dropDownValue("Navigate to")).click();
    cy.get(CommonLocators._openNavigationTab("url")).click();
    AggregateHelper.TypeText(
      CommonLocators._actionSelectorFieldByLabel("Enter URL"),
      "https://google.com",
    );
    cy.get(`${CommonLocators._actionSelectorPopup} .t--close`).click();
    cy.get(CommonLocators._jsToggle("onclick")).click();
    PropertyPane.ValidatePropertyFieldValue(
      "onClick",
      `{{showAlert('Hello!', '');navigateTo('https://google.com', {}, 'SAME_WINDOW');}}`,
    );
    cy.get(CommonLocators._jsToggle("onclick")).click();

    // Add third action
    PropertyPane.AddAction("onClick");
    cy.get(CommonLocators._dropDownValue("Store value")).click();
    AggregateHelper.TypeText(
      CommonLocators._actionSelectorFieldByLabel("Key"),
      "secret-key",
    );
    AggregateHelper.TypeText(
      CommonLocators._actionSelectorFieldByLabel("Value"),
      "secret-value",
    );
    cy.get(`${CommonLocators._actionSelectorPopup} .t--close`).click();

    // Add fourth action
    PropertyPane.AddAction("onClick");
    cy.get(CommonLocators._dropDownValue("Copy to clipboard")).click();
    AggregateHelper.TypeText(
      CommonLocators._actionSelectorFieldByLabel(
        "Text to be copied to clipboard",
      ),
      "text to copy",
    );
    cy.get(`${CommonLocators._actionSelectorPopup} .t--close`).click();

    // Validate the code
    cy.get(CommonLocators._jsToggle("onclick")).click();
    PropertyPane.ValidatePropertyFieldValue(
      "onClick",
      `{{showAlert('Hello!', '');navigateTo('https://google.com', {}, 'SAME_WINDOW');storeValue('secret-key', 'secret-value');copyToClipboard('text to copy');}}`,
    );
    cy.get(CommonLocators._jsToggle("onclick")).click();

    // Delete the third action
    cy.get(CommonLocators._actionCardByTitle("Store value")).click();
    cy.get(`${CommonLocators._actionSelectorPopup} .t--delete`).click();

    // Assert that cards 1, 2 and 4 are present
    cy.get(CommonLocators._actionCardByTitle("Show Alert")).should("exist");
    cy.get(CommonLocators._actionCardByTitle("Navigate to")).should("exist");
    cy.get(CommonLocators._actionCardByTitle("Copy to clipboard")).should(
      "exist",
    );

    // Assert the code for the remaining actions
    cy.get(CommonLocators._jsToggle("onclick")).click();
    PropertyPane.ValidatePropertyFieldValue(
      "onClick",
      `{{showAlert('Hello!', '');navigateTo('https://google.com', {}, 'SAME_WINDOW');copyToClipboard('text to copy');}}`,
    );
    cy.get(CommonLocators._jsToggle("onclick")).click();

    // Delete the first action
    cy.get(CommonLocators._actionCardByTitle("Show Alert")).click();
    cy.get(`${CommonLocators._actionSelectorPopup} .t--delete`).click();

    // Assert that cards 2 and 4 are present
    cy.get(CommonLocators._actionCardByTitle("Navigate to")).should("exist");
    cy.get(CommonLocators._actionCardByTitle("Copy to clipboard")).should(
      "exist",
    );

    // Assert the code for the remaining actions
    cy.get(CommonLocators._jsToggle("onclick")).click();
    PropertyPane.ValidatePropertyFieldValue(
      "onClick",
      `{{navigateTo('https://google.com', {}, 'SAME_WINDOW');copyToClipboard('text to copy');}}`,
    );
    cy.get(CommonLocators._jsToggle("onclick")).click();
  });

  it("works with undo using cmd+z", () => {
    // Add first action
    PropertyPane.AddAction("onClick");
    cy.get(CommonLocators._dropDownValue("Show Alert")).click();
    AggregateHelper.TypeText(
      CommonLocators._actionSelectorFieldByLabel("Message"),
      "Hello!",
    );
    cy.get(`${CommonLocators._actionSelectorPopup} .t--close`).click();

    // Add second action
    PropertyPane.AddAction("onClick");
    cy.get(CommonLocators._dropDownValue("Navigate to")).click();
    cy.get(CommonLocators._openNavigationTab("url")).click();
    AggregateHelper.TypeText(
      CommonLocators._actionSelectorFieldByLabel("Enter URL"),
      "https://google.com",
    );
    cy.get(`${CommonLocators._actionSelectorPopup} .t--close`).click();
    cy.get(CommonLocators._jsToggle("onclick")).click();
    PropertyPane.ValidatePropertyFieldValue(
      "onClick",
      `{{showAlert('Hello!', '');navigateTo('https://google.com', {}, 'SAME_WINDOW');}}`,
    );
    cy.get(CommonLocators._jsToggle("onclick")).click();

    // Add third action
    PropertyPane.AddAction("onClick");
    cy.get(CommonLocators._dropDownValue("Store value")).click();
    AggregateHelper.TypeText(
      CommonLocators._actionSelectorFieldByLabel("Key"),
      "secret-key",
    );
    AggregateHelper.TypeText(
      CommonLocators._actionSelectorFieldByLabel("Value"),
      "secret-value",
    );
    cy.get(`${CommonLocators._actionSelectorPopup} .t--close`).click();

    // Add fourth action
    PropertyPane.AddAction("onClick");
    cy.get(CommonLocators._dropDownValue("Copy to clipboard")).click();
    AggregateHelper.TypeText(
      CommonLocators._actionSelectorFieldByLabel(
        "Text to be copied to clipboard",
      ),
      "text to copy",
    );
    cy.get(`${CommonLocators._actionSelectorPopup} .t--close`).click();

    // Validate the code
    cy.get(CommonLocators._jsToggle("onclick")).click();
    PropertyPane.ValidatePropertyFieldValue(
      "onClick",
      `{{showAlert('Hello!', '');navigateTo('https://google.com', {}, 'SAME_WINDOW');storeValue('secret-key', 'secret-value');copyToClipboard('text to copy');}}`,
    );
    cy.get(CommonLocators._jsToggle("onclick")).click();

    // Delete the third action
    cy.get(CommonLocators._actionCardByTitle("Store value")).click();
    cy.get(`${CommonLocators._actionSelectorPopup} .t--delete`).click();

    // Delete the first action
    cy.get(CommonLocators._actionCardByTitle("Show Alert")).click();
    cy.get(`${CommonLocators._actionSelectorPopup} .t--delete`).click();

    // Assert that first and third action are not present
    cy.get(CommonLocators._actionCardByTitle("Show Alert")).should("not.exist");
    cy.get(CommonLocators._actionCardByTitle("Store value")).should(
      "not.exist",
    );

    // Undo the last two actions
    cy.get("body").type(AggregateHelper.isMac ? "{meta}Z" : "{ctrl}Z");

    cy.get("body").type(AggregateHelper.isMac ? "{meta}Z" : "{ctrl}Z");

    // Assert that all the cards are present
    cy.get(CommonLocators._actionCardByTitle("Show Alert")).should("exist");
    cy.get(CommonLocators._actionCardByTitle("Navigate to")).should("exist");
    cy.get(CommonLocators._actionCardByTitle("Store value")).should("exist");
    cy.get(CommonLocators._actionCardByTitle("Copy to clipboard")).should(
      "exist",
    );

    // Assert that code for all actions is back after undo actions
    cy.get(CommonLocators._jsToggle("onclick")).click();
    PropertyPane.ValidatePropertyFieldValue(
      "onClick",
      `{{showAlert('Hello!', '');navigateTo('https://google.com', {}, 'SAME_WINDOW');storeValue('secret-key', 'secret-value');copyToClipboard('text to copy');}}`,
    );
    cy.get(CommonLocators._jsToggle("onclick")).click();
  });

  it("works with redo using cmd+y", () => {
    // Add first action
    PropertyPane.AddAction("onClick");
    cy.get(CommonLocators._dropDownValue("Show Alert")).click();
    AggregateHelper.TypeText(
      CommonLocators._actionSelectorFieldByLabel("Message"),
      "Hello!",
    );
    cy.get(`${CommonLocators._actionSelectorPopup} .t--close`).click();

    // Add second action
    PropertyPane.AddAction("onClick");
    cy.get(CommonLocators._dropDownValue("Navigate to")).click();
    cy.get(CommonLocators._openNavigationTab("url")).click();
    AggregateHelper.TypeText(
      CommonLocators._actionSelectorFieldByLabel("Enter URL"),
      "https://google.com",
    );
    cy.get(`${CommonLocators._actionSelectorPopup} .t--close`).click();
    cy.get(CommonLocators._jsToggle("onclick")).click();
    PropertyPane.ValidatePropertyFieldValue(
      "onClick",
      `{{showAlert('Hello!', '');navigateTo('https://google.com', {}, 'SAME_WINDOW');}}`,
    );
    cy.get(CommonLocators._jsToggle("onclick")).click();

    // Add third action
    PropertyPane.AddAction("onClick");
    cy.get(CommonLocators._dropDownValue("Store value")).click();
    AggregateHelper.TypeText(
      CommonLocators._actionSelectorFieldByLabel("Key"),
      "secret-key",
    );
    AggregateHelper.TypeText(
      CommonLocators._actionSelectorFieldByLabel("Value"),
      "secret-value",
    );
    cy.get(`${CommonLocators._actionSelectorPopup} .t--close`).click();

    // Add fourth action
    PropertyPane.AddAction("onClick");
    cy.get(CommonLocators._dropDownValue("Copy to clipboard")).click();
    AggregateHelper.TypeText(
      CommonLocators._actionSelectorFieldByLabel(
        "Text to be copied to clipboard",
      ),
      "text to copy",
    );
    cy.get(`${CommonLocators._actionSelectorPopup} .t--close`).click();

    // Validate the code
    cy.get(CommonLocators._jsToggle("onclick")).click();
    PropertyPane.ValidatePropertyFieldValue(
      "onClick",
      `{{showAlert('Hello!', '');navigateTo('https://google.com', {}, 'SAME_WINDOW');storeValue('secret-key', 'secret-value');copyToClipboard('text to copy');}}`,
    );
    cy.get(CommonLocators._jsToggle("onclick")).click();

    // Delete the third action
    cy.get(CommonLocators._actionCardByTitle("Store value")).click();
    cy.get(`${CommonLocators._actionSelectorPopup} .t--delete`).click();

    // Delete the first action
    cy.get(CommonLocators._actionCardByTitle("Show Alert")).click();
    cy.get(`${CommonLocators._actionSelectorPopup} .t--delete`).click();

    // Assert that first and third action are not present
    cy.get(CommonLocators._actionCardByTitle("Show Alert")).should("not.exist");
    cy.get(CommonLocators._actionCardByTitle("Store value")).should(
      "not.exist",
    );

    // Undo the last two actions
    cy.get("body").type(AggregateHelper.isMac ? "{meta}Z" : "{ctrl}Z");

    cy.get("body").type(AggregateHelper.isMac ? "{meta}Z" : "{ctrl}Z");

    // Assert that all the cards are present
    cy.get(CommonLocators._actionCardByTitle("Show Alert")).should("exist");
    cy.get(CommonLocators._actionCardByTitle("Navigate to")).should("exist");
    cy.get(CommonLocators._actionCardByTitle("Store value")).should("exist");
    cy.get(CommonLocators._actionCardByTitle("Copy to clipboard")).should(
      "exist",
    );

    // Redo the last two undo actions
    cy.get("body").type(AggregateHelper.isMac ? "{meta}Y" : "{ctrl}Y");

    cy.get("body").type(AggregateHelper.isMac ? "{meta}Y" : "{ctrl}Y");

    // Assert that code for first and third action is gone
    cy.get(CommonLocators._jsToggle("onclick")).click();
    PropertyPane.ValidatePropertyFieldValue(
      "onClick",
      `{{navigateTo('https://google.com', {}, 'SAME_WINDOW');copyToClipboard('text to copy');}}`,
    );
    cy.get(CommonLocators._jsToggle("onclick")).click();
  });

  it("can add success and error callbacks", () => {
    PropertyPane.AddAction("onClick");
    cy.get(CommonLocators._dropDownValue("Show Alert")).click();
    AggregateHelper.TypeText(
      CommonLocators._actionSelectorFieldByLabel("Message"),
      "Hello!",
    );
    cy.get(`${CommonLocators._actionSelectorPopup} .t--close`).click();

    cy.get(CommonLocators._actionCardByTitle("Show Alert")).click();

    cy.get(CommonLocators._actionCallbacks).click();

    // add a success callback
    cy.get(CommonLocators._actionAddCallback("success")).click().wait(500);
    cy.get(CommonLocators._dropDownValue("Store value")).click().wait(500);

    // add an error callback
    cy.get(CommonLocators._actionAddCallback("failure")).click().wait(500);
    cy.get(CommonLocators._dropDownValue("Navigate to")).click().wait(500);

    cy.get(CommonLocators._jsToggle("onclick")).click();
    PropertyPane.ValidatePropertyFieldValue(
      "onClick",
      `{{showAlert('Hello!', '').then(() => {  storeValue("", "");}).catch(() => {  navigateTo("", {}, 'SAME_WINDOW');});}}`,
    );
    cy.get(CommonLocators._jsToggle("onclick")).click();
  });

  it("updates the success and failure callbacks for nested query actions", () => {
    cy.get(CommonLocators._jsToggle("onclick")).click();
    PropertyPane.UpdatePropertyFieldValue(
      "onClick",
      `{{Api1.run().then(() => {
      Api2.run().then(() => { showAlert("Hello") }).catch(() => { showAlert("World") });
     })}}`,
    );
    cy.get(CommonLocators._jsToggle("onclick")).click();

    // Select the card to show the callback button
    cy.get(CommonLocators._actionCardByValue("Api1.run")).click();
    cy.get(`${CommonLocators._actionSelectorPopup} .t--close`).click();

    // Click on the callback button
    cy.get(CommonLocators._actionCallbacks).click();

    // Edit the success callback of the nested Api2.run
    cy.get(CommonLocators._actionCardByValue("Api2.run")).click();
    cy.get(
      JSEditor._lineinPropertyPaneJsEditor(
        2,
        CommonLocators._actionSelectorFieldContentByLabel("Callback function"),
      ),
    ).type("eeee");

    // Edit the failure callback of the nested Api2.run
    cy.get(CommonLocators._openNavigationTab("onFailure")).click();
    cy.get(
      JSEditor._lineinPropertyPaneJsEditor(
        2,
        CommonLocators._actionSelectorFieldContentByLabel("Callback function"),
      ),
    ).type("oooo");

    cy.get(`${CommonLocators._actionSelectorPopup} .t--close`).click();

    cy.get(CommonLocators._jsToggle("onclick")).click();
    PropertyPane.ValidatePropertyFieldValue(
      "onClick",
      `{{Api1.run().then(() => {  Api2.run().then(() => {    showAlert("Heeeeello");  }).catch(() => {    showAlert("Wooooorld");  });}).catch(() => {});}}`,
    );
    cy.get(CommonLocators._jsToggle("onclick")).click();
  });

  it("updates the query params correctly", () => {
    cy.get(CommonLocators._jsToggle("onclick")).click();
    PropertyPane.UpdatePropertyFieldValue(
      "onClick",
      `{{Api1.run().then(() => {
      Api2.run().then(() => { showAlert("Hello") }).catch(() => { showAlert("World") });
     })}}`,
    );
    cy.get(CommonLocators._jsToggle("onclick")).click();

    // Select the card to show the callback button
    cy.get(CommonLocators._actionCardByValue("Api1.run")).click();
    cy.get(`${CommonLocators._actionSelectorPopup} .t--close`).click();

    // Click on the callback button
    cy.get(CommonLocators._actionCallbacks).click();

    // Edit the success callback of the nested Api2.run
    cy.get(CommonLocators._actionCardByValue("Api2.run")).click();
    cy.get(
      JSEditor._lineinPropertyPaneJsEditor(
        2,
        CommonLocators._actionSelectorFieldContentByLabel("Params"),
      ),
    ).type("val: 1");

    cy.get(`${CommonLocators._actionSelectorPopup} .t--close`).click();

    cy.get(CommonLocators._jsToggle("onclick")).click();
    PropertyPane.ValidatePropertyFieldValue(
      "onClick",
      `{{Api1.run().then(() => {  Api2.run({    val: 1    // "key": "value",  }).then(() => {    showAlert("Hello");  }).catch(() => {    showAlert("World");  });}).catch(() => {});}}`,
    );
    cy.get(CommonLocators._jsToggle("onclick")).click();
  });

  it("adds actions to callback function is argument if exists already", () => {
    cy.get(CommonLocators._jsToggle("onclick")).click();
    PropertyPane.UpdatePropertyFieldValue(
      "onClick",
      `Api1.run(() => {
        showAlert("Hello");
       })
       `,
    );
    cy.get(CommonLocators._jsToggle("onclick")).click();

    // Select the card to show the callback button
    cy.get(CommonLocators._actionCardByValue("Api1.run")).click();
    cy.get(`${CommonLocators._actionSelectorPopup} .t--close`).click();

    // Click on the callback button
    cy.get(CommonLocators._actionCallbacks).click();
    cy.get(CommonLocators._actionAddCallback("success")).click();
    cy.get(CommonLocators._dropDownValue("Store value")).click().wait(500);

    cy.get(CommonLocators._jsToggle("onclick")).click();
    PropertyPane.ValidatePropertyFieldValue(
      "onClick",
      `{{Api1.run(() => {  showAlert("Hello");  storeValue("", "");}, () => {});}}`,
    );
    cy.get(CommonLocators._jsToggle("onclick")).click();
  });

  it("correctly configures a setInterval action", () => {
    PropertyPane.AddAction("onClick");
    cy.get(CommonLocators._dropDownValue("Set interval")).click();

    cy.get(
      JSEditor._lineinPropertyPaneJsEditor(
        2,
        CommonLocators._actionSelectorFieldContentByLabel("Callback function"),
      ),
    ).type("{enter}showAlert('Hello'){enter}//");

    AggregateHelper.TypeText(
      CommonLocators._actionSelectorFieldByLabel("Id"),
      "interval-id",
    );
    cy.get(`${CommonLocators._actionSelectorPopup} .t--close`).click();

    cy.get(CommonLocators._jsToggle("onclick")).click();
    PropertyPane.ValidatePropertyFieldValue(
      "onClick",
      `{{setInterval(() => {  // add c  showAlert(\'Hello\');  // ode here}, 5000, \'interval-id\');}}`,
    );
    cy.get(CommonLocators._jsToggle("onclick")).click();
  });
});
