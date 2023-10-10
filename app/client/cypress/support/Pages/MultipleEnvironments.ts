import { agHelper, dataSources } from "../Objects/ObjectsCore";
import { ObjectsRegistry } from "../Objects/Registry";

export class MultipleEnvironments {
  private agHelper = ObjectsRegistry.AggregateHelper;
  private locator = ObjectsRegistry.CommonLocators;
  private dataManager = ObjectsRegistry.DataManager;

  public env_switcher = '[data-testid="t--switch-env"]';
  public env_switcher_dropdown_opt_prod =
    '[data-testid="t--switch-env-dropdown-option-production"]';
  public env_switcher_dropdown_opt_stage =
    '[data-testid="t--switch-env-dropdown-option-staging"]';
  public ds_data_filter_disabled = '[data-testid="t--filter-disabled"]';
  public ds_data_dropdown_tooltip = '[data-testid="t--switch-env-tooltip"]';
  public env_switcher_dropdown_opt = (envName: string) =>
    `[data-testid="t--switch-env-dropdown-option-${envName}"]`;
  public ds_review_mode_configs = (envName: string) =>
    `[data-testid="t--review-section-${envName}"]`;

  public SwitchEnv(targetEnv: string) {
    this.agHelper
      .GetElement(this.env_switcher)
      .eq(0)
      .invoke("text")
      .then((text: string) => {
        if (text.toLowerCase() === targetEnv.toLowerCase()) {
          cy.log("Already in target env");
        } else {
          cy.log(
            `Currently in ${text
              .toString()
              .toLowerCase()} Switching to target env: ${targetEnv.toLowerCase()}`,
          );
          this.agHelper.GetNClick(this.env_switcher);
          this.agHelper.GetNClick(this.env_switcher_dropdown_opt(targetEnv));
          this.agHelper.Sleep();
          this.agHelper.AssertElementExist(
            this.locator._specificToast(
              `Environment switched to ${targetEnv.toLowerCase()}`,
            ),
          );
        }
      });
    agHelper.Sleep(3000); // adding wait for page to load
  }

  public SwitchEnvInDSEditor(
    target_environment = this.dataManager.defaultEnviorment,
  ) {
    this.agHelper.GetNClick(
      this.locator.ds_editor_env_filter(target_environment),
    );
    this.agHelper.AssertSelectedTab(
      this.locator.ds_editor_env_filter(target_environment),
      "true",
    );
  }

  public VerifyEnvDetailsInReviewMode(
    dsName: "PostgreSQL" | "MongoDB",
    envName: string,
  ) {
    this.agHelper.AssertElementExist(this.ds_review_mode_configs(envName));
    dataSources.ValidateReviewModeConfig(dsName, envName);
  }

  //#endregion
}
