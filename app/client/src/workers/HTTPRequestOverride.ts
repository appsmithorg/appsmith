import * as fetchIntercept from "fetch-intercept";

const xhrSend = XMLHttpRequest.prototype.send;

export default function interceptAndOverrideHttpRequest() {
  XMLHttpRequest.prototype.send = function(...args) {
    this.withCredentials = false;
    return xhrSend.apply(this, args);
  };

  return fetchIntercept.register({
    request: function(...args) {
      const request = new Request(args[0], { ...args[1], credentials: "omit" });
      return [request];
    },
  });
}
