import * as _ from "../../../../support/Objects/ObjectsCore";

describe("In-app embed settings", () => {
  function ValidateSnippetUrl(
    locator: string,
    selectedMethod: string,
    showNavBar: boolean,
    isInviteModal?: boolean,
  ) {
    const restMethods = ["oidc", "saml", "google"].filter(
      (method) => method !== selectedMethod,
    );
    cy.get(locator).should("contain", `ssoTrigger=${selectedMethod}`);
    restMethods.forEach((method) => {
      cy.get(locator).should("not.contain", `ssoTrigger=${method}`);
    });
    if (showNavBar) {
      cy.get(locator).should("not.contain", `embed=true`);
    } else {
      cy.get(locator).should("contain", `embed=true`);
    }
    if (isInviteModal) {
      cy.get(_.inviteModal.locators._previewEmbed)
        .should("have.attr", "href")
        .and("include", `ssoTrigger=${selectedMethod}`);
    }
  }

  it("1. Validate embed URL based on SSO method chosen when navigation bar is hidden on Invite Modal", () => {
    _.inviteModal.OpenShareModal();
    _.inviteModal.SelectEmbedTab();
    _.embedSettings.ToggleShowNavigationBar("true");

    cy.get(_.inviteModal.locatorsEE._docLink).should(
      "have.attr",
      "href",
      "https://docs.appsmith.com/advanced-concepts/embed-appsmith-into-existing-application#embedding-private-apps",
    );

    _.agHelper.GetNClick(_.inviteModal.locatorsEE._inputOIDC);
    ValidateSnippetUrl(_.embedSettings.locators._snippet, "oidc", true, true);

    _.agHelper.GetNClick(_.inviteModal.locatorsEE._inputSAML);
    ValidateSnippetUrl(_.embedSettings.locators._snippet, "saml", true, true);

    _.agHelper.GetNClick(_.inviteModal.locatorsEE._inputGoogle);
    ValidateSnippetUrl(_.embedSettings.locators._snippet, "google", true, true);

    _.inviteModal.CloseModal();
  });

  it("2. Validate embed URL based on SSO method chosen when navigation bar is not hidden on Invite Modal", () => {
    _.inviteModal.OpenShareModal();
    _.inviteModal.SelectEmbedTab();
    _.embedSettings.ToggleShowNavigationBar("false");

    _.agHelper.GetNClick(_.inviteModal.locatorsEE._inputOIDC);
    ValidateSnippetUrl(_.embedSettings.locators._snippet, "oidc", false, true);

    _.agHelper.GetNClick(_.inviteModal.locatorsEE._inputSAML);
    ValidateSnippetUrl(_.embedSettings.locators._snippet, "saml", false, true);

    _.agHelper.GetNClick(_.inviteModal.locatorsEE._inputGoogle);
    ValidateSnippetUrl(
      _.embedSettings.locators._snippet,
      "google",
      false,
      true,
    );

    _.inviteModal.CloseModal();
  });

  it("3. Validate embed URL based on SSO method chosen when navigation bar is hidden on App Settings", () => {
    _.embedSettings.OpenEmbedSettings();
    _.embedSettings.ToggleShowNavigationBar("true");

    cy.get(_.inviteModal.locatorsEE._docLink).should(
      "have.attr",
      "href",
      "https://docs.appsmith.com/advanced-concepts/embed-appsmith-into-existing-application#embedding-private-apps",
    );

    _.agHelper.GetNClick(_.inviteModal.locatorsEE._inputOIDC);
    ValidateSnippetUrl(_.embedSettings.locators._snippet, "oidc", true);

    _.agHelper.GetNClick(_.inviteModal.locatorsEE._inputSAML);
    ValidateSnippetUrl(_.embedSettings.locators._snippet, "saml", true);

    _.agHelper.GetNClick(_.inviteModal.locatorsEE._inputGoogle);
    ValidateSnippetUrl(_.embedSettings.locators._snippet, "google", true);

    _.appSettings.ClosePane();
  });

  it("4. Validate embed URL based on SSO method chosen when navigation bar is not hidden on App Settings", () => {
    _.embedSettings.OpenEmbedSettings();
    _.embedSettings.ToggleShowNavigationBar("false");

    _.agHelper.GetNClick(_.inviteModal.locatorsEE._inputOIDC);
    ValidateSnippetUrl(_.embedSettings.locators._snippet, "oidc", false);

    _.agHelper.GetNClick(_.inviteModal.locatorsEE._inputSAML);
    ValidateSnippetUrl(_.embedSettings.locators._snippet, "saml", false);

    _.agHelper.GetNClick(_.inviteModal.locatorsEE._inputGoogle);
    ValidateSnippetUrl(_.embedSettings.locators._snippet, "google", false);

    _.appSettings.ClosePane();
  });

  it("5. Check when make application public is enabled SSO methods are not displayed on Share Modal", () => {
    _.inviteModal.OpenShareModal();
    _.inviteModal.enablePublicAccessViaInviteTab("true");
    _.inviteModal.SelectEmbedTab();

    _.agHelper.AssertElementAbsence(_.inviteModal.locatorsEE._ssoMethods);
    cy.get(_.embedSettings.locators._snippet).should(
      "not.contain",
      "ssoTrigger=",
    );
    cy.get(_.inviteModal.locators._previewEmbed)
      .should("have.attr", "href")
      .and("not.include", `ssoTrigger=`);

    _.inviteModal.enablePublicAccessViaInviteTab("false");
    _.inviteModal.CloseModal();
  });

  it("6. Check when make application public is enabled SSO methods are not displayed on App Settings", () => {
    _.embedSettings.OpenEmbedSettings();
    _.agHelper.GetNClick(
      "[data-testid='t--embed-settings-application-public']",
    );

    _.agHelper.AssertElementAbsence(_.inviteModal.locatorsEE._ssoMethods);
    cy.get(_.embedSettings.locators._snippet).should(
      "not.contain",
      "ssoTrigger=",
    );

    _.agHelper.GetNClick(
      "[data-testid='t--embed-settings-application-public']",
    );
    _.appSettings.ClosePane();
  });
});
