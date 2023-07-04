/**
 * Sample configuration to be appended to app/client/cypress.env.json file
 * Documentation on using it is here : https://github.com/appsmithorg/appsmith/blob/release/contributions/docs/TestAutomation.md
 * 
 * "RAPID_MODE": {
        "enabled" : true, // Set it to true to enable rapid mode, otherwise set it to false
        "appName": "5f8e1666", // Pass your app name here. Given value is a sample value for reference
        "pageName": "page-1", // Pass your page name here. Given value is a sample value for reference
        "pageID": "64635173cc2cee025a77f489", // Pass your PageID here. Given value is a sample value for reference
        "url": "https://dev.appsmith.com/app/5f8e1666/page1-64635173cc2cee025a77f489/edit", // You can choose to pass in url of your app instead of individual parameters above.
        "usesDSL": true // Set it to false, if your test doesn't use DSL. If your test uses DSL, you can choose to enable this flag to skip multiple visits to the workspace page.
      }
 */
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
