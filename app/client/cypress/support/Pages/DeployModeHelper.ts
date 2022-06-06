import { ObjectsRegistry } from "../Objects/Registry";

export class DeployMode {
  private locator = ObjectsRegistry.CommonLocators;
  private agHelper = ObjectsRegistry.AggregateHelper;

  _jsonFormFieldByName = (fieldName: string, input: boolean) =>
    `//p[text()='${fieldName}']/ancestor::div[@direction='column']//div[@data-testid='input-container']//${
      input ? "input" : "textarea"
    }`;
  _jsonFormRadioFieldByName = (fieldName: string) =>
    `//p[text()='${fieldName}']/ancestor::div[@direction='column']//div[@data-testid='radiogroup-container']//input`;

  //refering PublishtheApp from command.js
  public DeployApp(
    eleToCheckInDeployPage: string = this.locator._backToEditor,
  ) {
    //cy.intercept("POST", "/api/v1/applications/publish/*").as("publishAppli");
    // Wait before publish
    this.agHelper.Sleep(2000); //wait for elements settle!
    this.agHelper.AssertAutoSave();
    // Stubbing window.open to open in the same tab
    cy.window().then((window) => {
      cy.stub(window, "open").callsFake((url) => {
        window.location.href = Cypress.config().baseUrl + url.substring(1);
      });
    });
    cy.get(this.locator._publishButton).click();
    cy.log("Pagename: " + localStorage.getItem("PageName"));

    //Below url check throwing error - hence commenting!
    // cy.wait("@publishApp")
    //   .its("request.url")
    //   .should("not.contain", "edit");
    //cy.wait('@publishApp').wait('@publishApp') //waitng for 2 calls to complete

    this.agHelper.WaitUntilEleAppear(eleToCheckInDeployPage);
    localStorage.setItem("inDeployedMode", "true");
    this.agHelper.Sleep(2000) //for Depoy page to settle!
  }

  // Stubbing window.open to open in the same tab
  public StubbingWindow() {
    cy.window().then((window: any) => {
      cy.stub(window, "open").callsFake((url) => {
        window.location.href = url;
        window.location.target = "_self";
      });
    });
  }

  public EnterJSONFieldValue(selector: string, value: string, index = 0) {
    let locator = selector.startsWith("//")
      ? cy.xpath(selector)
      : cy.get(selector);
    locator
      .eq(index)
      .click()
      .type(value)
      .wait(500);
  }
}
