// Edit mode modal
export class Templates {
  public locators = {
    _forkApp: ".t--fork-template",
    _templateCard: "[data-testid='template-card']",
    _closeTemplateDialogBoxBtn: ".ads-v2-modal__content-header-close-button",
  };

  ForkTemplateByName(name: string) {
    cy.contains(this.locators._templateCard, name)
      .find(this.locators._forkApp)
      .click();
  }
}
