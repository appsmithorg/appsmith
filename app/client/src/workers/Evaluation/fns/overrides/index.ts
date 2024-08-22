import { addFn } from "../utils/fnGuard";
import userLogs from "./console";
import { fetch } from "./fetch";
import { clearInterval, setInterval } from "./interval";
import initLocalStorage from "./localStorage";
import { clearTimeout, setTimeout } from "./timeout";

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function overrideWebAPIs(ctx: any) {
  userLogs.overrideConsoleAPI();
  addFn(ctx, "setInterval", setInterval);
  addFn(ctx, "clearInterval", clearInterval);
  addFn(ctx, "setTimeout", setTimeout);
  addFn(ctx, "clearTimeout", clearTimeout);
  addFn(ctx, "fetch", fetch);
  initLocalStorage.call(ctx);
}
