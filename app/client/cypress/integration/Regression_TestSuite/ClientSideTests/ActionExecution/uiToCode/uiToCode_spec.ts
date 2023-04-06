import * as _ from "../../../../../support/Objects/ObjectsCore";

const { agHelper, apiPage, entityExplorer, jsEditor, locators, propPane } = _;

describe("UI to Code", () => {
  before(() => {
    cy.fixture("buttondsl").then((val: any) => {
      agHelper.AddDsl(val);
    });
    apiPage.CreateApi("Api1", "GET");
    apiPage.CreateApi("Api2", "POST");
  });

  beforeEach(() => {
    entityExplorer.SelectEntityByName("Button1", "Widgets");
    propPane.EnterJSContext("onClick", "");
    jsEditor.DisableJSContext("onClick");
  });

  it("1. adds an action", () => {
    propPane.SelectPlatformFunction("onClick", "Show Alert");
    agHelper.TypeText(
      propPane._actionSelectorFieldByLabel("Message"),
      "Hello!",
    );
    agHelper.GetNClick(propPane._actionSelectorPopupClose);
    propPane.ValidateJSFieldValue("onClick", `{{showAlert('Hello!', '');}}`);
  });

  it("2. adds multiple actions", () => {
    // Add first action
    propPane.SelectPlatformFunction("onClick", "Show Alert");
    agHelper.TypeText(
      propPane._actionSelectorFieldByLabel("Message"),
      "Hello!",
    );
    agHelper.GetNClick(propPane._actionSelectorPopupClose);

    // Add second action
    propPane.SelectPlatformFunction("onClick", "Navigate to");
    propPane.SelectActionByTitleAndValue("Navigate to", "Select page");
    agHelper.GetNClick(locators._openNavigationTab("url"));
    agHelper.TypeText(
      propPane._actionSelectorFieldByLabel("Enter URL"),
      "https://google.com",
    );
    agHelper.GetNClick(propPane._actionSelectorPopupClose);
    propPane.ValidateJSFieldValue(
      "onClick",
      `{{showAlert('Hello!', '');navigateTo('https://google.com', {}, 'SAME_WINDOW');}}`,
    );

    // Add third action
    propPane.SelectPlatformFunction("onClick", "Store value");
    agHelper.TypeText(
      propPane._actionSelectorFieldByLabel("Key"),
      "secret-key",
    );
    agHelper.TypeText(
      propPane._actionSelectorFieldByLabel("Value"),
      "secret-value",
    );
    agHelper.GetNClick(propPane._actionSelectorPopupClose);

    // Add fourth action
    propPane.SelectPlatformFunction("onClick", "Copy to clipboard");
    agHelper.TypeText(
      propPane._actionSelectorFieldByLabel("Text to be copied to clipboard"),
      "text to copy",
    );
    agHelper.GetNClick(propPane._actionSelectorPopupClose);

    // Validate the code
    propPane.ValidateJSFieldValue(
      "onClick",
      `{{showAlert('Hello!', '');navigateTo('https://google.com', {}, 'SAME_WINDOW');storeValue('secret-key', 'secret-value');copyToClipboard('text to copy');}}`,
    );

    // Delete the third action
    agHelper.GetNClick(propPane._actionCardByTitle("Store value"));
    agHelper.GetNClick(propPane._actionSelectorDelete);

    // Assert that cards 1, 2 and 4 are present
    agHelper.AssertElementExist(propPane._actionCardByTitle("Show Alert"));
    agHelper.AssertElementExist(propPane._actionCardByTitle("Navigate to"));
    agHelper.AssertElementExist(
      propPane._actionCardByTitle("Copy to clipboard"),
    );

    // Assert the code for the remaining actions
    propPane.ValidateJSFieldValue(
      "onClick",
      `{{showAlert('Hello!', '');navigateTo('https://google.com', {}, 'SAME_WINDOW');copyToClipboard('text to copy');}}`,
    );

    // Delete the first action
    agHelper.GetNClick(propPane._actionCardByTitle("Show Alert"));
    agHelper.GetNClick(propPane._actionSelectorDelete);

    // Assert that cards 2 and 4 are present
    agHelper.AssertElementExist(propPane._actionCardByTitle("Navigate to"));
    agHelper.AssertElementExist(
      propPane._actionCardByTitle("Copy to clipboard"),
    );

    // Assert the code for the remaining actions
    propPane.ValidateJSFieldValue(
      "onClick",
      `{{navigateTo('https://google.com', {}, 'SAME_WINDOW');copyToClipboard('text to copy');}}`,
    );
  });

  it("3. works with undo using cmd+z", () => {
    // Add first action
    propPane.SelectPlatformFunction("onClick", "Show Alert");
    agHelper.TypeText(
      propPane._actionSelectorFieldByLabel("Message"),
      "Hello!",
    );
    agHelper.GetNClick(propPane._actionSelectorPopupClose);

    // Add second action
    propPane.SelectPlatformFunction("onClick", "Navigate to");
    propPane.SelectActionByTitleAndValue("Navigate to", "Select page");
    agHelper.GetNClick(locators._openNavigationTab("url"));
    agHelper.TypeText(
      propPane._actionSelectorFieldByLabel("Enter URL"),
      "https://google.com",
    );
    agHelper.GetNClick(propPane._actionSelectorPopupClose);

    propPane.ValidateJSFieldValue(
      "onClick",
      `{{showAlert('Hello!', '');navigateTo('https://google.com', {}, 'SAME_WINDOW');}}`,
    );

    // Add third action
    propPane.SelectPlatformFunction("onClick", "Store value");
    agHelper.TypeText(
      propPane._actionSelectorFieldByLabel("Key"),
      "secret-key",
    );
    agHelper.TypeText(
      propPane._actionSelectorFieldByLabel("Value"),
      "secret-value",
    );
    agHelper.GetNClick(propPane._actionSelectorPopupClose);

    // Add fourth action
    propPane.SelectPlatformFunction("onClick", "Copy to clipboard");
    agHelper.TypeText(
      propPane._actionSelectorFieldByLabel("Text to be copied to clipboard"),
      "text to copy",
    );
    agHelper.GetNClick(propPane._actionSelectorPopupClose);

    // Validate the code

    propPane.ValidateJSFieldValue(
      "onClick",
      `{{showAlert('Hello!', '');navigateTo('https://google.com', {}, 'SAME_WINDOW');storeValue('secret-key', 'secret-value');copyToClipboard('text to copy');}}`,
    );

    // Delete the third action
    agHelper.GetNClick(propPane._actionCardByTitle("Store value"));
    agHelper.GetNClick(propPane._actionSelectorDelete);

    // Delete the first action
    agHelper.GetNClick(propPane._actionCardByTitle("Show Alert"));
    agHelper.GetNClick(propPane._actionSelectorDelete);

    // Assert that first and third action are not present
    agHelper.AssertElementAbsence(propPane._actionCardByTitle("Show Alert"));
    agHelper.AssertElementAbsence(propPane._actionCardByTitle("Store value"));

    // Undo the last two actions
    cy.get("body").type(agHelper.isMac ? "{meta}Z" : "{ctrl}Z");

    cy.get("body").type(agHelper.isMac ? "{meta}Z" : "{ctrl}Z");

    // Assert that all the cards are present
    agHelper.AssertElementExist(propPane._actionCardByTitle("Show Alert"));
    agHelper.AssertElementExist(propPane._actionCardByTitle("Navigate to"));
    agHelper.AssertElementExist(propPane._actionCardByTitle("Store value"));
    agHelper.AssertElementExist(
      propPane._actionCardByTitle("Copy to clipboard"),
    );

    // Assert that code for all actions is back after undo actions

    propPane.ValidateJSFieldValue(
      "onClick",
      `{{showAlert('Hello!', '');navigateTo('https://google.com', {}, 'SAME_WINDOW');storeValue('secret-key', 'secret-value');copyToClipboard('text to copy');}}`,
    );
  });

  it("4. works with redo using cmd+y", () => {
    // Add first action
    propPane.SelectPlatformFunction("onClick", "Show Alert");
    agHelper.TypeText(
      propPane._actionSelectorFieldByLabel("Message"),
      "Hello!",
    );
    agHelper.GetNClick(propPane._actionSelectorPopupClose);

    // Add second action
    propPane.SelectPlatformFunction("onClick", "Navigate to");
    propPane.SelectActionByTitleAndValue("Navigate to", "Select page");
    agHelper.GetNClick(locators._openNavigationTab("url"));
    agHelper.TypeText(
      propPane._actionSelectorFieldByLabel("Enter URL"),
      "https://google.com",
    );
    agHelper.GetNClick(propPane._actionSelectorPopupClose);

    propPane.ValidateJSFieldValue(
      "onClick",
      `{{showAlert('Hello!', '');navigateTo('https://google.com', {}, 'SAME_WINDOW');}}`,
    );

    // Add third action
    propPane.SelectPlatformFunction("onClick", "Store value");
    agHelper.TypeText(
      propPane._actionSelectorFieldByLabel("Key"),
      "secret-key",
    );
    agHelper.TypeText(
      propPane._actionSelectorFieldByLabel("Value"),
      "secret-value",
    );
    agHelper.GetNClick(propPane._actionSelectorPopupClose);

    // Add fourth action
    propPane.SelectPlatformFunction("onClick", "Copy to clipboard");
    agHelper.TypeText(
      propPane._actionSelectorFieldByLabel("Text to be copied to clipboard"),
      "text to copy",
    );
    agHelper.GetNClick(propPane._actionSelectorPopupClose);

    // Validate the code

    propPane.ValidateJSFieldValue(
      "onClick",
      `{{showAlert('Hello!', '');navigateTo('https://google.com', {}, 'SAME_WINDOW');storeValue('secret-key', 'secret-value');copyToClipboard('text to copy');}}`,
    );

    // Delete the third action
    agHelper.GetNClick(propPane._actionCardByTitle("Store value"));
    agHelper.GetNClick(propPane._actionSelectorDelete);

    // Delete the first action
    agHelper.GetNClick(propPane._actionCardByTitle("Show Alert"));
    agHelper.GetNClick(propPane._actionSelectorDelete);

    // Assert that first and third action are not present
    agHelper.AssertElementAbsence(propPane._actionCardByTitle("Show Alert"));
    agHelper.AssertElementAbsence(propPane._actionCardByTitle("Store value"));

    // Undo the last two actions
    cy.get("body").type(agHelper.isMac ? "{meta}Z" : "{ctrl}Z");

    cy.get("body").type(agHelper.isMac ? "{meta}Z" : "{ctrl}Z");

    // Assert that all the cards are present
    agHelper.AssertElementExist(propPane._actionCardByTitle("Show Alert"));
    agHelper.AssertElementExist(propPane._actionCardByTitle("Navigate to"));
    agHelper.AssertElementExist(propPane._actionCardByTitle("Store value"));
    agHelper.AssertElementExist(
      propPane._actionCardByTitle("Copy to clipboard"),
    );

    // Redo the last two undo actions
    cy.get("body").type(agHelper.isMac ? "{meta}Y" : "{ctrl}Y");

    cy.get("body").type(agHelper.isMac ? "{meta}Y" : "{ctrl}Y");

    // Assert that code for first and third action is gone

    propPane.ValidateJSFieldValue(
      "onClick",
      `{{navigateTo('https://google.com', {}, 'SAME_WINDOW');copyToClipboard('text to copy');}}`,
    );
  });

  it("5. can add success and error callbacks", () => {
    propPane.SelectPlatformFunction("onClick", "Show Alert");
    agHelper.TypeText(
      propPane._actionSelectorFieldByLabel("Message"),
      "Hello!",
    );
    agHelper.GetNClick(propPane._actionSelectorPopupClose);

    agHelper.GetNClick(propPane._actionCardByTitle("Show Alert"));

    agHelper.GetNClick(propPane._actionCallbacks);

    // add a success callback
    agHelper.GetNClick(propPane._actionAddCallback("success")).wait(500);
    agHelper.GetNClick(locators._dropDownValue("Store value")).wait(500);

    // add an error callback
    agHelper.GetNClick(propPane._actionAddCallback("failure")).wait(500);
    agHelper.GetNClick(locators._dropDownValue("Navigate to")).wait(500);

    propPane.ValidateJSFieldValue(
      "onClick",
      `{{showAlert('Hello!', '').then(() => {  storeValue("", "");}).catch(() => {  navigateTo("", {}, 'SAME_WINDOW');});}}`,
    );
  });

  it("6. updates the success and failure callbacks for nested query actions", () => {
    propPane.EnterJSContext(
      "onClick",
      `{{Api1.run().then(() => {
      Api2.run().then(() => { showAlert("Hello") }).catch(() => { showAlert("World") });
     })}}`,
    );
    jsEditor.DisableJSContext("onClick");

    // Select the card to show the callback button
    propPane.SelectActionByTitleAndValue("Execute a query", "Api1.run");
    agHelper.GetNClick(propPane._actionSelectorPopupClose);

    // Click on the callback button
    agHelper.GetNClick(propPane._actionCallbacks);

    // Edit the success callback of the nested Api2.run
    propPane.SelectActionByTitleAndValue("Execute a query", "Api2.run");
    cy.get(
      jsEditor._lineinPropertyPaneJsEditor(
        2,
        propPane._actionSelectorFieldContentByLabel("Callback function"),
      ),
    ).type("eeee");

    // Edit the failure callback of the nested Api2.run
    agHelper.GetNClick(locators._openNavigationTab("onFailure"));
    cy.get(
      jsEditor._lineinPropertyPaneJsEditor(
        2,
        propPane._actionSelectorFieldContentByLabel("Callback function"),
      ),
    ).type("oooo");

    agHelper.GetNClick(propPane._actionSelectorPopupClose);

    propPane.ValidateJSFieldValue(
      "onClick",
      `{{Api1.run().then(() => {  Api2.run().then(() => {    showAlert("Heeeeello");  }).catch(() => {    showAlert("Wooooorld");  });}).catch(() => {});}}`,
    );
  });

  it("7. updates the query params correctly", () => {
    propPane.EnterJSContext(
      "onClick",
      `{{Api1.run().then(() => {
      Api2.run().then(() => { showAlert("Hello") }).catch(() => { showAlert("World") });
     })}}`,
    );
    jsEditor.DisableJSContext("onClick");

    // Select the card to show the callback button
    propPane.SelectActionByTitleAndValue("Execute a query", "Api1.run");
    agHelper.GetNClick(propPane._actionSelectorPopupClose);

    // Click on the callback button
    agHelper.GetNClick(propPane._actionCallbacks);

    // Edit the success callback of the nested Api2.run
    propPane.SelectActionByTitleAndValue("Execute a query", "Api2.run");
    cy.get(
      jsEditor._lineinPropertyPaneJsEditor(
        2,
        propPane._actionSelectorFieldContentByLabel("Params"),
      ),
    ).type("val: 1");

    agHelper.GetNClick(propPane._actionSelectorPopupClose);

    propPane.ValidateJSFieldValue(
      "onClick",
      `{{Api1.run().then(() => {  Api2.run({    val: 1    // "key": "value",  }).then(() => {    showAlert("Hello");  }).catch(() => {    showAlert("World");  });}).catch(() => {});}}`,
    );
  });

  it("8. adds actions to callback function is argument if exists already", () => {
    propPane.EnterJSContext(
      "onClick",
      `Api1.run(() => {
        showAlert("Hello");
       })
       `,
    );
    jsEditor.DisableJSContext("onClick");

    // Select the card to show the callback button
    propPane.SelectActionByTitleAndValue("Execute a query", "Api1.run");
    agHelper.GetNClick(propPane._actionSelectorPopupClose);

    // Click on the callback button
    agHelper.GetNClick(propPane._actionCallbacks);
    agHelper.GetNClick(propPane._actionAddCallback("success"));
    agHelper.GetNClick(locators._dropDownValue("Store value")).wait(500);

    propPane.ValidateJSFieldValue(
      "onClick",
      `{{Api1.run(() => {  showAlert("Hello");  storeValue("", "");}, () => {});}}`,
    );
  });

  it("9. correctly configures a setInterval action", () => {
    propPane.SelectPlatformFunction("onClick", "Set interval");

    cy.get(
      jsEditor._lineinPropertyPaneJsEditor(
        2,
        propPane._actionSelectorFieldContentByLabel("Callback function"),
      ),
    ).type("{enter}showAlert('Hello'){enter}//");

    agHelper.TypeText(
      propPane._actionSelectorFieldByLabel("Id"),
      "interval-id",
    );
    agHelper.GetNClick(propPane._actionSelectorPopupClose);

    propPane.ValidateJSFieldValue(
      "onClick",
      `{{setInterval(() => {  // add c  showAlert(\'Hello\');  // ode here}, 5000, \'interval-id\');}}`,
    );
  });
});
