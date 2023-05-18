import HomePage from "../../locators/HomePage";
import { ObjectsRegistry } from "../Objects/Registry";

// Edit mode modal
export class InviteModal {
  private agHelper = ObjectsRegistry.AggregateHelper;
  private embedSettings = ObjectsRegistry.EmbedSettings;
  private deployPage = ObjectsRegistry.DeployMode;
  private commonLocators = ObjectsRegistry.CommonLocators;

  public locators = {
    _inviteTab: "[data-cy='t--tab-INVITE']",
    _embedTab: "[data-cy='t--tab-EMBED']",
    _shareButton: ".t--application-share-btn",
    _closeButton: ".t--close-form-dialog",
    _previewEmbed: "[data-cy='preview-embed']",
    _shareSettingsButton: "[data-testid='t--share-settings-btn']",
    _upgradeButton: "[data-testid='t--upgrade-btn']",
    _upgradeContent: "[data-testid='t--upgrade-content']",
    _restrictionChange: "[data-testid='t--change-embedding-restriction']",
  };

  public SelectInviteTab() {
    this.agHelper.GetNClick(this.locators._inviteTab);
  }

  public SelectEmbedTab() {
    this.agHelper.GetNClick(this.locators._embedTab);
  }

  public OpenShareModal() {
    this.agHelper.GetNClick(this.locators._shareButton);
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
    cy.wait(10000);
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
