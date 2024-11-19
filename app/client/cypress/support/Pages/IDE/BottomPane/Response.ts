class Response {
  public locators = {
    responseTab: "[data-testid='t--tab-RESPONSE_TAB']",
    responseDataContainer: "[data-testid='t--query-response-data-container']",
    responseTypeMenuTrigger: "[data-testid='t--query-response-type-trigger']",

    /** @deprecated */
    responseType(type: string): string {
      return `//div[@data-testid='t--response-tab-segmented-control']//span[text()='${type}']`;
    },

    responseTypeMenuItem(type: string) {
      return `div[data-testid="t--query-response-type-menu-item"][data-value="${type}"]`;
    },
  };

  /** @deprecated */
  public getResponseTypeSelector = this.locators.responseType;

  /** @deprecated */
  public switchResponseType(type: string): void {
    this.switchToResponseTab();
    cy.xpath(this.locators.responseType(type)).click({ force: true });
  }

  public switchToResponseTab(): void {
    cy.get(this.locators.responseTab).click({ force: true });
  }

  public openResponseTypeMenu() {
    cy.get(this.locators.responseDataContainer).realHover();
    cy.get(this.locators.responseTypeMenuTrigger).realClick();
  }

  public selectResponseResponseTypeFromMenu(type: string): void {
    this.switchToResponseTab();
    this.openResponseTypeMenu();
    cy.get(this.locators.responseTypeMenuItem(type)).realClick();
  }

  public closeResponseTypeMenu() {
    cy.get("body").realClick({ x: 0, y: 0 });
  }

  // TODO: Implement this method when response UI is ready
  public validateRecordCount(count: number): void {}
}

export { Response };
