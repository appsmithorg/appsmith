import type { APP_MODE } from "entities/App";

export default abstract class URLRedirect {
  protected _mode: APP_MODE;
  constructor(mode: APP_MODE) {
    this._mode = mode;
  }
  // TODO: Fix this the next time the file is edited
  /* eslint-disable @typescript-eslint/no-explicit-any */
  abstract generateRedirectURL(
    basePageId: string,
    basePageIdInUrl?: string,
  ): any;
  /* eslint-enable @typescript-eslint/no-explicit-any */
}
