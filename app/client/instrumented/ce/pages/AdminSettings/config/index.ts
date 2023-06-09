function cov_1vmkmqxetm() {
  var path = "/Users/apple/github/appsmith/app/client/src/ce/pages/AdminSettings/config/index.ts";
  var hash = "ea66cf925f07b07c771bf59710cf0422911cf504";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/ce/pages/AdminSettings/config/index.ts",
    statementMap: {
      "0": {
        start: {
          line: 11,
          column: 0
        },
        end: {
          line: 11,
          column: 38
        }
      },
      "1": {
        start: {
          line: 12,
          column: 0
        },
        end: {
          line: 12,
          column: 36
        }
      },
      "2": {
        start: {
          line: 13,
          column: 0
        },
        end: {
          line: 13,
          column: 35
        }
      },
      "3": {
        start: {
          line: 14,
          column: 0
        },
        end: {
          line: 14,
          column: 39
        }
      },
      "4": {
        start: {
          line: 15,
          column: 0
        },
        end: {
          line: 15,
          column: 39
        }
      },
      "5": {
        start: {
          line: 16,
          column: 0
        },
        end: {
          line: 16,
          column: 38
        }
      },
      "6": {
        start: {
          line: 17,
          column: 0
        },
        end: {
          line: 17,
          column: 39
        }
      }
    },
    fnMap: {},
    branchMap: {},
    s: {
      "0": 0,
      "1": 0,
      "2": 0,
      "3": 0,
      "4": 0,
      "5": 0,
      "6": 0
    },
    f: {},
    b: {},
    _coverageSchema: "1a1c01bbd47fc00a2c39e90264f33305004495a9",
    hash: "ea66cf925f07b07c771bf59710cf0422911cf504"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_1vmkmqxetm = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_1vmkmqxetm();
import { ConfigFactory } from "pages/Settings/config/ConfigFactory";
import { config as GeneralConfig } from "@appsmith/pages/AdminSettings/config/general";
import { config as EmailConfig } from "pages/Settings/config/email";
import { config as MapsConfig } from "pages/Settings/config/googleMaps";
import { config as VersionConfig } from "pages/Settings/config/version";
import { config as AdvancedConfig } from "pages/Settings/config/advanced";
import { config as Authentication } from "@appsmith/pages/AdminSettings/config/authentication";
import { config as BrandingConfig } from "@appsmith/pages/AdminSettings/config/branding";
cov_1vmkmqxetm().s[0]++;
ConfigFactory.register(GeneralConfig);
cov_1vmkmqxetm().s[1]++;
ConfigFactory.register(EmailConfig);
cov_1vmkmqxetm().s[2]++;
ConfigFactory.register(MapsConfig);
cov_1vmkmqxetm().s[3]++;
ConfigFactory.register(Authentication);
cov_1vmkmqxetm().s[4]++;
ConfigFactory.register(AdvancedConfig);
cov_1vmkmqxetm().s[5]++;
ConfigFactory.register(VersionConfig);
cov_1vmkmqxetm().s[6]++;
ConfigFactory.register(BrandingConfig);
export default ConfigFactory;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfMXZta21xeGV0bSIsImFjdHVhbENvdmVyYWdlIiwiQ29uZmlnRmFjdG9yeSIsImNvbmZpZyIsIkdlbmVyYWxDb25maWciLCJFbWFpbENvbmZpZyIsIk1hcHNDb25maWciLCJWZXJzaW9uQ29uZmlnIiwiQWR2YW5jZWRDb25maWciLCJBdXRoZW50aWNhdGlvbiIsIkJyYW5kaW5nQ29uZmlnIiwicyIsInJlZ2lzdGVyIl0sInNvdXJjZXMiOlsiaW5kZXgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29uZmlnRmFjdG9yeSB9IGZyb20gXCJwYWdlcy9TZXR0aW5ncy9jb25maWcvQ29uZmlnRmFjdG9yeVwiO1xuXG5pbXBvcnQgeyBjb25maWcgYXMgR2VuZXJhbENvbmZpZyB9IGZyb20gXCJAYXBwc21pdGgvcGFnZXMvQWRtaW5TZXR0aW5ncy9jb25maWcvZ2VuZXJhbFwiO1xuaW1wb3J0IHsgY29uZmlnIGFzIEVtYWlsQ29uZmlnIH0gZnJvbSBcInBhZ2VzL1NldHRpbmdzL2NvbmZpZy9lbWFpbFwiO1xuaW1wb3J0IHsgY29uZmlnIGFzIE1hcHNDb25maWcgfSBmcm9tIFwicGFnZXMvU2V0dGluZ3MvY29uZmlnL2dvb2dsZU1hcHNcIjtcbmltcG9ydCB7IGNvbmZpZyBhcyBWZXJzaW9uQ29uZmlnIH0gZnJvbSBcInBhZ2VzL1NldHRpbmdzL2NvbmZpZy92ZXJzaW9uXCI7XG5pbXBvcnQgeyBjb25maWcgYXMgQWR2YW5jZWRDb25maWcgfSBmcm9tIFwicGFnZXMvU2V0dGluZ3MvY29uZmlnL2FkdmFuY2VkXCI7XG5pbXBvcnQgeyBjb25maWcgYXMgQXV0aGVudGljYXRpb24gfSBmcm9tIFwiQGFwcHNtaXRoL3BhZ2VzL0FkbWluU2V0dGluZ3MvY29uZmlnL2F1dGhlbnRpY2F0aW9uXCI7XG5pbXBvcnQgeyBjb25maWcgYXMgQnJhbmRpbmdDb25maWcgfSBmcm9tIFwiQGFwcHNtaXRoL3BhZ2VzL0FkbWluU2V0dGluZ3MvY29uZmlnL2JyYW5kaW5nXCI7XG5cbkNvbmZpZ0ZhY3RvcnkucmVnaXN0ZXIoR2VuZXJhbENvbmZpZyk7XG5Db25maWdGYWN0b3J5LnJlZ2lzdGVyKEVtYWlsQ29uZmlnKTtcbkNvbmZpZ0ZhY3RvcnkucmVnaXN0ZXIoTWFwc0NvbmZpZyk7XG5Db25maWdGYWN0b3J5LnJlZ2lzdGVyKEF1dGhlbnRpY2F0aW9uKTtcbkNvbmZpZ0ZhY3RvcnkucmVnaXN0ZXIoQWR2YW5jZWRDb25maWcpO1xuQ29uZmlnRmFjdG9yeS5yZWdpc3RlcihWZXJzaW9uQ29uZmlnKTtcbkNvbmZpZ0ZhY3RvcnkucmVnaXN0ZXIoQnJhbmRpbmdDb25maWcpO1xuXG5leHBvcnQgZGVmYXVsdCBDb25maWdGYWN0b3J5O1xuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQWVZO0lBQUFBLGNBQUEsWUFBQUEsQ0FBQTtNQUFBLE9BQUFDLGNBQUE7SUFBQTtFQUFBO0VBQUEsT0FBQUEsY0FBQTtBQUFBO0FBQUFELGNBQUE7QUFmWixTQUFTRSxhQUFhLFFBQVEscUNBQXFDO0FBRW5FLFNBQVNDLE1BQU0sSUFBSUMsYUFBYSxRQUFRLDhDQUE4QztBQUN0RixTQUFTRCxNQUFNLElBQUlFLFdBQVcsUUFBUSw2QkFBNkI7QUFDbkUsU0FBU0YsTUFBTSxJQUFJRyxVQUFVLFFBQVEsa0NBQWtDO0FBQ3ZFLFNBQVNILE1BQU0sSUFBSUksYUFBYSxRQUFRLCtCQUErQjtBQUN2RSxTQUFTSixNQUFNLElBQUlLLGNBQWMsUUFBUSxnQ0FBZ0M7QUFDekUsU0FBU0wsTUFBTSxJQUFJTSxjQUFjLFFBQVEscURBQXFEO0FBQzlGLFNBQVNOLE1BQU0sSUFBSU8sY0FBYyxRQUFRLCtDQUErQztBQUFDVixjQUFBLEdBQUFXLENBQUE7QUFFekZULGFBQWEsQ0FBQ1UsUUFBUSxDQUFDUixhQUFhLENBQUM7QUFBQ0osY0FBQSxHQUFBVyxDQUFBO0FBQ3RDVCxhQUFhLENBQUNVLFFBQVEsQ0FBQ1AsV0FBVyxDQUFDO0FBQUNMLGNBQUEsR0FBQVcsQ0FBQTtBQUNwQ1QsYUFBYSxDQUFDVSxRQUFRLENBQUNOLFVBQVUsQ0FBQztBQUFDTixjQUFBLEdBQUFXLENBQUE7QUFDbkNULGFBQWEsQ0FBQ1UsUUFBUSxDQUFDSCxjQUFjLENBQUM7QUFBQ1QsY0FBQSxHQUFBVyxDQUFBO0FBQ3ZDVCxhQUFhLENBQUNVLFFBQVEsQ0FBQ0osY0FBYyxDQUFDO0FBQUNSLGNBQUEsR0FBQVcsQ0FBQTtBQUN2Q1QsYUFBYSxDQUFDVSxRQUFRLENBQUNMLGFBQWEsQ0FBQztBQUFDUCxjQUFBLEdBQUFXLENBQUE7QUFDdENULGFBQWEsQ0FBQ1UsUUFBUSxDQUFDRixjQUFjLENBQUM7QUFFdEMsZUFBZVIsYUFBYSJ9