import { ObjectsRegistry } from "../Objects/Registry";

// Edit mode modal
export class InviteModal {
  private agHelper = ObjectsRegistry.AggregateHelper;
  private embedSettings = ObjectsRegistry.EmbedSettings;
  private deployPage = ObjectsRegistry.DeployMode;
  private commonLocators = ObjectsRegistry.CommonLocators;

  private locators = {
    _inviteTab: "[data-cy='t--tab-INVITE']",
    _embedTab: "[data-cy='t--tab-EMBED']",
    _shareButton: ".t--application-share-btn",
    _closeButton: ".t--close-form-dialog",
    _previewEmbed: "[data-cy='preview-embed']",
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
