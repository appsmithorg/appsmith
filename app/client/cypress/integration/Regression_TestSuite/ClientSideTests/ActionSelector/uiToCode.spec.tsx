import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const { AggregateHelper, CommonLocators, EntityExplorer, PropertyPane } =
  ObjectsRegistry;

describe("UI to Code", () => {
  before(() => {
    cy.fixture("buttondsl").then((val: any) => {
      AggregateHelper.AddDsl(val);
    });
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
    cy.get("#switcher--url").click();
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
    cy.get("#switcher--url").click();
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
    cy.get("#switcher--url").click();
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
});
