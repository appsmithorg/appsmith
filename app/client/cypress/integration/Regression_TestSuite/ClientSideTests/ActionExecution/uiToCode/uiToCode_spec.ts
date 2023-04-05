import * as _ from "../../../../../support/Objects/ObjectsCore";

describe("UI to Code", () => {
  before(() => {
    cy.fixture("buttondsl").then((val: any) => {
      _.agHelper.AddDsl(val);
    });
    _.apiPage.CreateApi("Api1", "GET");
    _.apiPage.CreateApi("Api2", "POST");
  });

  beforeEach(() => {
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");
    _.propPane.EnterJSContext("onClick", "");
    _.jsEditor.DisableJSContext("onClick");
  });

  it("1. adds an action", () => {
    _.propPane.SelectPlatformFunction("onClick", "Show Alert");
    _.agHelper.TypeText(
      _.locators._actionSelectorFieldByLabel("Message"),
      "Hello!",
    );
    cy.get(`${_.locators._actionSelectorPopup} .t--close`).click();
    cy.get(_.locators._jsToggle("onclick")).click();
    _.propPane.ValidatePropertyFieldValue(
      "onClick",
      `{{showAlert('Hello!', '');}}`,
    );
    cy.get(_.locators._jsToggle("onclick")).click();
  });

  it("2. adds multiple actions", () => {
    // Add first action
    _.propPane.SelectPlatformFunction("onClick", "Show Alert");
    _.agHelper.TypeText(
      _.locators._actionSelectorFieldByLabel("Message"),
      "Hello!",
    );
    cy.get(`${_.locators._actionSelectorPopup} .t--close`).click();

    // Add second action
    _.propPane.SelectPlatformFunction("onClick", "Navigate to");
    _.propPane.SelectActionByTitleAndValue("Navigate to", "Select page");
    cy.get(_.locators._openNavigationTab("url")).click();
    _.agHelper.TypeText(
      _.locators._actionSelectorFieldByLabel("Enter URL"),
      "https://google.com",
    );
    cy.get(`${_.locators._actionSelectorPopup} .t--close`).click();
    cy.get(_.locators._jsToggle("onclick")).click();
    _.propPane.ValidatePropertyFieldValue(
      "onClick",
      `{{showAlert('Hello!', '');navigateTo('https://google.com', {}, 'SAME_WINDOW');}}`,
    );
    cy.get(_.locators._jsToggle("onclick")).click();

    // Add third action
    _.propPane.SelectPlatformFunction("onClick", "Store value");
    _.agHelper.TypeText(
      _.locators._actionSelectorFieldByLabel("Key"),
      "secret-key",
    );
    _.agHelper.TypeText(
      _.locators._actionSelectorFieldByLabel("Value"),
      "secret-value",
    );
    cy.get(`${_.locators._actionSelectorPopup} .t--close`).click();

    // Add fourth action
    _.propPane.SelectPlatformFunction("onClick", "Copy to clipboard");
    _.agHelper.TypeText(
      _.locators._actionSelectorFieldByLabel("Text to be copied to clipboard"),
      "text to copy",
    );
    cy.get(`${_.locators._actionSelectorPopup} .t--close`).click();

    // Validate the code
    cy.get(_.locators._jsToggle("onclick")).click();
    _.propPane.ValidatePropertyFieldValue(
      "onClick",
      `{{showAlert('Hello!', '');navigateTo('https://google.com', {}, 'SAME_WINDOW');storeValue('secret-key', 'secret-value');copyToClipboard('text to copy');}}`,
    );
    cy.get(_.locators._jsToggle("onclick")).click();

    // Delete the third action
    cy.get(_.locators._actionCardByTitle("Store value")).click();
    cy.get(`${_.locators._actionSelectorPopup} .t--delete`).click();

    // Assert that cards 1, 2 and 4 are present
    _.agHelper.AssertElementExist(_.locators._actionCardByTitle("Show Alert"));
    _.agHelper.AssertElementExist(_.locators._actionCardByTitle("Navigate to"));
    _.agHelper.AssertElementExist(
      _.locators._actionCardByTitle("Copy to clipboard"),
    );

    // Assert the code for the remaining actions
    cy.get(_.locators._jsToggle("onclick")).click();
    _.propPane.ValidatePropertyFieldValue(
      "onClick",
      `{{showAlert('Hello!', '');navigateTo('https://google.com', {}, 'SAME_WINDOW');copyToClipboard('text to copy');}}`,
    );
    cy.get(_.locators._jsToggle("onclick")).click();

    // Delete the first action
    cy.get(_.locators._actionCardByTitle("Show Alert")).click();
    cy.get(`${_.locators._actionSelectorPopup} .t--delete`).click();

    // Assert that cards 2 and 4 are present
    _.agHelper.AssertElementExist(_.locators._actionCardByTitle("Navigate to"));
    _.agHelper.AssertElementExist(
      _.locators._actionCardByTitle("Copy to clipboard"),
    );

    // Assert the code for the remaining actions
    cy.get(_.locators._jsToggle("onclick")).click();
    _.propPane.ValidatePropertyFieldValue(
      "onClick",
      `{{navigateTo('https://google.com', {}, 'SAME_WINDOW');copyToClipboard('text to copy');}}`,
    );
    cy.get(_.locators._jsToggle("onclick")).click();
  });

  it("3. works with undo using cmd+z", () => {
    // Add first action
    _.propPane.SelectPlatformFunction("onClick", "Show Alert");
    _.agHelper.TypeText(
      _.locators._actionSelectorFieldByLabel("Message"),
      "Hello!",
    );
    cy.get(`${_.locators._actionSelectorPopup} .t--close`).click();

    // Add second action
    _.propPane.SelectPlatformFunction("onClick", "Navigate to");
    _.propPane.SelectActionByTitleAndValue("Navigate to", "Select page");
    cy.get(_.locators._openNavigationTab("url")).click();
    _.agHelper.TypeText(
      _.locators._actionSelectorFieldByLabel("Enter URL"),
      "https://google.com",
    );
    cy.get(`${_.locators._actionSelectorPopup} .t--close`).click();
    cy.get(_.locators._jsToggle("onclick")).click();
    _.propPane.ValidatePropertyFieldValue(
      "onClick",
      `{{showAlert('Hello!', '');navigateTo('https://google.com', {}, 'SAME_WINDOW');}}`,
    );
    cy.get(_.locators._jsToggle("onclick")).click();

    // Add third action
    _.propPane.SelectPlatformFunction("onClick", "Store value");
    _.agHelper.TypeText(
      _.locators._actionSelectorFieldByLabel("Key"),
      "secret-key",
    );
    _.agHelper.TypeText(
      _.locators._actionSelectorFieldByLabel("Value"),
      "secret-value",
    );
    cy.get(`${_.locators._actionSelectorPopup} .t--close`).click();

    // Add fourth action
    _.propPane.SelectPlatformFunction("onClick", "Copy to clipboard");
    _.agHelper.TypeText(
      _.locators._actionSelectorFieldByLabel("Text to be copied to clipboard"),
      "text to copy",
    );
    cy.get(`${_.locators._actionSelectorPopup} .t--close`).click();

    // Validate the code
    cy.get(_.locators._jsToggle("onclick")).click();
    _.propPane.ValidatePropertyFieldValue(
      "onClick",
      `{{showAlert('Hello!', '');navigateTo('https://google.com', {}, 'SAME_WINDOW');storeValue('secret-key', 'secret-value');copyToClipboard('text to copy');}}`,
    );
    cy.get(_.locators._jsToggle("onclick")).click();

    // Delete the third action
    cy.get(_.locators._actionCardByTitle("Store value")).click();
    cy.get(`${_.locators._actionSelectorPopup} .t--delete`).click();

    // Delete the first action
    cy.get(_.locators._actionCardByTitle("Show Alert")).click();
    cy.get(`${_.locators._actionSelectorPopup} .t--delete`).click();

    // Assert that first and third action are not present
    _.agHelper.AssertElementAbsence(
      _.locators._actionCardByTitle("Show Alert"),
    );
    _.agHelper.AssertElementAbsence(
      _.locators._actionCardByTitle("Store value"),
    );

    // Undo the last two actions
    cy.get("body").type(_.agHelper.isMac ? "{meta}Z" : "{ctrl}Z");

    cy.get("body").type(_.agHelper.isMac ? "{meta}Z" : "{ctrl}Z");

    // Assert that all the cards are present
    _.agHelper.AssertElementExist(_.locators._actionCardByTitle("Show Alert"));
    _.agHelper.AssertElementExist(_.locators._actionCardByTitle("Navigate to"));
    _.agHelper.AssertElementExist(_.locators._actionCardByTitle("Store value"));
    _.agHelper.AssertElementExist(
      _.locators._actionCardByTitle("Copy to clipboard"),
    );

    // Assert that code for all actions is back after undo actions
    cy.get(_.locators._jsToggle("onclick")).click();
    _.propPane.ValidatePropertyFieldValue(
      "onClick",
      `{{showAlert('Hello!', '');navigateTo('https://google.com', {}, 'SAME_WINDOW');storeValue('secret-key', 'secret-value');copyToClipboard('text to copy');}}`,
    );
    cy.get(_.locators._jsToggle("onclick")).click();
  });

  it("4. works with redo using cmd+y", () => {
    // Add first action
    _.propPane.SelectPlatformFunction("onClick", "Show Alert");
    _.agHelper.TypeText(
      _.locators._actionSelectorFieldByLabel("Message"),
      "Hello!",
    );
    cy.get(`${_.locators._actionSelectorPopup} .t--close`).click();

    // Add second action
    _.propPane.SelectPlatformFunction("onClick", "Navigate to");
    _.propPane.SelectActionByTitleAndValue("Navigate to", "Select page");
    cy.get(_.locators._openNavigationTab("url")).click();
    _.agHelper.TypeText(
      _.locators._actionSelectorFieldByLabel("Enter URL"),
      "https://google.com",
    );
    cy.get(`${_.locators._actionSelectorPopup} .t--close`).click();
    cy.get(_.locators._jsToggle("onclick")).click();
    _.propPane.ValidatePropertyFieldValue(
      "onClick",
      `{{showAlert('Hello!', '');navigateTo('https://google.com', {}, 'SAME_WINDOW');}}`,
    );
    cy.get(_.locators._jsToggle("onclick")).click();

    // Add third action
    _.propPane.SelectPlatformFunction("onClick", "Store value");
    _.agHelper.TypeText(
      _.locators._actionSelectorFieldByLabel("Key"),
      "secret-key",
    );
    _.agHelper.TypeText(
      _.locators._actionSelectorFieldByLabel("Value"),
      "secret-value",
    );
    cy.get(`${_.locators._actionSelectorPopup} .t--close`).click();

    // Add fourth action
    _.propPane.SelectPlatformFunction("onClick", "Copy to clipboard");
    _.agHelper.TypeText(
      _.locators._actionSelectorFieldByLabel("Text to be copied to clipboard"),
      "text to copy",
    );
    cy.get(`${_.locators._actionSelectorPopup} .t--close`).click();

    // Validate the code
    cy.get(_.locators._jsToggle("onclick")).click();
    _.propPane.ValidatePropertyFieldValue(
      "onClick",
      `{{showAlert('Hello!', '');navigateTo('https://google.com', {}, 'SAME_WINDOW');storeValue('secret-key', 'secret-value');copyToClipboard('text to copy');}}`,
    );
    cy.get(_.locators._jsToggle("onclick")).click();

    // Delete the third action
    cy.get(_.locators._actionCardByTitle("Store value")).click();
    cy.get(`${_.locators._actionSelectorPopup} .t--delete`).click();

    // Delete the first action
    cy.get(_.locators._actionCardByTitle("Show Alert")).click();
    cy.get(`${_.locators._actionSelectorPopup} .t--delete`).click();

    // Assert that first and third action are not present
    _.agHelper.AssertElementAbsence(
      _.locators._actionCardByTitle("Show Alert"),
    );
    _.agHelper.AssertElementAbsence(
      _.locators._actionCardByTitle("Store value"),
    );

    // Undo the last two actions
    cy.get("body").type(_.agHelper.isMac ? "{meta}Z" : "{ctrl}Z");

    cy.get("body").type(_.agHelper.isMac ? "{meta}Z" : "{ctrl}Z");

    // Assert that all the cards are present
    _.agHelper.AssertElementExist(_.locators._actionCardByTitle("Show Alert"));
    _.agHelper.AssertElementExist(_.locators._actionCardByTitle("Navigate to"));
    _.agHelper.AssertElementExist(_.locators._actionCardByTitle("Store value"));
    _.agHelper.AssertElementExist(
      _.locators._actionCardByTitle("Copy to clipboard"),
    );

    // Redo the last two undo actions
    cy.get("body").type(_.agHelper.isMac ? "{meta}Y" : "{ctrl}Y");

    cy.get("body").type(_.agHelper.isMac ? "{meta}Y" : "{ctrl}Y");

    // Assert that code for first and third action is gone
    cy.get(_.locators._jsToggle("onclick")).click();
    _.propPane.ValidatePropertyFieldValue(
      "onClick",
      `{{navigateTo('https://google.com', {}, 'SAME_WINDOW');copyToClipboard('text to copy');}}`,
    );
    cy.get(_.locators._jsToggle("onclick")).click();
  });

  it("5. can add success and error callbacks", () => {
    _.propPane.SelectPlatformFunction("onClick", "Show Alert");
    _.agHelper.TypeText(
      _.locators._actionSelectorFieldByLabel("Message"),
      "Hello!",
    );
    cy.get(`${_.locators._actionSelectorPopup} .t--close`).click();

    cy.get(_.locators._actionCardByTitle("Show Alert")).click();

    cy.get(_.locators._actionCallbacks).click();

    // add a success callback
    cy.get(_.locators._actionAddCallback("success")).click().wait(500);
    cy.get(_.locators._dropDownValue("Store value")).click().wait(500);

    // add an error callback
    cy.get(_.locators._actionAddCallback("failure")).click().wait(500);
    cy.get(_.locators._dropDownValue("Navigate to")).click().wait(500);

    cy.get(_.locators._jsToggle("onclick")).click();
    _.propPane.ValidatePropertyFieldValue(
      "onClick",
      `{{showAlert('Hello!', '').then(() => {  storeValue("", "");}).catch(() => {  navigateTo("", {}, 'SAME_WINDOW');});}}`,
    );
    cy.get(_.locators._jsToggle("onclick")).click();
  });

  it("6. updates the success and failure callbacks for nested query actions", () => {
    _.propPane.EnterJSContext(
      "onClick",
      `{{Api1.run().then(() => {
      Api2.run().then(() => { showAlert("Hello") }).catch(() => { showAlert("World") });
     })}}`,
    );
    _.jsEditor.DisableJSContext("onClick");

    // Select the card to show the callback button
    _.propPane.SelectActionByTitleAndValue("Execute a query", "Api1.run");
    cy.get(`${_.locators._actionSelectorPopup} .t--close`).click();

    // Click on the callback button
    cy.get(_.locators._actionCallbacks).click();

    // Edit the success callback of the nested Api2.run
    _.propPane.SelectActionByTitleAndValue("Execute a query", "Api2.run");
    cy.get(
      _.jsEditor._lineinPropertyPaneJsEditor(
        2,
        _.locators._actionSelectorFieldContentByLabel("Callback function"),
      ),
    ).type("eeee");

    // Edit the failure callback of the nested Api2.run
    cy.get(_.locators._openNavigationTab("onFailure")).click();
    cy.get(
      _.jsEditor._lineinPropertyPaneJsEditor(
        2,
        _.locators._actionSelectorFieldContentByLabel("Callback function"),
      ),
    ).type("oooo");

    cy.get(`${_.locators._actionSelectorPopup} .t--close`).click();

    cy.get(_.locators._jsToggle("onclick")).click();
    _.propPane.ValidatePropertyFieldValue(
      "onClick",
      `{{Api1.run().then(() => {  Api2.run().then(() => {    showAlert("Heeeeello");  }).catch(() => {    showAlert("Wooooorld");  });}).catch(() => {});}}`,
    );
    cy.get(_.locators._jsToggle("onclick")).click();
  });

  it("7. updates the query params correctly", () => {
    _.propPane.EnterJSContext(
      "onClick",
      `{{Api1.run().then(() => {
      Api2.run().then(() => { showAlert("Hello") }).catch(() => { showAlert("World") });
     })}}`,
    );
    _.jsEditor.DisableJSContext("onClick");

    // Select the card to show the callback button
    _.propPane.SelectActionByTitleAndValue("Execute a query", "Api1.run");
    cy.get(`${_.locators._actionSelectorPopup} .t--close`).click();

    // Click on the callback button
    cy.get(_.locators._actionCallbacks).click();

    // Edit the success callback of the nested Api2.run
    _.propPane.SelectActionByTitleAndValue("Execute a query", "Api2.run");
    cy.get(
      _.jsEditor._lineinPropertyPaneJsEditor(
        2,
        _.locators._actionSelectorFieldContentByLabel("Params"),
      ),
    ).type("val: 1");

    cy.get(`${_.locators._actionSelectorPopup} .t--close`).click();

    cy.get(_.locators._jsToggle("onclick")).click();
    _.propPane.ValidatePropertyFieldValue(
      "onClick",
      `{{Api1.run().then(() => {  Api2.run({    val: 1    // "key": "value",  }).then(() => {    showAlert("Hello");  }).catch(() => {    showAlert("World");  });}).catch(() => {});}}`,
    );
    cy.get(_.locators._jsToggle("onclick")).click();
  });

  it("8. adds actions to callback function is argument if exists already", () => {
    _.propPane.EnterJSContext(
      "onClick",
      `Api1.run(() => {
        showAlert("Hello");
       })
       `,
    );
    _.jsEditor.DisableJSContext("onClick");

    // Select the card to show the callback button
    _.propPane.SelectActionByTitleAndValue("Execute a query", "Api1.run");
    cy.get(`${_.locators._actionSelectorPopup} .t--close`).click();

    // Click on the callback button
    cy.get(_.locators._actionCallbacks).click();
    cy.get(_.locators._actionAddCallback("success")).click();
    cy.get(_.locators._dropDownValue("Store value")).click().wait(500);

    cy.get(_.locators._jsToggle("onclick")).click();
    _.propPane.ValidatePropertyFieldValue(
      "onClick",
      `{{Api1.run(() => {  showAlert("Hello");  storeValue("", "");}, () => {});}}`,
    );
    cy.get(_.locators._jsToggle("onclick")).click();
  });

  it("9. correctly configures a setInterval action", () => {
    _.propPane.SelectPlatformFunction("onClick", "Set interval");

    cy.get(
      _.jsEditor._lineinPropertyPaneJsEditor(
        2,
        _.locators._actionSelectorFieldContentByLabel("Callback function"),
      ),
    ).type("{enter}showAlert('Hello'){enter}//");

    _.agHelper.TypeText(
      _.locators._actionSelectorFieldByLabel("Id"),
      "interval-id",
    );
    cy.get(`${_.locators._actionSelectorPopup} .t--close`).click();

    cy.get(_.locators._jsToggle("onclick")).click();
    _.propPane.ValidatePropertyFieldValue(
      "onClick",
      `{{setInterval(() => {  // add c  showAlert(\'Hello\');  // ode here}, 5000, \'interval-id\');}}`,
    );
    cy.get(_.locators._jsToggle("onclick")).click();
  });
});
