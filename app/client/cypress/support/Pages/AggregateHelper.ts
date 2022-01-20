import "cypress-wait-until";
import { CommonLocators } from "../Objects/CommonLocators";

const locator = new CommonLocators();
export class AggregateHelper {
  public AddDsl(dsl: string) {
    let currentURL;
    let pageid: string;
    let layoutId;
    cy.url().then((url) => {
      currentURL = url;
      const myRegexp = /pages(.*)/;
      const match = myRegexp.exec(currentURL);
      pageid = match![1].split("/")[1];
      cy.log(pageid + "page id");
      //Fetch the layout id
      cy.request("GET", "api/v1/pages/" + pageid).then((response) => {
        const respBody = JSON.stringify(response.body);
        layoutId = JSON.parse(respBody).data.layouts[0].id;
        // Dumping the DSL to the created page
        cy.request(
          "PUT",
          "api/v1/layouts/" + layoutId + "/pages/" + pageid,
          dsl,
        ).then((response) => {
          //cy.log("Pages resposne is : " + response.body);
          expect(response.status).equal(200);
          cy.reload();
        });
      });
    });
  }

  public NavigateToCreateNewTabPage() {
    cy.get(locator._addEntityAPI)
      .last()
      .should("be.visible")
      .click({ force: true });
    cy.get(locator._integrationCreateNew)
      .should("be.visible")
      .click({ force: true });
    cy.get(locator._loading).should("not.exist");
  }

  public StartServerAndRoutes() {
    cy.intercept("POST", "/api/v1/actions").as("createNewApi");
    cy.intercept("PUT", "/api/v1/actions/*").as("saveAction");
  }

  public RenameWithInPane(renameVal: string) {
    cy.get(locator._actionName).click({ force: true });
    cy.get(locator._actionTxt)
      .clear()
      .type(renameVal, { force: true })
      .should("have.value", renameVal)
      .blur();
  }

  public WaitAutoSave() {
    // wait for save query to trigger & n/w call to finish occuring
    cy.get(locator._saveStatusSuccess, { timeout: 40000 }).should("exist");
  }

  public SelectEntityByName(entityNameinLeftSidebar: string) {
    cy.xpath(locator._entityNameInExplorer(entityNameinLeftSidebar))
      .last()
      .click({ multiple: true });
    this.Sleep(2000);
  }

  public ValidateEntityPresenceInExplorer(entityNameinLeftSidebar: string) {
    cy.xpath(locator._entityNameInExplorer(entityNameinLeftSidebar)).should(
      "have.length",
      1,
    );
  }

  public NavigateToHome() {
    cy.get(locator._homeIcon).click({ force: true });
    this.Sleep(3000);
    cy.wait("@applications");
    cy.get(locator._homePageAppCreateBtn)
      .should("be.visible")
      .should("be.enabled");
    //cy.get(this._homePageAppCreateBtn);
  }

  public CreateNewApplication() {
    cy.get(locator._homePageAppCreateBtn).click({ force: true });
    cy.wait("@createNewApplication").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );
  }

  public ValidateCodeEditorContent(selector: string, contentToValidate: any) {
    cy.get(selector).within(() => {
      cy.get(locator._codeMirrorCode).should("have.text", contentToValidate);
    });
  }

  //refering PublishtheApp from command.js
  public DeployApp() {
    cy.intercept("POST", "/api/v1/applications/publish/*").as("publishApp");
    // Wait before publish
    this.Sleep(2000);
    this.WaitAutoSave();
    // Stubbing window.open to open in the same tab
    cy.window().then((window) => {
      cy.stub(window, "open").callsFake((url) => {
        window.location.href = Cypress.config().baseUrl + url.substring(1);
      });
    });
    cy.get(locator._publishButton).click();
    cy.wait("@publishApp");
    cy.url().should("include", "/pages");
    cy.log("Pagename: " + localStorage.getItem("PageName"));
  }

  public expandCollapseEntity(entityName: string) {
    cy.xpath(locator._expandCollapseArrow(entityName))
      .click({ multiple: true })
      .wait(500);
  }

  public ActionContextMenuByEntityName(
    entityNameinLeftSidebar: string,
    action = "Delete",
    subAction = "") {
    this.Sleep();
    cy.xpath(locator._contextMenu(entityNameinLeftSidebar))
      .first()
      .click({ force: true });
    cy.xpath(locator._contextMenuItem(action))
      .click({ force: true })
      .wait(500);
    if (subAction)
      cy.xpath(locator._contextMenuItem(subAction))
        .click({ force: true })
        .wait(500);
  }

  public ValidateEntityAbsenceInExplorer(entityNameinLeftSidebar: string) {
    cy.xpath(locator._entityNameInExplorer(entityNameinLeftSidebar)).should('not.exist');
  }

  public AddNewPage() {
    cy.get(locator._newPage)
      .first()
      .click();
    cy.wait("@createPage").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );
  }

  public ClickButton(btnVisibleText: string) {
    cy.xpath(locator._buttonClick(btnVisibleText))
      .scrollIntoView()
      .click({ force: true });
  }

  public Paste(selector: any, pastePayload: string) {
    cy.wrap(selector).then(($destination) => {
      const pasteEvent = Object.assign(
        new Event("paste", { bubbles: true, cancelable: true }),
        {
          clipboardData: {
            getData: () => pastePayload,
          },
        },
      );
      $destination[0].dispatchEvent(pasteEvent);
    });
  }

  public WaitUntilEleDisappear(
    selector: string,
    msgToCheckforDisappearance: string,
    timeout = 500,
  ) {
    cy.waitUntil(
      () =>
        cy
          .get(selector)
          .contains(msgToCheckforDisappearance)
          .should("have.length", 0),
      {
        errorMsg: msgToCheckforDisappearance + " did not disappear",
        timeout: 5000,
        interval: 1000,
      },
    ).then(() => this.Sleep(timeout));
  }

  public Sleep(timeout = 1000) {
    cy.wait(timeout);
  }
}
