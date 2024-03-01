import { GitSync } from "./GitSync";

export class GitExtended extends GitSync {
  // git cd
  public _settingsTabCD = "[data-testid='t--tab-CD']";
  public _cdSetup = "[data-testid='t--cd-setup']";
  public _cdExisting = "[data-testid='t--cd-existing']";
  public _cdSetupBranchSelect = "[data-testid='t--cd-branch-select']";
  public _cdGenerateApiKeyBtn = "[data-testid='t--cd-generate-api-key-btn']";
  public _cdApiKeyDisplay = "[data-testid='t--cd-api-key-display']";
  public _cdApiKeyCopyBtn = "[data-testid='t--copy-cd-api-key-btn']";
  public _cdCurlDisplay = "[data-testid='t--cd-curl-display']";
  public _cdCurlCopyBtn = "[data-testid='t--copy-cd-curl-btn']";
  public _cdConfirmSetupCheckbox =
    "[data-testid='t--cd-confirm-setup-checkbox']";
  public _cdFinishSetupBtn = "[data-testid='t--cd-finish-setup-btn']";
  public _cdDisableBtn = "[data-testid='t--cd-disable-btn']";
  public _cdDisableModal = "[data-testid='t--cd-disable-modal']";
  public _cdDisableConfirmCheckbox =
    "[data-testid='t--cd-disable-confirm-checkbox']";
  public _cdDisableConfirmBtn = "[data-testid='t--cd-disable-confirm-btn']";
  public _cdReconfigureKeyModal = "[data-testid='t--cd-reconfigure-key-modal']";
  public _cdReconfigureKeyBtn = "[data-testid='t--cd-reconfigure-key-btn']";

  SelectOptionFromCDBranchDropdown(branch: string) {
    this.agHelper.GetNClick(this._cdSetupBranchSelect);
    this.agHelper.GetNClickByContains(".rc-select-dropdown", branch);
  }

  ConfigureCD() {
    const generateCDApiKeyAlias = `generateCDApiKey`;
    const finishSetupAlias = `finishCDSetup`;
    cy.intercept("POST", "/api/v1/api-key/git/*").as(generateCDApiKeyAlias);
    cy.intercept("PATCH", "/api/v1/git/auto-deployment/toggle/app/*").as(
      finishSetupAlias,
    );
    this.OpenGitSettingsModal("CD");
    this.agHelper.GetNClick(this._cdGenerateApiKeyBtn);
    let bearerToken = "";
    let cURL = "";
    this.agHelper.GetText(this._cdCurlDisplay, "text", 0).then((dApiKey) => {
      cURL = dApiKey?.toString() || "";
    });
    cy.wait(`@${generateCDApiKeyAlias}`).then((interception) => {
      expect(interception?.response?.statusCode).to.equal(201);
      bearerToken = interception?.response?.body?.data;
    });
    this.agHelper.AssertElementEnabledDisabled(
      this._cdConfirmSetupCheckbox,
      0,
      false,
    );
    this.agHelper.AssertElementEnabledDisabled(this._cdFinishSetupBtn, 0, true);
    this.agHelper.GetNClick(this._cdConfirmSetupCheckbox, 0, true);
    this.agHelper.AssertElementEnabledDisabled(
      this._cdFinishSetupBtn,
      0,
      false,
    );
    this.agHelper.GetNClick(this._cdFinishSetupBtn);
    cy.wait(`@${finishSetupAlias}`).then((interception) => {
      expect(interception?.response?.statusCode).to.equal(200);
    });
    this.agHelper.AssertElementExist(this._cdExisting);
    this.CloseGitSettingsModal();
    return cy.wrap({ bearerToken, cURL });
  }
}

export default GitExtended;
