import { ObjectsRegistry } from "../Objects/Registry";

// Edit mode modal
export class Templates {
  private agHelper = ObjectsRegistry.AggregateHelper;
  private homePage = ObjectsRegistry.HomePage;
  public locators = {
    _templatesTab: ".t--templates-tab",
    _forkApp: ".t--fork-template",
    _templateCard: "[data-testid='template-card']",
    _closeTemplateDialogBoxBtn: ".ads-v2-modal__content-header-close-button",
    _requestForTemplateBtn: "span:contains('Request for a template')",
  };

  ForkTemplateByName(name: string) {
    cy.contains(this.locators._templateCard, name)
      .find(this.locators._forkApp)
      .click();
  }

  GetTemplatesCardsList() {
    return cy.get(this.locators._templateCard);
  }

  public SwitchToTemplatesTab() {
    this.homePage.NavigateToHome();
    this.agHelper.GetNClick(this.locators._templatesTab);
    this.agHelper.AssertElementVisible(
      this.locators._requestForTemplateBtn,
      0,
      30000,
    ); //giving more time here for templates page to fully load, since there is no intercept validation for same
  }
}
