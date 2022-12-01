import { APP_MODE } from "entities/App";

export default abstract class URLRedirect {
  protected _mode: APP_MODE;
  constructor(mode: APP_MODE) {
    this._mode = mode;
  }
  abstract generateRedirectURL(pageId: string, pageIdInUrl?: string): any;
}
