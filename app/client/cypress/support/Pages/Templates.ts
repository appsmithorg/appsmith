// Edit mode modal
export class Templates {
  public locators = {
    _forkApp: ".t--fork-template",
    _templateCard: "[data-testid='template-card']",
    _templatesSearchInput: "[data-testid='t--application-search-input']",
    _resultsHeader: "[data-testid='t--application-templates-results-header']",
    _templateViewGoBack: "[data-testid='t--template-view-goback']",
    templateDialogBox: "[data-testid=t--templates-dialog-component]",
    templateDialogCloseButton: ".ads-v2-modal__content-header-close-button",
  };

  ForkTemplateByName(name: string) {
    cy.contains(this.locators._templateCard, name)
      .find(this.locators._forkApp)
      .click();
  }

  filterTemplatesByName(query: string) {
    return cy.get(this.locators._templatesSearchInput).type(query);
  }

  filterTemplatesByFunctions(valuesToBeChecked: string[]) {
    return cy
      .get("input[type='checkbox']")
      .check(valuesToBeChecked, { force: true });
  }

  visitFirstTemplate() {
    return cy.get(this.locators._templateCard).first().click();
  }

  gobackFromTemplateDetailedView() {
    return cy.get(this.locators._templateViewGoBack).click();
  }
  closeTemplateDialogBox() {
    return cy.get(this.locators.templateDialogCloseButton).click();
  }
}
