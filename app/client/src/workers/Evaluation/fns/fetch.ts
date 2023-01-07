import { addFn } from "./utils/fnGuard";

const _originalFetch = self.fetch;

export default function initFetch() {
  function fetch(...args: any) {
    const request = new Request(args[0], { ...args[1], credentials: "omit" });
    return _originalFetch(request);
  }
  addFn(self, "fetch", fetch);
}
