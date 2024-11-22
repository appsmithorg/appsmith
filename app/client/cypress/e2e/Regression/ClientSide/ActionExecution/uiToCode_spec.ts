import {
  agHelper,
  apiPage,
  draggableWidgets,
  entityExplorer,
  jsEditor,
  locators,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

describe("UI to Code", { tags: ["@tag.JS", "@tag.Binding"] }, () => {
  before(() => {
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON);
    apiPage.CreateApi();
    apiPage.CreateApi("Api2", "POST");
  });

  beforeEach(() => {
    EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
    propPane.EnterJSContext("onClick", "");
    propPane.ToggleJSMode("onClick", false);
  });

  it("1. adds an action", () => {
    propPane.SelectPlatformFunction("onClick", "Show alert");
    agHelper.TypeText(
      propPane._actionSelectorFieldByLabel("Message"),
      "Hello!",
    );
    agHelper.GetNClick(propPane._actionSelectorPopupClose);
    propPane.ValidateJSFieldValue("onClick", `{{showAlert('Hello!', '');}}`);
  });

  it("2. adds multiple actions", () => {
    // Add first action
    propPane.SelectPlatformFunction("onClick", "Show alert");
    agHelper.TypeText(
      propPane._actionSelectorFieldByLabel("Message"),
      "Hello!",
    );
    agHelper.GetNClick(propPane._actionSelectorPopupClose);

    // Add second action
    propPane.SelectPlatformFunction("onClick", "Navigate to");
    propPane.SelectActionByTitleAndValue("Navigate to", "Select page");
    agHelper.GetNClick(propPane._navigateToType("URL"));
    agHelper.TypeText(
      propPane._actionSelectorFieldByLabel("Enter URL"),
      "https://www.google.com",
    );
    agHelper.GetNClick(propPane._actionSelectorPopupClose);
    propPane.ValidateJSFieldValue(
      "onClick",
      `{{showAlert('Hello!', '');navigateTo('https://www.google.com', {}, 'SAME_WINDOW');}}`,
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
      `{{showAlert('Hello!', '');navigateTo('https://www.google.com', {}, 'SAME_WINDOW');storeValue('secret-key', 'secret-value');copyToClipboard('text to copy');}}`,
    );

    // Delete the third action
    agHelper.GetNClick(propPane._actionCardByTitle("Store value"));
    agHelper.GetNClick(propPane._actionSelectorDelete);

    // Assert that cards 1, 2 and 4 are present
    agHelper.AssertElementExist(propPane._actionCardByTitle("Show alert"));
    agHelper.AssertElementExist(propPane._actionCardByTitle("Navigate to"));
    agHelper.AssertElementExist(
      propPane._actionCardByTitle("Copy to clipboard"),
    );

    // Assert the code for the remaining actions
    propPane.ValidateJSFieldValue(
      "onClick",
      `{{showAlert('Hello!', '');navigateTo('https://www.google.com', {}, 'SAME_WINDOW');copyToClipboard('text to copy');}}`,
    );

    // Delete the first action
    agHelper.GetNClick(propPane._actionCardByTitle("Show alert"));
    agHelper.GetNClick(propPane._actionSelectorDelete);

    // Assert that cards 2 and 4 are present
    agHelper.AssertElementExist(propPane._actionCardByTitle("Navigate to"));
    agHelper.AssertElementExist(
      propPane._actionCardByTitle("Copy to clipboard"),
    );

    // Assert the code for the remaining actions
    propPane.ValidateJSFieldValue(
      "onClick",
      `{{navigateTo('https://www.google.com', {}, 'SAME_WINDOW');copyToClipboard('text to copy');}}`,
    );
  });

  it("3. works with undo using cmd+z", () => {
    // Add first action
    propPane.SelectPlatformFunction("onClick", "Show alert");
    agHelper.TypeText(
      propPane._actionSelectorFieldByLabel("Message"),
      "Hello!",
    );
    agHelper.GetNClick(propPane._actionSelectorPopupClose);

    // Add second action
    propPane.SelectPlatformFunction("onClick", "Navigate to");
    propPane.SelectActionByTitleAndValue("Navigate to", "Select page");
    agHelper.GetNClick(propPane._navigateToType("URL"));
    agHelper.TypeText(
      propPane._actionSelectorFieldByLabel("Enter URL"),
      "https://www.google.com",
    );
    agHelper.GetNClick(propPane._actionSelectorPopupClose);

    propPane.ValidateJSFieldValue(
      "onClick",
      `{{showAlert('Hello!', '');navigateTo('https://www.google.com', {}, 'SAME_WINDOW');}}`,
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
      `{{showAlert('Hello!', '');navigateTo('https://www.google.com', {}, 'SAME_WINDOW');storeValue('secret-key', 'secret-value');copyToClipboard('text to copy');}}`,
    );

    // Delete the third action
    agHelper.GetNClick(propPane._actionCardByTitle("Store value"));
    agHelper.GetNClick(propPane._actionSelectorDelete);

    // Delete the first action
    agHelper.GetNClick(propPane._actionCardByTitle("Show alert"));
    agHelper.GetNClick(propPane._actionSelectorDelete);

    // Assert that first and third action are not present
    agHelper.AssertElementAbsence(propPane._actionCardByTitle("Show alert"));
    agHelper.AssertElementAbsence(propPane._actionCardByTitle("Store value"));

    // Undo the last two actions
    cy.get("body").type(agHelper.isMac ? "{meta}Z" : "{ctrl}Z");

    cy.get("body").type(agHelper.isMac ? "{meta}Z" : "{ctrl}Z");

    // Assert that all the cards are present
    agHelper.AssertElementExist(propPane._actionCardByTitle("Show alert"));
    agHelper.AssertElementExist(propPane._actionCardByTitle("Navigate to"));
    agHelper.AssertElementExist(propPane._actionCardByTitle("Store value"));
    agHelper.AssertElementExist(
      propPane._actionCardByTitle("Copy to clipboard"),
    );

    // Assert that code for all actions is back after undo actions

    propPane.ValidateJSFieldValue(
      "onClick",
      `{{showAlert('Hello!', '');navigateTo('https://www.google.com', {}, 'SAME_WINDOW');storeValue('secret-key', 'secret-value');copyToClipboard('text to copy');}}`,
    );
  });

  it("4. works with redo using cmd+y", () => {
    // Add first action
    propPane.SelectPlatformFunction("onClick", "Show alert");
    agHelper.TypeText(
      propPane._actionSelectorFieldByLabel("Message"),
      "Hello!",
    );
    agHelper.GetNClick(propPane._actionSelectorPopupClose);

    // Add second action
    propPane.SelectPlatformFunction("onClick", "Navigate to");
    propPane.SelectActionByTitleAndValue("Navigate to", "Select page");
    agHelper.GetNClick(propPane._navigateToType("URL"));
    agHelper.TypeText(
      propPane._actionSelectorFieldByLabel("Enter URL"),
      "https://www.google.com",
    );
    agHelper.GetNClick(propPane._actionSelectorPopupClose);

    propPane.ValidateJSFieldValue(
      "onClick",
      `{{showAlert('Hello!', '');navigateTo('https://www.google.com', {}, 'SAME_WINDOW');}}`,
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
      `{{showAlert('Hello!', '');navigateTo('https://www.google.com', {}, 'SAME_WINDOW');storeValue('secret-key', 'secret-value');copyToClipboard('text to copy');}}`,
    );

    // Delete the third action
    agHelper.GetNClick(propPane._actionCardByTitle("Store value"));
    agHelper.GetNClick(propPane._actionSelectorDelete);

    // Delete the first action
    agHelper.GetNClick(propPane._actionCardByTitle("Show alert"));
    agHelper.GetNClick(propPane._actionSelectorDelete);

    // Assert that first and third action are not present
    agHelper.AssertElementAbsence(propPane._actionCardByTitle("Show alert"));
    agHelper.AssertElementAbsence(propPane._actionCardByTitle("Store value"));

    // Undo the last two actions
    cy.get("body").type(agHelper.isMac ? "{meta}Z" : "{ctrl}Z");

    cy.get("body").type(agHelper.isMac ? "{meta}Z" : "{ctrl}Z");

    // Assert that all the cards are present
    agHelper.AssertElementExist(propPane._actionCardByTitle("Show alert"));
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
      `{{navigateTo('https://www.google.com', {}, 'SAME_WINDOW');copyToClipboard('text to copy');}}`,
    );
  });

  it("5. can add success and error callbacks", () => {
    propPane.SelectPlatformFunction("onClick", "Show alert");
    agHelper.TypeText(
      propPane._actionSelectorFieldByLabel("Message"),
      "Hello!",
    );
    agHelper.GetNClick(propPane._actionSelectorPopupClose);

    agHelper.GetNClick(propPane._actionCardByTitle("Show alert"));

    // add a success callback
    agHelper.GetNClick(propPane._actionAddCallback("success"));
    agHelper.GetNClick(locators._dropDownValue("Store value"));

    // add an error callback
    agHelper.GetNClick(propPane._actionAddCallback("failure"));
    agHelper.GetNClick(locators._dropDownValue("Navigate to"));

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
    propPane.ToggleJSMode("onClick", false);

    // Select the card to show the callback button
    propPane.SelectActionByTitleAndValue("Execute a query", "Api1.run");
    agHelper.GetNClick(propPane._actionSelectorPopupClose);

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
      `{{Api1.run().then(() => {  Api2.run().then(() => {    showAlert("Heeeeello");  }).catch(() => {    showAlert("Wooooorld");  });});}}`,
    );
  });

  it("7. updates the query params correctly", () => {
    propPane.EnterJSContext(
      "onClick",
      `{{Api1.run().then(() => {
      Api2.run().then(() => { showAlert("Hello") }).catch(() => { showAlert("World") });
     })}}`,
    );
    propPane.ToggleJSMode("onClick", false);

    // Select the card to show the callback button
    propPane.SelectActionByTitleAndValue("Execute a query", "Api1.run");
    agHelper.GetNClick(propPane._actionSelectorPopupClose);

    // Edit the success callback of the nested Api2.run
    propPane.SelectActionByTitleAndValue("Execute a query", "Api2.run");
    agHelper.GetNClick(propPane._actionCollapsibleHeader("Params"));
    agHelper.EnterActionValue(
      "Params",
      `{{{
        val: 1
      }}}`,
    );

    agHelper.GetNClick(propPane._actionSelectorPopupClose);

    propPane.ValidateJSFieldValue(
      "onClick",
      `{{Api1.run().then(() => {  Api2.run({    val: 1  }).then(() => {    showAlert("Hello");  }).catch(() => {    showAlert("World");  });});}}`,
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
    propPane.ToggleJSMode("onClick", false);

    // Select the card to show the callback button
    propPane.SelectActionByTitleAndValue("Execute a query", "Api1.run");
    agHelper.GetNClick(propPane._actionSelectorPopupClose);

    // Click on the callback button
    agHelper.GetNClick(propPane._actionAddCallback("success"));
    agHelper.GetNClick(locators._dropDownValue("Store value"));

    propPane.ValidateJSFieldValue(
      "onClick",
      `{{Api1.run(() => {  showAlert("Hello");  storeValue("", "");}, () => {});}}`,
    );
  });

  it("9. correctly configures a setInterval action", () => {
    propPane.SelectPlatformFunction("onClick", "Set interval");
    agHelper.EnterActionValue(
      "Callback function",
      `{{() => {
        // add code here
        showAlert('Hello')
      }}}`,
    );

    agHelper.TypeText(
      propPane._actionSelectorFieldByLabel("Id"),
      "interval-id",
    );
    agHelper.GetNClick(propPane._actionSelectorPopupClose);

    propPane.ValidateJSFieldValue(
      "onClick",
      `{{setInterval(() => {  // add code here  showAlert('Hello');}, 5000, 'interval-id');}}`,
    );
  });
});
