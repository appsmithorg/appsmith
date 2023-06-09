function cov_2mje6x0fws() {
  var path = "/Users/apple/github/appsmith/app/client/src/constants/AppsmithActionConstants/formConfig/ApiSettingsConfig.ts";
  var hash = "ce4c74a6e77b3b383f535b4c82018ac2c8a49bb9";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/constants/AppsmithActionConstants/formConfig/ApiSettingsConfig.ts",
    statementMap: {},
    fnMap: {},
    branchMap: {},
    s: {},
    f: {},
    b: {},
    _coverageSchema: "1a1c01bbd47fc00a2c39e90264f33305004495a9",
    hash: "ce4c74a6e77b3b383f535b4c82018ac2c8a49bb9"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_2mje6x0fws = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_2mje6x0fws();
export default [{
  sectionName: "",
  id: 1,
  children: [{
    label: "Run API on page load",
    configProperty: "executeOnLoad",
    controlType: "SWITCH",
    subtitle: "Will refresh data each time the page is loaded"
  }, {
    label: "Request confirmation before running API",
    configProperty: "confirmBeforeExecute",
    controlType: "SWITCH",
    subtitle: "Ask confirmation from the user each time before refreshing data"
  }, {
    label: "Encode query params",
    configProperty: "actionConfiguration.encodeParamsToggle",
    controlType: "SWITCH",
    subtitle: "Encode query params for all APIs. Also encode form body when Content-Type header is set to x-www-form-encoded"
  }, {
    label: "Smart JSON substitution",
    configProperty: "actionConfiguration.pluginSpecifiedTemplates[0].value",
    controlType: "SWITCH",
    subtitle: "Turning on this property fixes the JSON substitution of bindings in API body by adding/removing quotes intelligently and reduces developer errors",
    initialValue: true
  }, {
    label: "API timeout (in milliseconds)",
    subtitle: "Maximum time after which the API will return",
    controlType: "INPUT_TEXT",
    configProperty: "actionConfiguration.timeoutInMillisecond",
    dataType: "NUMBER"
  }]
}];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfMm1qZTZ4MGZ3cyIsImFjdHVhbENvdmVyYWdlIiwic2VjdGlvbk5hbWUiLCJpZCIsImNoaWxkcmVuIiwibGFiZWwiLCJjb25maWdQcm9wZXJ0eSIsImNvbnRyb2xUeXBlIiwic3VidGl0bGUiLCJpbml0aWFsVmFsdWUiLCJkYXRhVHlwZSJdLCJzb3VyY2VzIjpbIkFwaVNldHRpbmdzQ29uZmlnLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBkZWZhdWx0IFtcbiAge1xuICAgIHNlY3Rpb25OYW1lOiBcIlwiLFxuICAgIGlkOiAxLFxuICAgIGNoaWxkcmVuOiBbXG4gICAgICB7XG4gICAgICAgIGxhYmVsOiBcIlJ1biBBUEkgb24gcGFnZSBsb2FkXCIsXG4gICAgICAgIGNvbmZpZ1Byb3BlcnR5OiBcImV4ZWN1dGVPbkxvYWRcIixcbiAgICAgICAgY29udHJvbFR5cGU6IFwiU1dJVENIXCIsXG4gICAgICAgIHN1YnRpdGxlOiBcIldpbGwgcmVmcmVzaCBkYXRhIGVhY2ggdGltZSB0aGUgcGFnZSBpcyBsb2FkZWRcIixcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIGxhYmVsOiBcIlJlcXVlc3QgY29uZmlybWF0aW9uIGJlZm9yZSBydW5uaW5nIEFQSVwiLFxuICAgICAgICBjb25maWdQcm9wZXJ0eTogXCJjb25maXJtQmVmb3JlRXhlY3V0ZVwiLFxuICAgICAgICBjb250cm9sVHlwZTogXCJTV0lUQ0hcIixcbiAgICAgICAgc3VidGl0bGU6XG4gICAgICAgICAgXCJBc2sgY29uZmlybWF0aW9uIGZyb20gdGhlIHVzZXIgZWFjaCB0aW1lIGJlZm9yZSByZWZyZXNoaW5nIGRhdGFcIixcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIGxhYmVsOiBcIkVuY29kZSBxdWVyeSBwYXJhbXNcIixcbiAgICAgICAgY29uZmlnUHJvcGVydHk6IFwiYWN0aW9uQ29uZmlndXJhdGlvbi5lbmNvZGVQYXJhbXNUb2dnbGVcIixcbiAgICAgICAgY29udHJvbFR5cGU6IFwiU1dJVENIXCIsXG4gICAgICAgIHN1YnRpdGxlOlxuICAgICAgICAgIFwiRW5jb2RlIHF1ZXJ5IHBhcmFtcyBmb3IgYWxsIEFQSXMuIEFsc28gZW5jb2RlIGZvcm0gYm9keSB3aGVuIENvbnRlbnQtVHlwZSBoZWFkZXIgaXMgc2V0IHRvIHgtd3d3LWZvcm0tZW5jb2RlZFwiLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgbGFiZWw6IFwiU21hcnQgSlNPTiBzdWJzdGl0dXRpb25cIixcbiAgICAgICAgY29uZmlnUHJvcGVydHk6IFwiYWN0aW9uQ29uZmlndXJhdGlvbi5wbHVnaW5TcGVjaWZpZWRUZW1wbGF0ZXNbMF0udmFsdWVcIixcbiAgICAgICAgY29udHJvbFR5cGU6IFwiU1dJVENIXCIsXG4gICAgICAgIHN1YnRpdGxlOlxuICAgICAgICAgIFwiVHVybmluZyBvbiB0aGlzIHByb3BlcnR5IGZpeGVzIHRoZSBKU09OIHN1YnN0aXR1dGlvbiBvZiBiaW5kaW5ncyBpbiBBUEkgYm9keSBieSBhZGRpbmcvcmVtb3ZpbmcgcXVvdGVzIGludGVsbGlnZW50bHkgYW5kIHJlZHVjZXMgZGV2ZWxvcGVyIGVycm9yc1wiLFxuICAgICAgICBpbml0aWFsVmFsdWU6IHRydWUsXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBsYWJlbDogXCJBUEkgdGltZW91dCAoaW4gbWlsbGlzZWNvbmRzKVwiLFxuICAgICAgICBzdWJ0aXRsZTogXCJNYXhpbXVtIHRpbWUgYWZ0ZXIgd2hpY2ggdGhlIEFQSSB3aWxsIHJldHVyblwiLFxuICAgICAgICBjb250cm9sVHlwZTogXCJJTlBVVF9URVhUXCIsXG4gICAgICAgIGNvbmZpZ1Byb3BlcnR5OiBcImFjdGlvbkNvbmZpZ3VyYXRpb24udGltZW91dEluTWlsbGlzZWNvbmRcIixcbiAgICAgICAgZGF0YVR5cGU6IFwiTlVNQkVSXCIsXG4gICAgICB9LFxuICAgIF0sXG4gIH0sXG5dO1xuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBZVk7SUFBQUEsY0FBQSxZQUFBQSxDQUFBO01BQUEsT0FBQUMsY0FBQTtJQUFBO0VBQUE7RUFBQSxPQUFBQSxjQUFBO0FBQUE7QUFBQUQsY0FBQTtBQWZaLGVBQWUsQ0FDYjtFQUNFRSxXQUFXLEVBQUUsRUFBRTtFQUNmQyxFQUFFLEVBQUUsQ0FBQztFQUNMQyxRQUFRLEVBQUUsQ0FDUjtJQUNFQyxLQUFLLEVBQUUsc0JBQXNCO0lBQzdCQyxjQUFjLEVBQUUsZUFBZTtJQUMvQkMsV0FBVyxFQUFFLFFBQVE7SUFDckJDLFFBQVEsRUFBRTtFQUNaLENBQUMsRUFDRDtJQUNFSCxLQUFLLEVBQUUseUNBQXlDO0lBQ2hEQyxjQUFjLEVBQUUsc0JBQXNCO0lBQ3RDQyxXQUFXLEVBQUUsUUFBUTtJQUNyQkMsUUFBUSxFQUNOO0VBQ0osQ0FBQyxFQUNEO0lBQ0VILEtBQUssRUFBRSxxQkFBcUI7SUFDNUJDLGNBQWMsRUFBRSx3Q0FBd0M7SUFDeERDLFdBQVcsRUFBRSxRQUFRO0lBQ3JCQyxRQUFRLEVBQ047RUFDSixDQUFDLEVBQ0Q7SUFDRUgsS0FBSyxFQUFFLHlCQUF5QjtJQUNoQ0MsY0FBYyxFQUFFLHVEQUF1RDtJQUN2RUMsV0FBVyxFQUFFLFFBQVE7SUFDckJDLFFBQVEsRUFDTixtSkFBbUo7SUFDckpDLFlBQVksRUFBRTtFQUNoQixDQUFDLEVBQ0Q7SUFDRUosS0FBSyxFQUFFLCtCQUErQjtJQUN0Q0csUUFBUSxFQUFFLDhDQUE4QztJQUN4REQsV0FBVyxFQUFFLFlBQVk7SUFDekJELGNBQWMsRUFBRSwwQ0FBMEM7SUFDMURJLFFBQVEsRUFBRTtFQUNaLENBQUM7QUFFTCxDQUFDLENBQ0YifQ==