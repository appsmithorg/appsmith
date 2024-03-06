import * as _ from "../../../../support/Objects/ObjectsCore";
import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";

describe("In-app embed settings", { tags: ["@tag.Settings"] }, () => {
  before(() => {
    featureFlagIntercept({
      release_embed_hide_share_settings_enabled: true,
      license_private_embeds_enabled: true,
    });
  });

  function ValidateSnippetUrl(
    locator: string,
    selectedMethod: string,
    showNavBar: boolean,
    isInviteModal?: boolean,
  ) {
    const restMethods = ["oidc", "saml"].filter(
      (method) => method !== selectedMethod,
    );
    cy.get(locator).should("contain", `ssoTrigger=${selectedMethod}`);
    restMethods.forEach((method) => {
      cy.get(locator).should("not.contain", `ssoTrigger=${method}`);
    });
    cy.get(locator).should("contain", `embed=true`);
    if (showNavBar) {
      cy.get(locator).should("contain", `navbar=true`);
    } else {
      cy.get(locator).should("not.contain", `navbar=true`);
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
    _.embedSettings.ToggleShowNavigationBar("On");

    cy.get(_.inviteModal.locatorsEE._docLink).should(
      "have.attr",
      "href",
      "https://docs.appsmith.com/advanced-concepts/embed-appsmith-into-existing-application#embedding-private-apps",
    );

    _.agHelper.GetNClick(_.inviteModal.locatorsEE._inputOIDC);
    ValidateSnippetUrl(_.embedSettings.locators._snippet, "oidc", true, true);

    _.agHelper.GetNClick(_.inviteModal.locatorsEE._inputSAML);
    ValidateSnippetUrl(_.embedSettings.locators._snippet, "saml", true, true);

    _.inviteModal.CloseModal();
  });

  it("2. Validate embed URL based on SSO method chosen when navigation bar is not hidden on Invite Modal", () => {
    _.inviteModal.OpenShareModal();
    _.inviteModal.SelectEmbedTab();
    _.embedSettings.ToggleShowNavigationBar("Off");

    _.agHelper.GetNClick(_.inviteModal.locatorsEE._inputOIDC);
    ValidateSnippetUrl(_.embedSettings.locators._snippet, "oidc", false, true);

    _.agHelper.GetNClick(_.inviteModal.locatorsEE._inputSAML);
    ValidateSnippetUrl(_.embedSettings.locators._snippet, "saml", false, true);

    _.inviteModal.CloseModal();
  });

  it("3. Validate embed URL based on SSO method chosen when navigation bar is hidden on App Settings", () => {
    _.embedSettings.OpenEmbedSettings();
    _.embedSettings.ToggleShowNavigationBar("On");

    cy.get(_.inviteModal.locatorsEE._docLink).should(
      "have.attr",
      "href",
      "https://docs.appsmith.com/advanced-concepts/embed-appsmith-into-existing-application#embedding-private-apps",
    );

    _.agHelper.GetNClick(_.inviteModal.locatorsEE._inputOIDC);
    ValidateSnippetUrl(_.embedSettings.locators._snippet, "oidc", true);

    _.agHelper.GetNClick(_.inviteModal.locatorsEE._inputSAML);
    ValidateSnippetUrl(_.embedSettings.locators._snippet, "saml", true);

    _.appSettings.ClosePane();
  });

  it("4. Validate embed URL based on SSO method chosen when navigation bar is not hidden on App Settings", () => {
    _.embedSettings.OpenEmbedSettings();
    _.embedSettings.ToggleShowNavigationBar("Off");

    _.agHelper.GetNClick(_.inviteModal.locatorsEE._inputOIDC);
    ValidateSnippetUrl(_.embedSettings.locators._snippet, "oidc", false);

    _.agHelper.GetNClick(_.inviteModal.locatorsEE._inputSAML);
    ValidateSnippetUrl(_.embedSettings.locators._snippet, "saml", false);

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
  it("7. Check ramps are enabled / disabled based on Feature Flag", () => {
    featureFlagIntercept({
      license_private_embeds_enabled: false,
    });
    _.inviteModal.OpenShareModal();
    _.inviteModal.SelectEmbedTab();
    _.agHelper.GetNAssertElementText(
      _.inviteModal.locators._privateEmbedRampAppSettings,
      "Embed private Appsmith apps and seamlessly authenticate users through SSO in our Business Edition",
      "contain.text",
    );
    _.inviteModal.CloseModal();
    _.embedSettings.OpenEmbedSettings();
    _.agHelper.AssertElementExist(_.inviteModal.locators._upgradeContent);
    _.agHelper.AssertElementAbsence(
      _.inviteModal.locators._shareSettingsButton,
    );
    _.agHelper.GetNAssertElementText(
      _.inviteModal.locators._privateEmbedRampAppSettings,
      "To embed private Appsmith apps and seamlessly authenticate users through SSO",
      "contain.text",
    );
  });
});
