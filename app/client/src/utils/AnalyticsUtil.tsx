export type EventName =
  | "PAGE_VIEW"
  | "ADD_COMPONENT"
  | "DELETE_COMPONENT"
  | "RESIZE_COMPONENT";
export type Gender = "MALE" | "FEMALE";
export interface User {
  userId: string;
  name: string;
  email: string;
  gender: Gender;
}

class AnalyticsUtil {
  static initializeHotjar(id: string, sv: string) {
    (function init(h: any, o: any, t: any, j: any, a?: any, r?: any) {
      h.hj =
        h.hj ||
        function() {
          (h.hj.q = h.hj.q || []).push(arguments); //eslint-disable-line prefer-rest-params
        };
      h._hjSettings = { hjid: id, hjsv: sv };
      a = o.getElementsByTagName("head")[0];
      r = o.createElement("script");
      r.async = 1;
      r.src = t + h._hjSettings.hjid + j + h._hjSettings.hjsv;
      a.appendChild(r);
    })(window, document, "//static.hotjar.com/c/hotjar-", ".js?sv=");
  }

  static initializeSegment() {
    (function init(window: any) {
      const analytics = (window.analytics = window.analytics || []);
      if (!analytics.initialize) {
        if (analytics.invoked) {
          window.console &&
            console.error &&
            console.error("Segment snippet included twice.");
        } else {
          analytics.invoked = !0;
          analytics.methods = [
            "trackSubmit",
            "trackClick",
            "trackLink",
            "trackForm",
            "pageview",
            "identify",
            "reset",
            "group",
            "track",
            "ready",
            "alias",
            "debug",
            "page",
            "once",
            "off",
            "on",
          ];
          analytics.factory = function(t: any) {
            return function() {
              const e = Array.prototype.slice.call(arguments); //eslint-disable-line prefer-rest-params
              e.unshift(t);
              analytics.push(e);
              return analytics;
            };
          };
        }
        for (let t: any = 0; t < analytics.methods.length; t++) {
          const e = analytics.methods[t];
          analytics[e] = analytics.factory(e);
        }
        analytics.load = function(t: any, e: any) {
          const n = document.createElement("script");
          n.type = "text/javascript";
          n.async = !0;
          n.src =
            "https://cdn.segment.com/analytics.js/v1/" +
            t +
            "/analytics.min.js";
          const a: any = document.getElementsByTagName("script")[0];
          a.parentNode.insertBefore(n, a);
          analytics._loadOptions = e;
        };
        analytics.SNIPPET_VERSION = "4.1.0";
        analytics.load("O7rsLdWq7fhJI9rYsj1eatGAjuULTmfP");
        analytics.page();
      }
    })(window);
  }

  static logEvent(eventName: EventName, eventData: any) {
    const windowDoc: any = window;
    windowDoc.analytics.track(eventName, eventData);
  }

  static identifyUser(userId: string, userData: User) {
    const windowDoc: any = window;
    windowDoc.analytics.identify(userId, userData);
  }
}

export default AnalyticsUtil;
