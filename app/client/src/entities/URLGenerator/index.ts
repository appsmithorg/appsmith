import { APP_MODE } from "entities/App";

export default abstract class URLGenerator {
  protected _mode: APP_MODE;
  constructor(mode: APP_MODE) {
    this._mode = mode;
  }
  abstract generateURL(pageId: string, pageIdInUrl?: string): any;
}
