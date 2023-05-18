import { setInterval, clearAllIntervals } from "./interval";
import { setTimeout, clearTimeout } from "./timeout";
import { fetch } from "./fetch";
import { addFn } from "../utils/fnGuard";
import userLogs from "./console";
import initLocalStorage from "./localStorage";

export function overrideWebAPIs(ctx: any) {
  userLogs.overrideConsoleAPI();
  addFn(ctx, "setInterval", setInterval);
  addFn(ctx, "clearInterval", clearAllIntervals);
  addFn(ctx, "setTimeout", setTimeout);
  addFn(ctx, "clearTimeout", clearTimeout);
  addFn(ctx, "fetch", fetch);
  initLocalStorage.call(ctx);
}
