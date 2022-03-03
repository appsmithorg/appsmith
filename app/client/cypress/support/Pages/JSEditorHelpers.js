import explorer from "../../locators/explorerlocators.json";
import apiwidget from "../../locators/apiWidgetslocator.json";

export const defaultFileText =
  "export default {\n" +
  "\tmyVar1: [],\n" +
  "\tmyVar2: {},\n" +
  "\tmyFun1: () => {\n" +
  "\t\t//write code here\n" +
  "\t},\n" +
  "\tmyFun2: async () => {\n" +
  "\t\t//use async-await or promises\n" +
  "\t}\n" +
  "}";

export const testingFileText =
  "export default {\n" +
  "\tmyVar1: 'abc',\n" +
  "\tmyVar2: appsmith.user,\n" +
  "\tmyFun1: () => {\n" +
  "\t\treturn appsmith.user.email\n" +
  "\t},\n" +
  "\tmyFun2: async () => {\n" +
  "\t\treturn showAlert('hey')\n" +
  "\t}\n" +
  "}";

export default {
  createJSFile: () => {
    cy.get(explorer.createNew).click({ force: true });
    cy.get(explorer.newJSObject).click({ force: true });
    // assert api call
    cy.wait("@createNewJSCollection").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );
    // assert default file text
    cy.get(".js-editor")
      .readCodeInput()
      .then((value) => {
        expect(value).to.equal(defaultFileText);
      });
    // TODO assert run dropdown
  },
  editJSFile: (value) => {
    cy.get(".js-editor").updateCodeInput(value);
    // asset api call
    cy.wait("@editJSCollection").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    // assert file text
    cy.get(".js-editor")
      .readCodeInput()
      .then((codeInput) => {
        expect(codeInput).to.equal(value);
      });
    // TODO assert run dropdown
  },
  copyFileTo: (pageName) => {
    let nameOfFile = "";
    cy.get(".t--nameOfJSObject")
      .invoke("text")
      .then((text) => {
        nameOfFile = text;
      });
    cy.get(".t--more-action-menu").click({ force: true });
    cy.get(apiwidget.copyTo).click({ force: true });
    cy.get(`.single-select >div:contains(${pageName})`).click({ force: true });
    // assert api call
    cy.wait("@createNewJSCollection").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );
    // assert name and contents
    cy.get(".t--nameOfJSObject")
      .invoke("text")
      .then((text) => {
        expect(text).to.eq(`${nameOfFile}Copy`);
      });
  },
  moveFileTo: (pageName) => {
    cy.get(".t--more-action-menu").click({ force: true });
    cy.get(apiwidget.moveTo).click({ force: true });
    cy.get(`.single-select >div:contains(${pageName})`).click({ force: true });
    // assert api call
    cy.wait("@moveJSCollection").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
  },
  deleteFile: () => {
    cy.get(".t--more-action-menu").click({ force: true });
    cy.get(apiwidget.deleteAPI).click({ force: true });
    cy.wait("@deleteJSCollection").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
  },
};
