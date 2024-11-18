class Response {
  private locators = {
    responseTab: "//button[@data-testid='t--tab-RESPONSE_TAB']",
    responseDataContainer: "[data-testid='t--query-response-data-container']",
    responseTypeMenuTrigger: "[data-testid='t--query-response-type-trigger']",
    responseType(type: string): string {
      return `//div[@data-testid='t--response-tab-segmented-control']//span[text()='${type}']`;
    },
    responseTypeMenuItem(type: string): string {
      return `//div[@data-testid='t--query-response-type-menu-item' and @data-value='${type}']`;
    },
  };

  /** @deprecated */
  public getResponseTypeSelector = this.locators.responseType;

  public getResponseTypeMenuItem = this.locators.responseTypeMenuItem;

  public switchToResponseTab(): void {
    cy.xpath(this.locators.responseTab).click({ force: true });
  }

  public openResponseTypeMenu() {
    cy.get(this.locators.responseDataContainer).realHover();
    cy.get(this.locators.responseTypeMenuTrigger).realClick();
  }

  public selectResponseResponseTypeFromMenu(type: string): void {
    this.switchToResponseTab();
    this.openResponseTypeMenu();
    cy.xpath(this.locators.responseTypeMenuItem(type)).realClick();
  }

  public switchResponseType(type: string): void {
    this.switchToResponseTab();
    cy.xpath(this.locators.responseType(type)).click({ force: true });
  }

  // TODO: Implement this method when response UI is ready
  public validateRecordCount(count: number): void {}
}

export { Response };
