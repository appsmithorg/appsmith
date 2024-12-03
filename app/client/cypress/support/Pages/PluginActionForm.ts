import { PluginEditorToolbar } from "./IDE/PluginEditorToolbar";

export class PluginActionForm {
  public readonly locators = {
    actionRunButton: "[data-testid='t--run-action']",
    actionContextMenuTrigger: "[data-testid='t--more-action-trigger']",
    actionSettingsTrigger: "[data-testid='t--action-settings-trigger']",
  };

  public readonly toolbar: PluginEditorToolbar;

  constructor() {
    this.toolbar = new PluginEditorToolbar(
      this.locators.actionRunButton,
      this.locators.actionSettingsTrigger,
      this.locators.actionContextMenuTrigger,
    );
  }
}
