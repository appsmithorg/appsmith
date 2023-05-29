import HomePage from "../../locators/HomePage";
import { ObjectsRegistry } from "../Objects/Registry";

// Edit mode modal
export class InviteModal {
  private agHelper = ObjectsRegistry.AggregateHelper;
  private embedSettings = ObjectsRegistry.EmbedSettings;
  private deployPage = ObjectsRegistry.DeployMode;
  private commonLocators = ObjectsRegistry.CommonLocators;

  public locators = {
    _inviteTab: "[data-testid='t--tab-INVITE']",
    _embedTab: "[data-testid='t--tab-EMBED']",
    _shareButton: ".t--application-share-btn",
    _closeButton: ".ads-v2-modal__content-header-close-button",
    _previewEmbed: "[data-testid='preview-embed']",
    _shareSettingsButton: "[data-testid='t--share-settings-btn']",
    _upgradeButton: "[data-testid='t--upgrade-btn']",
    _upgradeContent: "[data-testid='t--upgrade-content']",
    _restrictionChange: "[data-testid='t--change-embedding-restriction']",
  };

  public locatorsEE = {
    _inputOIDC: "input[value='oidc']",
    _inputSAML: "input[value='saml']",
    _inputGoogle: "input[value='google']",
    _docLink: "[data-testid='t--documentation-link']",
    _ssoMethods: "[data-testid='t--sso-methods]",
  };

  public SelectInviteTab() {
    this.agHelper.GetNClick(this.locators._inviteTab);
  }

  public SelectEmbedTab() {
    this.agHelper.ClickButton("Embed");
  }

  public OpenShareModal() {
    this.agHelper.GetNClick(this.locators._shareButton, 0, true);
  }

  public CloseModal() {
    this.agHelper.GetNClick(this.locators._closeButton);
  }

  public SwitchToInviteTab() {
    this.agHelper.GetNClick(this.locators._shareSettingsButton);
  }

  public enablePublicAccessViaShareSettings(enable: "true" | "false" = "true") {
    this.SelectEmbedTab();
    this.SwitchToInviteTab();
    const input = this.agHelper.GetElement(HomePage.enablePublicAccess);
    input.invoke("attr", "checked").then((value) => {
      if (value !== enable) {
        this.agHelper.GetNClick(HomePage.enablePublicAccess);
        cy.wait("@changeAccess").should(
          "have.nested.property",
          "response.body.responseMeta.status",
          200,
        );
      }
    });
    cy.wait(5000);
    cy.get(HomePage.editModeInviteModalCloseBtn).first().click({ force: true });
  }

  public enablePublicAccessViaInviteTab(enable: "true" | "false" = "true") {
    this.SelectInviteTab();
    const input = this.agHelper.GetElement(HomePage.enablePublicAccess);
    input.invoke("attr", "checked").then((value) => {
      if (value !== enable) {
        this.agHelper.GetNClick(HomePage.enablePublicAccess);
        cy.wait("@changeAccess").should(
          "have.nested.property",
          "response.body.responseMeta.status",
          200,
        );
      }
    });
    cy.wait(4000);
  }

  public ValidatePreviewEmbed(toShowNavBar: "true" | "false" = "true") {
    this.OpenShareModal();
    this.SelectEmbedTab();
    this.embedSettings.ToggleShowNavigationBar(toShowNavBar);
    cy.get(this.locators._previewEmbed).invoke("removeAttr", "target").click();
    if (toShowNavBar === "true") {
      this.agHelper.AssertElementExist(this.commonLocators._backToEditor);
      this.deployPage.NavigateBacktoEditor();
    } else {
      this.agHelper.AssertElementAbsence(this.commonLocators._backToEditor);
      cy.go("back");
    }
  }
}
