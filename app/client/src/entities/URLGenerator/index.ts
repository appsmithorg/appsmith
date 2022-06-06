import { ApplicationVersion } from "actions/applicationActions";
import { APP_MODE } from "entities/App";

export default abstract class URLGenerator {
  protected _applicationVersion: ApplicationVersion;
  protected _mode: APP_MODE;
  constructor(applicationVersion: ApplicationVersion, mode: APP_MODE) {
    this._applicationVersion = applicationVersion;
    this._mode = mode;
  }
  abstract generateURL(pageId: string, pageIdInUrl?: string): any;
}
