function cov_kakpnndd9() {
  var path = "/Users/apple/github/appsmith/app/client/src/constants/AppsmithActionConstants/formConfig/GoogleSheetsSettingsConfig.ts";
  var hash = "1dde736f83a5d244c12b0b578623d30d1688df41";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/constants/AppsmithActionConstants/formConfig/GoogleSheetsSettingsConfig.ts",
    statementMap: {},
    fnMap: {},
    branchMap: {},
    s: {},
    f: {},
    b: {},
    _coverageSchema: "1a1c01bbd47fc00a2c39e90264f33305004495a9",
    hash: "1dde736f83a5d244c12b0b578623d30d1688df41"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_kakpnndd9 = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_kakpnndd9();
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
    label: "API timeout (in milliseconds)",
    subtitle: "Maximum time after which the API will return",
    configProperty: "actionConfiguration.timeoutInMillisecond",
    controlType: "INPUT_TEXT",
    dataType: "NUMBER"
  }]
}];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3Zfa2FrcG5uZGQ5IiwiYWN0dWFsQ292ZXJhZ2UiLCJzZWN0aW9uTmFtZSIsImlkIiwiY2hpbGRyZW4iLCJsYWJlbCIsImNvbmZpZ1Byb3BlcnR5IiwiY29udHJvbFR5cGUiLCJzdWJ0aXRsZSIsImRhdGFUeXBlIl0sInNvdXJjZXMiOlsiR29vZ2xlU2hlZXRzU2V0dGluZ3NDb25maWcudHMiXSwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGRlZmF1bHQgW1xuICB7XG4gICAgc2VjdGlvbk5hbWU6IFwiXCIsXG4gICAgaWQ6IDEsXG4gICAgY2hpbGRyZW46IFtcbiAgICAgIHtcbiAgICAgICAgbGFiZWw6IFwiUnVuIEFQSSBvbiBwYWdlIGxvYWRcIixcbiAgICAgICAgY29uZmlnUHJvcGVydHk6IFwiZXhlY3V0ZU9uTG9hZFwiLFxuICAgICAgICBjb250cm9sVHlwZTogXCJTV0lUQ0hcIixcbiAgICAgICAgc3VidGl0bGU6IFwiV2lsbCByZWZyZXNoIGRhdGEgZWFjaCB0aW1lIHRoZSBwYWdlIGlzIGxvYWRlZFwiLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgbGFiZWw6IFwiUmVxdWVzdCBjb25maXJtYXRpb24gYmVmb3JlIHJ1bm5pbmcgQVBJXCIsXG4gICAgICAgIGNvbmZpZ1Byb3BlcnR5OiBcImNvbmZpcm1CZWZvcmVFeGVjdXRlXCIsXG4gICAgICAgIGNvbnRyb2xUeXBlOiBcIlNXSVRDSFwiLFxuICAgICAgICBzdWJ0aXRsZTpcbiAgICAgICAgICBcIkFzayBjb25maXJtYXRpb24gZnJvbSB0aGUgdXNlciBlYWNoIHRpbWUgYmVmb3JlIHJlZnJlc2hpbmcgZGF0YVwiLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgbGFiZWw6IFwiQVBJIHRpbWVvdXQgKGluIG1pbGxpc2Vjb25kcylcIixcbiAgICAgICAgc3VidGl0bGU6IFwiTWF4aW11bSB0aW1lIGFmdGVyIHdoaWNoIHRoZSBBUEkgd2lsbCByZXR1cm5cIixcbiAgICAgICAgY29uZmlnUHJvcGVydHk6IFwiYWN0aW9uQ29uZmlndXJhdGlvbi50aW1lb3V0SW5NaWxsaXNlY29uZFwiLFxuICAgICAgICBjb250cm9sVHlwZTogXCJJTlBVVF9URVhUXCIsXG4gICAgICAgIGRhdGFUeXBlOiBcIk5VTUJFUlwiLFxuICAgICAgfSxcbiAgICBdLFxuICB9LFxuXTtcbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQWVZO0lBQUFBLGFBQUEsWUFBQUEsQ0FBQTtNQUFBLE9BQUFDLGNBQUE7SUFBQTtFQUFBO0VBQUEsT0FBQUEsY0FBQTtBQUFBO0FBQUFELGFBQUE7QUFmWixlQUFlLENBQ2I7RUFDRUUsV0FBVyxFQUFFLEVBQUU7RUFDZkMsRUFBRSxFQUFFLENBQUM7RUFDTEMsUUFBUSxFQUFFLENBQ1I7SUFDRUMsS0FBSyxFQUFFLHNCQUFzQjtJQUM3QkMsY0FBYyxFQUFFLGVBQWU7SUFDL0JDLFdBQVcsRUFBRSxRQUFRO0lBQ3JCQyxRQUFRLEVBQUU7RUFDWixDQUFDLEVBQ0Q7SUFDRUgsS0FBSyxFQUFFLHlDQUF5QztJQUNoREMsY0FBYyxFQUFFLHNCQUFzQjtJQUN0Q0MsV0FBVyxFQUFFLFFBQVE7SUFDckJDLFFBQVEsRUFDTjtFQUNKLENBQUMsRUFDRDtJQUNFSCxLQUFLLEVBQUUsK0JBQStCO0lBQ3RDRyxRQUFRLEVBQUUsOENBQThDO0lBQ3hERixjQUFjLEVBQUUsMENBQTBDO0lBQzFEQyxXQUFXLEVBQUUsWUFBWTtJQUN6QkUsUUFBUSxFQUFFO0VBQ1osQ0FBQztBQUVMLENBQUMsQ0FDRiJ9