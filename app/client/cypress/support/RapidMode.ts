class RapidModeConfig {
  config: Record<string, any>;
  static _instance: RapidModeConfig;

  private constructor() {
    this.config = Cypress.env("RAPID_MODE") || {};
  }

  static getInstance() {
    if (!RapidModeConfig._instance) {
      RapidModeConfig._instance = new RapidModeConfig();
    }

    return RapidModeConfig._instance;
  }

  url() {
    const appName = this.config.appName;
    const pageName = this.config.pageName;
    const pageID = this.config.pageID;
    const parsedURL = this.config.url;

    if (parsedURL.length > 0) {
      return parsedURL;
    } else {
      return `app/${appName}/${pageName}-${pageID}/edit`;
    }
  }
}

const RapidMode = RapidModeConfig.getInstance();

export default RapidMode;
