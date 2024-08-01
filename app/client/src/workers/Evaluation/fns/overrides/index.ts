import { setInterval, clearInterval } from "./interval";
import { setTimeout, clearTimeout } from "./timeout";
import { fetch } from "./fetch";
import { addFn } from "../utils/fnGuard";
import userLogs from "./console";
import initLocalStorage from "./localStorage";

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
