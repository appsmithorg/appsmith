import Alloy from "alloy-frontend";
import { getCurrentAppWorkspace } from "ee/selectors/selectedWorkspaceSelectors";
import store from "store";

export default class AlloyUtils {
  static alloy = new Alloy();
  static integrations: any;
  static workflows: any;
  static token: any;
  static setToken() {
    const state = store.getState();
    const currentWorkspace = getCurrentAppWorkspace(state);
    this.alloy.setToken(currentWorkspace.token);
    this.token = currentWorkspace.token;
  }

  static async getWorkflows() {
    if (!this.token) {
      this.setToken();
    }

    if (!this.workflows) {
      const data = await this.alloy.getWorkflows();
      this.workflows = data;
    }
    return this.workflows;
  }

  static async getIntegrations() {
    if (!this.token) {
      this.setToken();
    }

    if (!this.integrations) {
      const data = await this.alloy.getIntegrations();
      this.integrations = data?.data || [];
    }
    return this.integrations;
  }
}
