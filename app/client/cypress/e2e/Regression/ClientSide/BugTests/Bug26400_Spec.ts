import {
  agHelper,
  deployMode,
  table,
  apiPage,
  dataSources,
  entityExplorer,
  draggableWidgets,
  propPane,
} from "../../../../support/Objects/ObjectsCore";

describe("Test Create Api and Bind to Button widget", function () {
  it("Loads large API data promptly on page load", () => {
    apiPage.CreateAndFillApi("https://echo.zuplo.io/", "Api1", 10000, "POST");
    apiPage.SelectPaneTab("Body");
    apiPage.SelectSubTab("JSON");
    // creating post request using echo
    dataSources.EnterQuery(
      `[
        {
          "id": 81,
          "created_at": "2023-07-10T04:37:52.776778+00:00",
          "name": "Release",
          "date": "2023-07-10",
          "roster": [
            {
              "name": "API/cURL/Auth API ",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "High"
            },
            {
              "name": "Action Selector",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Critical"
            },
            {
              "name": "Airtable",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Medium"
            },
            {
              "name": "App Level Import",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Medium"
            },
            {
              "name": "App Sharing",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Medium"
            },
            {
              "name": "App level actions [Forking App with pages, widgets + datasources + JS objects/Sharing App /Duplicate App]",
              "status": true,
              "asignee": "Sripriya",
              "complexity": "Critical"
            },
            {
              "name": "ArangoDB",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Low"
            },
            {
              "name": "Audio",
              "status": true,
              "asignee": "Kamakshi",
              "complexity": "Low"
            },
            {
              "name": "Audio Recorder widget",
              "status": true,
              "asignee": "Kamakshi",
              "complexity": "Low"
            },
            {
              "name": "Button",
              "status": true,
              "asignee": "Chandan",
              "complexity": "High"
            },
            {
              "name": "Button Group Widget",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Medium"
            },
            {
              "name": "Camera",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Low"
            },
            {
              "name": "Category Slider",
              "status": true,
              "asignee": "Sripriya",
              "complexity": "Low"
            },
            {
              "name": "Chart",
              "status": true,
              "asignee": "Laveena",
              "complexity": "High"
            },
            {
              "name": "Checkbox Group",
              "status": true,
              "asignee": "Harsha",
              "complexity": "Low"
            },
            {
              "name": "Code Scanner",
              "status": true,
              "asignee": "Kavita",
              "complexity": "Low"
            },
            {
              "name": "Container",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Critical"
            },
            {
              "name": "Currency Input",
              "status": true,
              "asignee": "Chandan",
              "complexity": "Low"
            },
            {
              "name": "Custom libraries",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Critical"
            },
            {
              "name": "Date Picker",
              "status": true,
              "asignee": "Chandan",
              "complexity": "Medium"
            },
            {
              "name": "Divider widget",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Low"
            },
            {
              "name": "Document Viewer",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Low"
            },
            {
              "name": "Enterprise B and U ",
              "status": true,
              "asignee": "Harsha",
              "complexity": "Critical"
            },
            {
              "name": "FilePicker",
              "status": true,
              "asignee": "Kamakshi",
              "complexity": "Medium"
            },
            {
              "name": "Firestore DS",
              "status": true,
              "asignee": "Harsha",
              "complexity": "Medium"
            },
            {
              "name": "Forking an application - All DS",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Critical"
            },
            {
              "name": "Form",
              "status": true,
              "asignee": "Chandan",
              "complexity": "High"
            },
            {
              "name": "Framework Functions",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Critical"
            },
            {
              "name": "GSheets Automation",
              "status": true,
              "asignee": "Saroj",
              "complexity": "High"
            },
            {
              "name": "Git + Git import",
              "status": true,
              "asignee": "Parthvi",
              "complexity": "Critical"
            },
            {
              "name": "GoogleSheets",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Critical"
            },
            {
              "name": "GraphQL",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Medium"
            },
            {
              "name": "Home page",
              "status": true,
              "asignee": "Sripriya",
              "complexity": "Medium"
            },
            {
              "name": "HubSpot",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Low"
            },
            {
              "name": "Icon widget",
              "status": true,
              "asignee": "Kavita",
              "complexity": "Medium"
            },
            {
              "name": "Image Widget",
              "status": true,
              "asignee": "Kavita",
              "complexity": "High"
            },
            {
              "name": "Import/Export App level",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Medium"
            },
            {
              "name": "In-built libraries",
              "status": true,
              "asignee": "Anandi",
              "complexity": "High"
            },
            {
              "name": "Input",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Critical"
            },
            {
              "name": "Install testing",
              "status": true,
              "asignee": "Saroj",
              "complexity": "Critical"
            },
            {
              "name": "JS Objects",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Critical"
            },
            {
              "name": "JSON Form",
              "status": true,
              "asignee": "Chandan",
              "complexity": "Medium"
            },
            {
              "name": "Javascript",
              "status": true,
              "asignee": "Saptami",
              "complexity": "High"
            },
            {
              "name": "List",
              "status": true,
              "asignee": "Chandan",
              "complexity": "Critical"
            },
            {
              "name": "Map",
              "status": true,
              "asignee": "Kamakshi",
              "complexity": "Low"
            },
            {
              "name": "Map Chart",
              "status": true,
              "asignee": "Chandan",
              "complexity": "Low"
            },
            {
              "name": "Menu Widget",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Medium"
            },
            {
              "name": "Microsoft SQL",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Medium"
            },
            {
              "name": "Mobile Automation",
              "status": false,
              "asignee": "Vijetha",
              "complexity": "High"
            },
            {
              "name": "Modal",
              "status": true,
              "asignee": "Laveena",
              "complexity": "High"
            },
            {
              "name": "MongoDB",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Critical"
            },
            {
              "name": "Multi Select widget",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Low"
            },
            {
              "name": "Multi Tree Select widget",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Medium"
            },
            {
              "name": "MySQL",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Critical"
            },
            {
              "name": "Number  Slider",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Low"
            },
            {
              "name": "OAuth with Dropbox/Calendly",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Medium"
            },
            {
              "name": "Older Apps Testing",
              "status": false,
              "asignee": "All",
              "complexity": "High"
            },
            {
              "name": "Omnibar Navigation",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Critical"
            },
            {
              "name": "Oracle",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "High"
            },
            {
              "name": "Page Setting ",
              "status": true,
              "asignee": "Kavita",
              "complexity": "High"
            },
            {
              "name": "Page level actions",
              "status": true,
              "asignee": "Sripriya",
              "complexity": "Critical"
            },
            {
              "name": "Phone Input",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Low"
            },
            {
              "name": "PostgreSQL",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Critical"
            },
            {
              "name": "Progress",
              "status": true,
              "asignee": "Sripriya",
              "complexity": "Low"
            },
            {
              "name": "Radio",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Low"
            },
            {
              "name": "Range Slider",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Low"
            },
            {
              "name": "Rating Widget",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Low"
            },
            {
              "name": "Reflow",
              "status": true,
              "asignee": "Sripriya",
              "complexity": "High"
            },
            {
              "name": "Rich Text Editor Widge",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Medium"
            },
            {
              "name": "S3",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Medium"
            },
            {
              "name": "SMTP",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Medium"
            },
            {
              "name": "SSO (CE+EE)",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Critical"
            },
            {
              "name": "SSO with other Deployment Scenarios",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Critical"
            },
            {
              "name": "Select widget",
              "status": true,
              "asignee": "Kamakshi",
              "complexity": "High"
            },
            {
              "name": "Self Serv B and U",
              "status": true,
              "asignee": "Harsha",
              "complexity": "High"
            },
            {
              "name": "Signup/Signin",
              "status": true,
              "asignee": "Sripriya",
              "complexity": "Critical"
            },
            {
              "name": "Snowflake",
              "status": true,
              "asignee": "Harsha",
              "complexity": "Low"
            },
            {
              "name": "Stat box",
              "status": true,
              "asignee": "Kavita",
              "complexity": "Medium"
            },
            {
              "name": "Switch",
              "status": true,
              "asignee": "Chandan",
              "complexity": "Low"
            },
            {
              "name": "Switch group ",
              "status": true,
              "asignee": "Sripriya",
              "complexity": "Low"
            },
            {
              "name": "Tab Widget ",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "High"
            },
            {
              "name": "Table Widget",
              "status": false,
              "asignee": "Kamakshi",
              "complexity": "Critical"
            },
            {
              "name": "Templates",
              "status": true,
              "asignee": "Kavita",
              "complexity": "Critical"
            },
            {
              "name": "Text Widget",
              "status": true,
              "asignee": "Kamakshi",
              "complexity": "High"
            },
            {
              "name": "Theming",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "High"
            },
            {
              "name": "Tree Select widget",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Medium"
            },
            {
              "name": "UX/UI Issues",
              "status": false,
              "asignee": "Kamakshi",
              "complexity": "High"
            },
            {
              "name": "Upgrade Testing - FE/NDX/Git",
              "status": false,
              "asignee": "Anandi",
              "complexity": "Critical"
            },
            {
              "name": "Upgrade Testing - Platform/Integration",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Critical"
            },
            {
              "name": "Upgrade Testing - SSO",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Critical"
            },
            {
              "name": "Upgrade Testing - UI/AppViewers/Mobile/Design",
              "status": false,
              "asignee": "Kamakshi",
              "complexity": "Critical"
            },
            {
              "name": "Video",
              "status": true,
              "asignee": "Chandan",
              "complexity": "Low"
            },
            {
              "name": "Vulnerability check",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Critical"
            },
            {
              "name": "iFrame Widget ",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Medium"
            }
          ],
          "done": true,
          "release_id": 131,
          "commit_id": "83f957e22897ecb756b4957ceceab35043183f17",
          "notes": ""
        },
        {
          "id": 79,
          "created_at": "2023-06-26T06:44:18.120027+00:00",
          "name": "Release",
          "date": "2023-06-26",
          "roster": [
            {
              "name": "API/cURL/Auth API ",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "High"
            },
            {
              "name": "Action Selector",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Critical"
            },
            {
              "name": "Airtable",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Medium"
            },
            {
              "name": "App Level Import",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Medium"
            },
            {
              "name": "App Sharing",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Medium"
            },
            {
              "name": "App level actions [Forking App with pages, widgets + datasources + JS objects/Sharing App /Duplicate App]",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Critical"
            },
            {
              "name": "ArangoDB",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Low"
            },
            {
              "name": "Audio",
              "status": true,
              "asignee": "Kamakshi",
              "complexity": "Low"
            },
            {
              "name": "Audio Recorder widget",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Low"
            },
            {
              "name": "Billing and Usage Testing",
              "status": true,
              "asignee": "Harsha",
              "complexity": "Critical"
            },
            {
              "name": "Button",
              "status": true,
              "asignee": "Shadab",
              "complexity": "High"
            },
            {
              "name": "Button Group Widget",
              "status": true,
              "asignee": "Shadab",
              "complexity": "Medium"
            },
            {
              "name": "Camera",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Low"
            },
            {
              "name": "Category Slider",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Low"
            },
            {
              "name": "Chart",
              "status": true,
              "asignee": "Laveena",
              "complexity": "High"
            },
            {
              "name": "Checkbox Group",
              "status": true,
              "asignee": "Shadab",
              "complexity": "Low"
            },
            {
              "name": "Code Scanner",
              "status": true,
              "asignee": "Kavita",
              "complexity": "Low"
            },
            {
              "name": "Container",
              "status": true,
              "asignee": "Shadab",
              "complexity": "Critical"
            },
            {
              "name": "Currency Input",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Low"
            },
            {
              "name": "Custom libraries",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Critical"
            },
            {
              "name": "Date Picker",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Medium"
            },
            {
              "name": "Divider widget",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Low"
            },
            {
              "name": "Document Viewer",
              "status": true,
              "asignee": "Sharanya",
              "complexity": "Low"
            },
            {
              "name": "FilePicker",
              "status": true,
              "asignee": "Kamakshi",
              "complexity": "Medium"
            },
            {
              "name": "Firestore DS",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Medium"
            },
            {
              "name": "Forking an application - All DS",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Critical"
            },
            {
              "name": "Form",
              "status": true,
              "asignee": "Laveena",
              "complexity": "High"
            },
            {
              "name": "Framework Functions",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Critical"
            },
            {
              "name": "Git + Git import",
              "status": true,
              "asignee": "Parthvi",
              "complexity": "Critical"
            },
            {
              "name": "GoogleSheets",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Critical"
            },
            {
              "name": "GraphQL",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Medium"
            },
            {
              "name": "Home page",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Medium"
            },
            {
              "name": "HubSpot",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Low"
            },
            {
              "name": "Icon widget",
              "status": true,
              "asignee": "Kavita",
              "complexity": "Medium"
            },
            {
              "name": "Image Widget",
              "status": true,
              "asignee": "Kavita",
              "complexity": "High"
            },
            {
              "name": "Import/Export App level",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Medium"
            },
            {
              "name": "In-built libraries",
              "status": true,
              "asignee": "Anandi",
              "complexity": "High"
            },
            {
              "name": "Input",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Critical"
            },
            {
              "name": "Install testing",
              "status": false,
              "asignee": "Saroj",
              "complexity": "Critical"
            },
            {
              "name": "JS Objects",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Critical"
            },
            {
              "name": "JSON Form",
              "status": true,
              "asignee": "Kamakshi",
              "complexity": "Medium"
            },
            {
              "name": "Javascript",
              "status": true,
              "asignee": "Saptami",
              "complexity": "High"
            },
            {
              "name": "List",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Critical"
            },
            {
              "name": "Map",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Low"
            },
            {
              "name": "Map Chart",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Low"
            },
            {
              "name": "Menu Widget",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Medium"
            },
            {
              "name": "Microsoft SQL",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Medium"
            },
            {
              "name": "Modal",
              "status": true,
              "asignee": "Kamakshi",
              "complexity": "High"
            },
            {
              "name": "MongoDB",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Critical"
            },
            {
              "name": "Multi Select widget",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Low"
            },
            {
              "name": "Multi Tree Select widget",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Medium"
            },
            {
              "name": "MySQL",
              "status": true,
              "asignee": "Sharanya",
              "complexity": "Critical"
            },
            {
              "name": "Number  Slider",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Low"
            },
            {
              "name": "OAuth with Dropbox/Calendly",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Medium"
            },
            {
              "name": "Omnibar Navigation",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Critical"
            },
            {
              "name": "Oracle",
              "status": true,
              "asignee": "Sharanya",
              "complexity": "High"
            },
            {
              "name": "Page Setting ",
              "status": true,
              "asignee": "Kavita",
              "complexity": "High"
            },
            {
              "name": "Page level actions",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Critical"
            },
            {
              "name": "Phone Input",
              "status": true,
              "asignee": "Harsha",
              "complexity": "Low"
            },
            {
              "name": "PostgreSQL",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Critical"
            },
            {
              "name": "Progress",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Low"
            },
            {
              "name": "Radio",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Low"
            },
            {
              "name": "Range Slider",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Low"
            },
            {
              "name": "Rating Widget",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Low"
            },
            {
              "name": "Reflow",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "High"
            },
            {
              "name": "Rich Text Editor Widge",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Medium"
            },
            {
              "name": "S3",
              "status": true,
              "asignee": "Sharanya",
              "complexity": "Medium"
            },
            {
              "name": "SMTP",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Medium"
            },
            {
              "name": "SSO (CE+EE)",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Critical"
            },
            {
              "name": "SSO with other Deployment Scenarios",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Critical"
            },
            {
              "name": "Select widget",
              "status": true,
              "asignee": "Kamakshi",
              "complexity": "High"
            },
            {
              "name": "Signup/Signin",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Critical"
            },
            {
              "name": "Snowflake",
              "status": true,
              "asignee": "Sharanya",
              "complexity": "Low"
            },
            {
              "name": "Stat box",
              "status": true,
              "asignee": "Kavita",
              "complexity": "Medium"
            },
            {
              "name": "Switch",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Low"
            },
            {
              "name": "Switch group ",
              "status": true,
              "asignee": "Harsha",
              "complexity": "Low"
            },
            {
              "name": "Tab Widget ",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "High"
            },
            {
              "name": "Table Widget",
              "status": true,
              "asignee": "Kamakshi",
              "complexity": "Critical"
            },
            {
              "name": "Templates",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Critical"
            },
            {
              "name": "Text Widget",
              "status": true,
              "asignee": "Shadab",
              "complexity": "High"
            },
            {
              "name": "Theming",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "High"
            },
            {
              "name": "Tree Select widget",
              "status": true,
              "asignee": "Shadab",
              "complexity": "Medium"
            },
            {
              "name": "UX/UI Issues",
              "status": true,
              "asignee": "Shadab",
              "complexity": "High"
            },
            {
              "name": "Upgrade Testing - FE/NDX/Git",
              "status": false,
              "asignee": "Anandi",
              "complexity": "Critical"
            },
            {
              "name": "Upgrade Testing - Platform/Integration",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Critical"
            },
            {
              "name": "Upgrade Testing - SSO",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Critical"
            },
            {
              "name": "Upgrade Testing - UI/AppViewers/Mobile/Design",
              "status": true,
              "asignee": "Kamakshi",
              "complexity": "Critical"
            },
            {
              "name": "Video",
              "status": true,
              "asignee": "Shadab",
              "complexity": "Low"
            },
            {
              "name": "Vulnerability check",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Critical"
            },
            {
              "name": "iFrame Widget ",
              "status": true,
              "asignee": "Harsha",
              "complexity": "Medium"
            }
          ],
          "done": true,
          "release_id": 114,
          "commit_id": "b3f1805e363b594b78d1193aff4be1c9936a34e5",
          "notes": ""
        },
        {
          "id": 80,
          "created_at": "2023-07-03T04:50:25.30649+00:00",
          "name": "Release",
          "date": "2023-07-03",
          "roster": [
            {
              "name": "API/cURL/Auth API ",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "High"
            },
            {
              "name": "Action Selector",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Critical"
            },
            {
              "name": "Airtable",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Medium"
            },
            {
              "name": "App Level Import",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Medium"
            },
            {
              "name": "App Sharing",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Medium"
            },
            {
              "name": "App level actions [Forking App with pages, widgets + datasources + JS objects/Sharing App /Duplicate App]",
              "status": true,
              "asignee": "Sripriya",
              "complexity": "Critical"
            },
            {
              "name": "ArangoDB",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Low"
            },
            {
              "name": "Audio",
              "status": true,
              "asignee": "Kamakshi",
              "complexity": "Low"
            },
            {
              "name": "Audio Recorder widget",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Low"
            },
            {
              "name": "Billing and Usage Testing",
              "status": true,
              "asignee": "Harsha",
              "complexity": "Critical"
            },
            {
              "name": "Button",
              "status": true,
              "asignee": "Shadab",
              "complexity": "High"
            },
            {
              "name": "Button Group Widget",
              "status": true,
              "asignee": "Shadab",
              "complexity": "Medium"
            },
            {
              "name": "Camera",
              "status": true,
              "asignee": "Sripriya",
              "complexity": "Low"
            },
            {
              "name": "Category Slider",
              "status": true,
              "asignee": "Sripriya",
              "complexity": "Low"
            },
            {
              "name": "Chart",
              "status": true,
              "asignee": "Laveena",
              "complexity": "High"
            },
            {
              "name": "Checkbox Group",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Low"
            },
            {
              "name": "Code Scanner",
              "status": true,
              "asignee": "Kavita",
              "complexity": "Low"
            },
            {
              "name": "Container",
              "status": true,
              "asignee": "Shadab",
              "complexity": "Critical"
            },
            {
              "name": "Currency Input",
              "status": false,
              "asignee": "Chandan",
              "complexity": "Low"
            },
            {
              "name": "Custom libraries",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Critical"
            },
            {
              "name": "Date Picker",
              "status": false,
              "asignee": "Chandan",
              "complexity": "Medium"
            },
            {
              "name": "Divider widget",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Low"
            },
            {
              "name": "Document Viewer",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Low"
            },
            {
              "name": "FilePicker",
              "status": true,
              "asignee": "Kamakshi",
              "complexity": "Medium"
            },
            {
              "name": "Firestore DS",
              "status": true,
              "asignee": "Harsha",
              "complexity": "Medium"
            },
            {
              "name": "Forking an application - All DS",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Critical"
            },
            {
              "name": "Form",
              "status": false,
              "asignee": "Chandan",
              "complexity": "High"
            },
            {
              "name": "Framework Functions",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Critical"
            },
            {
              "name": "Git + Git import",
              "status": true,
              "asignee": "Parthvi",
              "complexity": "Critical"
            },
            {
              "name": "GoogleSheets",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Critical"
            },
            {
              "name": "GraphQL",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Medium"
            },
            {
              "name": "Home page",
              "status": true,
              "asignee": "Sripriya",
              "complexity": "Medium"
            },
            {
              "name": "HubSpot",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Low"
            },
            {
              "name": "Icon widget",
              "status": true,
              "asignee": "Kavita",
              "complexity": "Medium"
            },
            {
              "name": "Image Widget",
              "status": true,
              "asignee": "Kavita",
              "complexity": "High"
            },
            {
              "name": "Import/Export App level",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Medium"
            },
            {
              "name": "In-built libraries",
              "status": true,
              "asignee": "Saptami",
              "complexity": "High"
            },
            {
              "name": "Input",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Critical"
            },
            {
              "name": "Install testing",
              "status": true,
              "asignee": "Saroj",
              "complexity": "Critical"
            },
            {
              "name": "JS Objects",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Critical"
            },
            {
              "name": "JSON Form",
              "status": false,
              "asignee": "Chandan",
              "complexity": "Medium"
            },
            {
              "name": "Javascript",
              "status": true,
              "asignee": "Saptami",
              "complexity": "High"
            },
            {
              "name": "List",
              "status": false,
              "asignee": "Chandan",
              "complexity": "Critical"
            },
            {
              "name": "Map",
              "status": true,
              "asignee": "Kamakshi",
              "complexity": "Low"
            },
            {
              "name": "Map Chart",
              "status": false,
              "asignee": "Chandan",
              "complexity": "Low"
            },
            {
              "name": "Menu Widget",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Medium"
            },
            {
              "name": "Microsoft SQL",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Medium"
            },
            {
              "name": "Modal",
              "status": true,
              "asignee": "Kamakshi",
              "complexity": "High"
            },
            {
              "name": "MongoDB",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Critical"
            },
            {
              "name": "Multi Select widget",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Low"
            },
            {
              "name": "Multi Tree Select widget",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Medium"
            },
            {
              "name": "MySQL",
              "status": true,
              "asignee": "Sharanya",
              "complexity": "Critical"
            },
            {
              "name": "Number  Slider",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Low"
            },
            {
              "name": "OAuth with Dropbox/Calendly",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Medium"
            },
            {
              "name": "Omnibar Navigation",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Critical"
            },
            {
              "name": "Oracle",
              "status": true,
              "asignee": "Sharanya",
              "complexity": "High"
            },
            {
              "name": "Page Setting ",
              "status": true,
              "asignee": "Kavita",
              "complexity": "High"
            },
            {
              "name": "Page level actions",
              "status": true,
              "asignee": "Sripriya",
              "complexity": "Critical"
            },
            {
              "name": "Phone Input",
              "status": true,
              "asignee": "Harsha",
              "complexity": "Low"
            },
            {
              "name": "PostgreSQL",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Critical"
            },
            {
              "name": "Progress",
              "status": true,
              "asignee": "Sripriya",
              "complexity": "Low"
            },
            {
              "name": "Radio",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Low"
            },
            {
              "name": "Range Slider",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Low"
            },
            {
              "name": "Rating Widget",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Low"
            },
            {
              "name": "Reflow",
              "status": true,
              "asignee": "Sripriya",
              "complexity": "High"
            },
            {
              "name": "Rich Text Editor Widge",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Medium"
            },
            {
              "name": "S3",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Medium"
            },
            {
              "name": "SMTP",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Medium"
            },
            {
              "name": "SSO (CE+EE)",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Critical"
            },
            {
              "name": "SSO with other Deployment Scenarios",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Critical"
            },
            {
              "name": "Select widget",
              "status": true,
              "asignee": "Kamakshi",
              "complexity": "High"
            },
            {
              "name": "Signup/Signin",
              "status": true,
              "asignee": "Sripriya",
              "complexity": "Critical"
            },
            {
              "name": "Snowflake",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Low"
            },
            {
              "name": "Stat box",
              "status": true,
              "asignee": "Kavita",
              "complexity": "Medium"
            },
            {
              "name": "Switch",
              "status": false,
              "asignee": "Chandan",
              "complexity": "Low"
            },
            {
              "name": "Switch group ",
              "status": true,
              "asignee": "Harsha",
              "complexity": "Low"
            },
            {
              "name": "Tab Widget ",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "High"
            },
            {
              "name": "Table Widget",
              "status": true,
              "asignee": "Kamakshi",
              "complexity": "Critical"
            },
            {
              "name": "Templates",
              "status": true,
              "asignee": "Kavita",
              "complexity": "Critical"
            },
            {
              "name": "Text Widget",
              "status": true,
              "asignee": "Kamakshi",
              "complexity": "High"
            },
            {
              "name": "Theming",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "High"
            },
            {
              "name": "Tree Select widget",
              "status": true,
              "asignee": "Shadab",
              "complexity": "Medium"
            },
            {
              "name": "UX/UI Issues",
              "status": true,
              "asignee": "Shadab",
              "complexity": "High"
            },
            {
              "name": "Upgrade Testing - FE/NDX/Git",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Critical"
            },
            {
              "name": "Upgrade Testing - Platform/Integration",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Critical"
            },
            {
              "name": "Upgrade Testing - SSO",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Critical"
            },
            {
              "name": "Upgrade Testing - UI/AppViewers/Mobile/Design",
              "status": true,
              "asignee": "Kamakshi",
              "complexity": "Critical"
            },
            {
              "name": "Video",
              "status": true,
              "asignee": "Shadab",
              "complexity": "Low"
            },
            {
              "name": "Vulnerability check",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Critical"
            },
            {
              "name": "iFrame Widget ",
              "status": true,
              "asignee": "Harsha",
              "complexity": "Medium"
            }
          ],
          "done": true,
          "release_id": 115,
          "commit_id": "a480d4ff2ec632bb565875b9c281a4012f499015",
          "notes": ""
        },
        {
          "id": 78,
          "created_at": "2023-06-19T09:43:29.521173+00:00",
          "name": "Release",
          "date": "2023-06-19",
          "roster": [
            {
              "name": "API/cURL/Auth API ",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "High"
            },
            {
              "name": "Action Selector",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Critical"
            },
            {
              "name": "Airtable",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Medium"
            },
            {
              "name": "App Level Import",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Medium"
            },
            {
              "name": "App Sharing",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Medium"
            },
            {
              "name": "App level actions [Forking App with pages, widgets + datasources + JS objects/Sharing App /Duplicate App]",
              "status": true,
              "asignee": "Sripriya",
              "complexity": "Critical"
            },
            {
              "name": "ArangoDB",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Low"
            },
            {
              "name": "Audio",
              "status": true,
              "asignee": "Chandan",
              "complexity": "Low"
            },
            {
              "name": "Audio Recorder widget",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Low"
            },
            {
              "name": "Billing and Usage Testing",
              "status": true,
              "asignee": "Harsha",
              "complexity": "Critical"
            },
            {
              "name": "Button",
              "status": true,
              "asignee": "Shadab",
              "complexity": "High"
            },
            {
              "name": "Button Group Widget",
              "status": true,
              "asignee": "Shadab",
              "complexity": "Medium"
            },
            {
              "name": "Camera",
              "status": true,
              "asignee": "Sripriya",
              "complexity": "Low"
            },
            {
              "name": "Category Slider",
              "status": true,
              "asignee": "Sripriya",
              "complexity": "Low"
            },
            {
              "name": "Chart",
              "status": true,
              "asignee": "Chandan",
              "complexity": "High"
            },
            {
              "name": "Checkbox Group",
              "status": true,
              "asignee": "Shadab",
              "complexity": "Low"
            },
            {
              "name": "Code Scanner",
              "status": true,
              "asignee": "Kavita",
              "complexity": "Low"
            },
            {
              "name": "Container",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Critical"
            },
            {
              "name": "Currency Input",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Low"
            },
            {
              "name": "Custom libraries",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Critical"
            },
            {
              "name": "Date Picker",
              "status": true,
              "asignee": "Shadab",
              "complexity": "Medium"
            },
            {
              "name": "Divider widget",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Low"
            },
            {
              "name": "Document Viewer",
              "status": true,
              "asignee": "Sharanya",
              "complexity": "Low"
            },
            {
              "name": "FilePicker",
              "status": true,
              "asignee": "Chandan",
              "complexity": "Medium"
            },
            {
              "name": "Firestore DS",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Medium"
            },
            {
              "name": "Forking an application - All DS",
              "status": false,
              "asignee": "Aparna",
              "complexity": "Critical"
            },
            {
              "name": "Form",
              "status": true,
              "asignee": "Chandan",
              "complexity": "High"
            },
            {
              "name": "Framework Functions",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Critical"
            },
            {
              "name": "Git + Git import",
              "status": true,
              "asignee": "Parthvi",
              "complexity": "Critical"
            },
            {
              "name": "GoogleSheets",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Critical"
            },
            {
              "name": "GraphQL",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Medium"
            },
            {
              "name": "Home page",
              "status": true,
              "asignee": "Sripriya",
              "complexity": "Medium"
            },
            {
              "name": "HubSpot",
              "status": false,
              "asignee": "Prapulla",
              "complexity": "Low"
            },
            {
              "name": "Icon widget",
              "status": true,
              "asignee": "Kavita",
              "complexity": "Medium"
            },
            {
              "name": "Image Widget",
              "status": true,
              "asignee": "Kavita",
              "complexity": "High"
            },
            {
              "name": "Import/Export App level",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Medium"
            },
            {
              "name": "In-built libraries",
              "status": true,
              "asignee": "Anandi",
              "complexity": "High"
            },
            {
              "name": "Input",
              "status": true,
              "asignee": "Shadab",
              "complexity": "Critical"
            },
            {
              "name": "Install testing",
              "status": true,
              "asignee": "Saroj",
              "complexity": "Critical"
            },
            {
              "name": "JS Objects",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Critical"
            },
            {
              "name": "JSON Form",
              "status": true,
              "asignee": "Chandan",
              "complexity": "Medium"
            },
            {
              "name": "Javascript",
              "status": true,
              "asignee": "Saptami",
              "complexity": "High"
            },
            {
              "name": "List",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Critical"
            },
            {
              "name": "Map",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Low"
            },
            {
              "name": "Map Chart",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Low"
            },
            {
              "name": "Menu Widget",
              "status": true,
              "asignee": "Sripriya",
              "complexity": "Medium"
            },
            {
              "name": "Microsoft SQL",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Medium"
            },
            {
              "name": "Modal",
              "status": true,
              "asignee": "Chandan",
              "complexity": "High"
            },
            {
              "name": "MongoDB",
              "status": false,
              "asignee": "Prapulla",
              "complexity": "Critical"
            },
            {
              "name": "Multi Select widget",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Low"
            },
            {
              "name": "Multi Tree Select widget",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Medium"
            },
            {
              "name": "MySQL",
              "status": true,
              "asignee": "Sharanya",
              "complexity": "Critical"
            },
            {
              "name": "Number  Slider",
              "status": true,
              "asignee": "Sripriya",
              "complexity": "Low"
            },
            {
              "name": "OAuth with Dropbox/Calendly",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Medium"
            },
            {
              "name": "Omnibar Navigation",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Critical"
            },
            {
              "name": "Oracle",
              "status": true,
              "asignee": "Sharanya",
              "complexity": "High"
            },
            {
              "name": "Page Setting ",
              "status": true,
              "asignee": "Kavita",
              "complexity": "High"
            },
            {
              "name": "Page level actions",
              "status": true,
              "asignee": "Sripriya",
              "complexity": "Critical"
            },
            {
              "name": "Phone Input",
              "status": true,
              "asignee": "Harsha",
              "complexity": "Low"
            },
            {
              "name": "PostgreSQL",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Critical"
            },
            {
              "name": "Progress",
              "status": true,
              "asignee": "Sripriya",
              "complexity": "Low"
            },
            {
              "name": "Radio",
              "status": true,
              "asignee": "Chandan",
              "complexity": "Low"
            },
            {
              "name": "Range Slider",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Low"
            },
            {
              "name": "Rating Widget",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Low"
            },
            {
              "name": "Reflow",
              "status": true,
              "asignee": "Sripriya",
              "complexity": "High"
            },
            {
              "name": "Rich Text Editor Widge",
              "status": true,
              "asignee": "Chandan",
              "complexity": "Medium"
            },
            {
              "name": "S3",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Medium"
            },
            {
              "name": "SMTP",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Medium"
            },
            {
              "name": "SSO (CE+EE)",
              "status": true,
              "asignee": "Sharanya",
              "complexity": "Critical"
            },
            {
              "name": "SSO with other Deployment Scenarios",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Critical"
            },
            {
              "name": "Select widget",
              "status": true,
              "asignee": "Shadab",
              "complexity": "High"
            },
            {
              "name": "Signup/Signin",
              "status": true,
              "asignee": "Sripriya",
              "complexity": "Critical"
            },
            {
              "name": "Snowflake",
              "status": true,
              "asignee": "Sharanya",
              "complexity": "Low"
            },
            {
              "name": "Stat box",
              "status": true,
              "asignee": "Kavita",
              "complexity": "Medium"
            },
            {
              "name": "Switch",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Low"
            },
            {
              "name": "Switch group ",
              "status": true,
              "asignee": "Harsha",
              "complexity": "Low"
            },
            {
              "name": "Tab Widget ",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "High"
            },
            {
              "name": "Table Widget",
              "status": true,
              "asignee": "Chandan",
              "complexity": "Critical"
            },
            {
              "name": "Templates",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Critical"
            },
            {
              "name": "Text Widget",
              "status": true,
              "asignee": "Aparna",
              "complexity": "High"
            },
            {
              "name": "Theming",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "High"
            },
            {
              "name": "Tree Select widget",
              "status": true,
              "asignee": "Shadab",
              "complexity": "Medium"
            },
            {
              "name": "UX/UI Issues",
              "status": true,
              "asignee": "Shadab",
              "complexity": "High"
            },
            {
              "name": "Upgrade Testing - FE/NDX/Git",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Critical"
            },
            {
              "name": "Upgrade Testing - Platform/Integration",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Critical"
            },
            {
              "name": "Upgrade Testing - SSO",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Critical"
            },
            {
              "name": "Upgrade Testing - UI/AppViewers/Mobile/Design",
              "status": true,
              "asignee": "Shadab",
              "complexity": "Critical"
            },
            {
              "name": "Video",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Low"
            },
            {
              "name": "Vulnerability check",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Critical"
            },
            {
              "name": "iFrame Widget ",
              "status": true,
              "asignee": "Harsha",
              "complexity": "Medium"
            }
          ],
          "done": true,
          "release_id": 113,
          "commit_id": "d6a202e04c3367eb91f977c18164d9e623b4da5c",
          "notes": ""
        },
        {
          "id": 74,
          "created_at": "2023-05-17T06:44:02.371433+00:00",
          "name": "Release",
          "date": "2023-05-17",
          "roster": [
            {
              "name": "API/cURL/Auth API ",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "High"
            },
            {
              "name": "Action Selector",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Critical"
            },
            {
              "name": "Airtable",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Medium"
            },
            {
              "name": "App Level Import",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Medium"
            },
            {
              "name": "App Sharing",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Medium"
            },
            {
              "name": "App level actions [Forking App with pages, widgets + datasources + JS objects/Sharing App /Duplicate App]",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Critical"
            },
            {
              "name": "ArangoDB",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Low"
            },
            {
              "name": "Audio",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Low"
            },
            {
              "name": "Audio Recorder widget",
              "status": true,
              "asignee": "Richa",
              "complexity": "Low"
            },
            {
              "name": "Billing and Usage Testing",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Critical"
            },
            {
              "name": "Button",
              "status": true,
              "asignee": "Shadab",
              "complexity": "High"
            },
            {
              "name": "Button Group Widget",
              "status": true,
              "asignee": "Shadab",
              "complexity": "Medium"
            },
            {
              "name": "Camera",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Low"
            },
            {
              "name": "Category Slider",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Low"
            },
            {
              "name": "Chart",
              "status": true,
              "asignee": "Kamakshi",
              "complexity": "High"
            },
            {
              "name": "Checkbox Group",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Low"
            },
            {
              "name": "Code Scanner",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Low"
            },
            {
              "name": "Container",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Critical"
            },
            {
              "name": "Currency Input",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Low"
            },
            {
              "name": "Custom libraries",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Critical"
            },
            {
              "name": "Date Picker",
              "status": true,
              "asignee": "Kamakshi",
              "complexity": "Medium"
            },
            {
              "name": "Divider widget",
              "status": true,
              "asignee": "Richa",
              "complexity": "Low"
            },
            {
              "name": "Document Viewer",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Low"
            },
            {
              "name": "FilePicker",
              "status": true,
              "asignee": "Kamakshi",
              "complexity": "Medium"
            },
            {
              "name": "Firestore DS",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Medium"
            },
            {
              "name": "Form",
              "status": true,
              "asignee": "Shadab",
              "complexity": "High"
            },
            {
              "name": "Framework Functions",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Critical"
            },
            {
              "name": "Git + Git import",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Critical"
            },
            {
              "name": "GoogleSheets",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Critical"
            },
            {
              "name": "GraphQL",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Medium"
            },
            {
              "name": "Home page",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Medium"
            },
            {
              "name": "HubSpot",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Low"
            },
            {
              "name": "Icon widget",
              "status": true,
              "asignee": "Richa",
              "complexity": "Medium"
            },
            {
              "name": "Image Widget",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "High"
            },
            {
              "name": "Import/Export App level",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Medium"
            },
            {
              "name": "In-built libraries",
              "status": true,
              "asignee": "Anandi",
              "complexity": "High"
            },
            {
              "name": "Input",
              "status": true,
              "asignee": "Shadab",
              "complexity": "Critical"
            },
            {
              "name": "Install testing",
              "status": true,
              "asignee": "Saroj",
              "complexity": "Critical"
            },
            {
              "name": "JS Objects",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Critical"
            },
            {
              "name": "JSON Form",
              "status": true,
              "asignee": "Kamakshi",
              "complexity": "Medium"
            },
            {
              "name": "Javascript",
              "status": true,
              "asignee": "Saptami",
              "complexity": "High"
            },
            {
              "name": "List",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Critical"
            },
            {
              "name": "Map",
              "status": false,
              "asignee": "Richa",
              "complexity": "Low"
            },
            {
              "name": "Map Chart",
              "status": true,
              "asignee": "Richa",
              "complexity": "Low"
            },
            {
              "name": "Menu Widget",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Medium"
            },
            {
              "name": "Microsoft SQL",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Medium"
            },
            {
              "name": "Modal",
              "status": true,
              "asignee": "Shadab",
              "complexity": "High"
            },
            {
              "name": "MongoDB",
              "status": true,
              "asignee": "Anand",
              "complexity": "Critical"
            },
            {
              "name": "Multi Select widget",
              "status": true,
              "asignee": "Shadab",
              "complexity": "Low"
            },
            {
              "name": "Multi Tree Select widget",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Medium"
            },
            {
              "name": "MySQL",
              "status": true,
              "asignee": "Anand",
              "complexity": "Critical"
            },
            {
              "name": "Number  Slider",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Low"
            },
            {
              "name": "OAuth with Dropbox/Calendly",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Medium"
            },
            {
              "name": "Older Apps Testing",
              "status": false,
              "asignee": "All",
              "complexity": "High"
            },
            {
              "name": "Omnibar Navigation",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Critical"
            },
            {
              "name": "Oracle",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "High"
            },
            {
              "name": "Page Setting ",
              "status": true,
              "asignee": "Richa",
              "complexity": "High"
            },
            {
              "name": "Page level actions",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Critical"
            },
            {
              "name": "Phone Input",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Low"
            },
            {
              "name": "PostgreSQL",
              "status": true,
              "asignee": "Anand",
              "complexity": "Critical"
            },
            {
              "name": "Progress",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Low"
            },
            {
              "name": "Radio",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Low"
            },
            {
              "name": "Range Slider",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Low"
            },
            {
              "name": "Rating Widget",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Low"
            },
            {
              "name": "Reflow",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "High"
            },
            {
              "name": "Rich Text Editor Widge",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Medium"
            },
            {
              "name": "S3",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Medium"
            },
            {
              "name": "SMTP",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Medium"
            },
            {
              "name": "SSO (CE+EE)",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Critical"
            },
            {
              "name": "SSO with other Deployment Scenarios",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Critical"
            },
            {
              "name": "Select widget",
              "status": true,
              "asignee": "Shadab",
              "complexity": "High"
            },
            {
              "name": "Signup/Signin",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Critical"
            },
            {
              "name": "Snowflake",
              "status": true,
              "asignee": "Anand",
              "complexity": "Low"
            },
            {
              "name": "Stat box",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Medium"
            },
            {
              "name": "Switch",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Low"
            },
            {
              "name": "Switch group ",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Low"
            },
            {
              "name": "Tab Widget ",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "High"
            },
            {
              "name": "Table Widget",
              "status": false,
              "asignee": "Kamakshi",
              "complexity": "Critical"
            },
            {
              "name": "Templates",
              "status": true,
              "asignee": "Richa",
              "complexity": "Critical"
            },
            {
              "name": "Text Widget",
              "status": true,
              "asignee": "Laveena",
              "complexity": "High"
            },
            {
              "name": "Theming",
              "status": true,
              "asignee": "Richa",
              "complexity": "High"
            },
            {
              "name": "Tree Select widget",
              "status": true,
              "asignee": "Shadab",
              "complexity": "Medium"
            },
            {
              "name": "UX/UI Issues",
              "status": false,
              "asignee": "Kamakshi",
              "complexity": "High"
            },
            {
              "name": "Upgrade Testing - FE/NDX/Git",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Critical"
            },
            {
              "name": "Upgrade Testing - Platform/Integration",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Critical"
            },
            {
              "name": "Upgrade Testing - SSO",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Critical"
            },
            {
              "name": "Upgrade Testing - UI/AppViewers/Mobile/Design",
              "status": false,
              "asignee": "Kamakshi",
              "complexity": "Critical"
            },
            {
              "name": "Video",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Low"
            },
            {
              "name": "Vulnerability check",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Critical"
            },
            {
              "name": "iFrame Widget ",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Medium"
            }
          ],
          "done": true,
          "release_id": 105,
          "commit_id": "e6c9a4d0aabb6fc2e75e81ce4cf3ea86cebd937e",
          "notes": "<p>We did this regression on a separate branch created from release. Regression testing went through without major issues.</p>\n<p>Since API key was not added during the instance generation, Map widget was tested on Release, and found to be working fine</p>"
        },
        {
          "id": 86,
          "created_at": "2023-08-16T07:30:48.692196+00:00",
          "name": "Release",
          "date": "2023-08-16",
          "roster": [
            {
              "name": "API/cURL/Auth API ",
              "status": true,
              "asignee": "Aparna",
              "complexity": "High"
            },
            {
              "name": "Action Selector",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Critical"
            },
            {
              "name": "Airtable",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Medium"
            },
            {
              "name": "App Level Import",
              "status": false,
              "asignee": "Raksha",
              "complexity": "Medium"
            },
            {
              "name": "App Sharing",
              "status": false,
              "asignee": "Raksha",
              "complexity": "Medium"
            },
            {
              "name": "App level actions [Forking App with pages, widgets + datasources + JS objects/Sharing App /Duplicate App]",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Critical"
            },
            {
              "name": "Button",
              "status": true,
              "asignee": "Kamakshi",
              "complexity": "High"
            },
            {
              "name": "Button Group Widget",
              "status": true,
              "asignee": "Shadab",
              "complexity": "Medium"
            },
            {
              "name": "Chart",
              "status": true,
              "asignee": "Kavita",
              "complexity": "High"
            },
            {
              "name": "Checkbox Group",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Low"
            },
            {
              "name": "Container",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Critical"
            },
            {
              "name": "Currency Input",
              "status": true,
              "asignee": "Shadab",
              "complexity": "Low"
            },
            {
              "name": "Custom libraries",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Critical"
            },
            {
              "name": "Date Picker",
              "status": true,
              "asignee": "Kamakshi",
              "complexity": "Medium"
            },
            {
              "name": "Divider widget",
              "status": true,
              "asignee": "Chandan",
              "complexity": "Low"
            },
            {
              "name": "Enterprise B and U ",
              "status": true,
              "asignee": "Harsha",
              "complexity": "Critical"
            },
            {
              "name": "FilePicker",
              "status": true,
              "asignee": "Shadab",
              "complexity": "Medium"
            },
            {
              "name": "Firestore DS",
              "status": true,
              "asignee": "Harsha",
              "complexity": "Medium"
            },
            {
              "name": "Forking an application - All DS",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Critical"
            },
            {
              "name": "Form",
              "status": true,
              "asignee": "Shadab",
              "complexity": "High"
            },
            {
              "name": "Framework Functions",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Critical"
            },
            {
              "name": "GSheets Automation",
              "status": false,
              "asignee": "Saroj",
              "complexity": "High"
            },
            {
              "name": "GSheetsAuthorization",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Critical"
            },
            {
              "name": "Git + Git import",
              "status": false,
              "asignee": "Raksha",
              "complexity": "Critical"
            },
            {
              "name": "GraphQL",
              "status": false,
              "asignee": "Prapulla",
              "complexity": "Medium"
            },
            {
              "name": "Home page",
              "status": false,
              "asignee": "Shwetha",
              "complexity": "Medium"
            },
            {
              "name": "HubSpot",
              "status": false,
              "asignee": "Prapulla",
              "complexity": "Low"
            },
            {
              "name": "Icon widget",
              "status": true,
              "asignee": "Kavita",
              "complexity": "Medium"
            },
            {
              "name": "Image Widget",
              "status": true,
              "asignee": "Chandan",
              "complexity": "High"
            },
            {
              "name": "In-built libraries",
              "status": true,
              "asignee": "Saptami",
              "complexity": "High"
            },
            {
              "name": "Input",
              "status": false,
              "asignee": "Kavita",
              "complexity": "Critical"
            },
            {
              "name": "Install testing",
              "status": false,
              "asignee": "Saroj",
              "complexity": "Critical"
            },
            {
              "name": "JS Objects",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Critical"
            },
            {
              "name": "JSON Form",
              "status": true,
              "asignee": "Chandan",
              "complexity": "Medium"
            },
            {
              "name": "Javascript",
              "status": true,
              "asignee": "Saptami",
              "complexity": "High"
            },
            {
              "name": "List",
              "status": true,
              "asignee": "Shadab",
              "complexity": "Critical"
            },
            {
              "name": "Map",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Low"
            },
            {
              "name": "Map Chart",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Low"
            },
            {
              "name": "Menu Widget",
              "status": true,
              "asignee": "Kavita",
              "complexity": "Medium"
            },
            {
              "name": "Mobile Automation",
              "status": false,
              "asignee": "Vijetha",
              "complexity": "High"
            },
            {
              "name": "Modal",
              "status": true,
              "asignee": "Chandan",
              "complexity": "High"
            },
            {
              "name": "Multi Select widget",
              "status": true,
              "asignee": "Kamakshi",
              "complexity": "Low"
            },
            {
              "name": "Multi Tree Select widget",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Medium"
            },
            {
              "name": "Multiple Env",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Critical"
            },
            {
              "name": "OAuth with Dropbox/Calendly",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Medium"
            },
            {
              "name": "Older Apps Testing",
              "status": false,
              "asignee": "All",
              "complexity": "High"
            },
            {
              "name": "Omnibar Navigation",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Critical"
            },
            {
              "name": "Oracle",
              "status": true,
              "asignee": "Harsha",
              "complexity": "High"
            },
            {
              "name": "Page Setting ",
              "status": true,
              "asignee": "Anandi",
              "complexity": "High"
            },
            {
              "name": "Page level actions",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Critical"
            },
            {
              "name": "Phone Input",
              "status": true,
              "asignee": "Kamakshi",
              "complexity": "Low"
            },
            {
              "name": "Radio",
              "status": true,
              "asignee": "Kavita",
              "complexity": "Low"
            },
            {
              "name": "Reflow",
              "status": true,
              "asignee": "Laveena",
              "complexity": "High"
            },
            {
              "name": "Rich Text Editor Widge",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Medium"
            },
            {
              "name": "S3",
              "status": false,
              "asignee": "Raksha",
              "complexity": "Medium"
            },
            {
              "name": "SCIM",
              "status": false,
              "asignee": "Raksha",
              "complexity": "High"
            },
            {
              "name": "SMTP",
              "status": true,
              "asignee": "Harsha",
              "complexity": "Medium"
            },
            {
              "name": "SSO (CE+EE)",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Critical"
            },
            {
              "name": "SSO with other Deployment Scenarios",
              "status": false,
              "asignee": "Raksha",
              "complexity": "Critical"
            },
            {
              "name": "Select widget",
              "status": true,
              "asignee": "Laveena",
              "complexity": "High"
            },
            {
              "name": "Self Serv B and U",
              "status": true,
              "asignee": "Harsha",
              "complexity": "High"
            },
            {
              "name": "Signup/Signin",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Critical"
            },
            {
              "name": "Snowflake",
              "status": true,
              "asignee": "Harsha",
              "complexity": "Low"
            },
            {
              "name": "Stat box",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Medium"
            },
            {
              "name": "Switch group ",
              "status": true,
              "asignee": "Kavita",
              "complexity": "Low"
            },
            {
              "name": "Tab Widget ",
              "status": true,
              "asignee": "Chandan",
              "complexity": "High"
            },
            {
              "name": "Table Widget",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Critical"
            },
            {
              "name": "Templates",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Critical"
            },
            {
              "name": "Text Widget",
              "status": true,
              "asignee": "Laveena",
              "complexity": "High"
            },
            {
              "name": "Theming",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "High"
            },
            {
              "name": "Tree Select widget",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Medium"
            },
            {
              "name": "UX/UI Issues",
              "status": false,
              "asignee": "Kamakshi",
              "complexity": "High"
            },
            {
              "name": "Upgrade Testing - FE/NDX/Git",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Critical"
            },
            {
              "name": "Upgrade Testing - Platform/Integration",
              "status": false,
              "asignee": "Raksha",
              "complexity": "Critical"
            },
            {
              "name": "Upgrade Testing - SSO",
              "status": false,
              "asignee": "Raksha",
              "complexity": "Critical"
            },
            {
              "name": "Upgrade Testing - UI/AppViewers/Mobile/Design",
              "status": false,
              "asignee": "Kamakshi",
              "complexity": "Critical"
            },
            {
              "name": "Video",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Low"
            },
            {
              "name": "Vulnerability check",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Critical"
            },
            {
              "name": "iFrame Widget ",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Medium"
            }
          ],
          "done": true,
          "release_id": 137,
          "commit_id": "4ee82d3f1c40027952c04f8011eb9f97c4d73cda",
          "notes": ""
        },
        {
          "id": 72,
          "created_at": "2023-05-03T11:14:28.348094+00:00",
          "name": "Release",
          "date": "2023-05-03",
          "roster": [
            {
              "name": "API/cURL/Auth API ",
              "status": true,
              "asignee": "Aparna",
              "complexity": "High"
            },
            {
              "name": "Action Selector",
              "status": false,
              "asignee": "Shwetha",
              "complexity": "Critical"
            },
            {
              "name": "Airtable",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Medium"
            },
            {
              "name": "App level actions [Forking App with pages, widgets + datasources + JS objects/Sharing App /Duplicate App]",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Critical"
            },
            {
              "name": "ArangoDB",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Low"
            },
            {
              "name": "Audio",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Low"
            },
            {
              "name": "Audio Recorder widget",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Low"
            },
            {
              "name": "Billing and Usage Testing",
              "status": false,
              "asignee": "Raksha",
              "complexity": "Critical"
            },
            {
              "name": "Button",
              "status": true,
              "asignee": "Shadab",
              "complexity": "High"
            },
            {
              "name": "Button Group Widget",
              "status": true,
              "asignee": "Shadab",
              "complexity": "Medium"
            },
            {
              "name": "Camera",
              "status": false,
              "asignee": "Chandan",
              "complexity": "Low"
            },
            {
              "name": "Category Slider",
              "status": false,
              "asignee": "Kamakshi",
              "complexity": "Low"
            },
            {
              "name": "Chart",
              "status": false,
              "asignee": "Chandan",
              "complexity": "High"
            },
            {
              "name": "Checkbox Group",
              "status": false,
              "asignee": "Shwetha",
              "complexity": "Low"
            },
            {
              "name": "Code Scanner",
              "status": false,
              "asignee": "Laveena",
              "complexity": "Low"
            },
            {
              "name": "Container",
              "status": false,
              "asignee": "Laveena",
              "complexity": "Critical"
            },
            {
              "name": "Currency Input",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Low"
            },
            {
              "name": "Custom libraries",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Critical"
            },
            {
              "name": "Date Picker",
              "status": false,
              "asignee": "Chandan",
              "complexity": "Medium"
            },
            {
              "name": "Divider widget",
              "status": false,
              "asignee": "Kamakshi",
              "complexity": "Low"
            },
            {
              "name": "Document Viewer",
              "status": false,
              "asignee": "Laveena",
              "complexity": "Low"
            },
            {
              "name": "FilePicker",
              "status": false,
              "asignee": "Kamakshi",
              "complexity": "Medium"
            },
            {
              "name": "Firestore DS",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Medium"
            },
            {
              "name": "Form",
              "status": false,
              "asignee": "Kamakshi",
              "complexity": "High"
            },
            {
              "name": "Framework Functions",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Critical"
            },
            {
              "name": "Git + Git import",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Critical"
            },
            {
              "name": "GoogleSheets",
              "status": false,
              "asignee": "Chandan",
              "complexity": "Critical"
            },
            {
              "name": "GraphQL",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Medium"
            },
            {
              "name": "Home page",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Medium"
            },
            {
              "name": "HubSpot",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Low"
            },
            {
              "name": "Icon widget",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Medium"
            },
            {
              "name": "Image Widget",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "High"
            },
            {
              "name": "Import/Export App level",
              "status": true,
              "asignee": "Raksha"
            },
            {
              "name": "Input",
              "status": true,
              "asignee": "Shadab",
              "complexity": "Critical"
            },
            {
              "name": "Install testing",
              "status": false,
              "asignee": "Saroj",
              "complexity": "Critical"
            },
            {
              "name": "JS Objects",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Critical"
            },
            {
              "name": "JSON Form",
              "status": false,
              "asignee": "Chandan",
              "complexity": "Medium"
            },
            {
              "name": "Javascript",
              "status": true,
              "asignee": "Saptami",
              "complexity": "High"
            },
            {
              "name": "List",
              "status": false,
              "asignee": "Chandan",
              "complexity": "Critical"
            },
            {
              "name": "Map",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Low"
            },
            {
              "name": "Map Chart",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Low"
            },
            {
              "name": "Menu Widget",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Medium"
            },
            {
              "name": "Microsoft SQL",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Medium"
            },
            {
              "name": "Modal",
              "status": true,
              "asignee": "Shadab",
              "complexity": "High"
            },
            {
              "name": "MongoDB",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Critical"
            },
            {
              "name": "Multi Select widget",
              "status": true,
              "asignee": "Shadab",
              "complexity": "Low"
            },
            {
              "name": "Multi Tree Select widget",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Medium"
            },
            {
              "name": "MySQL",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Critical"
            },
            {
              "name": "Number  Slider",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Low"
            },
            {
              "name": "OAuth with Dropbox/Calendly",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Medium"
            },
            {
              "name": "Older Apps Testing",
              "status": false,
              "asignee": "All",
              "complexity": "High"
            },
            {
              "name": "Omnibar Navigation",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Critical"
            },
            {
              "name": "Page Setting ",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "High"
            },
            {
              "name": "Page level actions",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Critical"
            },
            {
              "name": "Phone Input",
              "status": false,
              "asignee": "Shwetha",
              "complexity": "Low"
            },
            {
              "name": "PostgreSQL",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Critical"
            },
            {
              "name": "Progress",
              "status": false,
              "asignee": "Shwetha",
              "complexity": "Low"
            },
            {
              "name": "Radio",
              "status": false,
              "asignee": "Laveena",
              "complexity": "Low"
            },
            {
              "name": "Range Slider",
              "status": false,
              "asignee": "Shwetha",
              "complexity": "Low"
            },
            {
              "name": "Rating Widget",
              "status": false,
              "asignee": "Laveena",
              "complexity": "Low"
            },
            {
              "name": "Reflow",
              "status": false,
              "asignee": "Laveena",
              "complexity": "High"
            },
            {
              "name": "Rich Text Editor Widge",
              "status": false,
              "asignee": "Shwetha",
              "complexity": "Medium"
            },
            {
              "name": "S3",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Medium"
            },
            {
              "name": "SMTP",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Medium"
            },
            {
              "name": "SSO (CE+EE)",
              "status": false,
              "asignee": "Aparna",
              "complexity": "Critical"
            },
            {
              "name": "SSO (CE+EE)",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Critical"
            },
            {
              "name": "Select widget",
              "status": true,
              "asignee": "Shadab",
              "complexity": "High"
            },
            {
              "name": "Signup/Signin",
              "status": false,
              "asignee": "Shwetha",
              "complexity": "Critical"
            },
            {
              "name": "Snowflake",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Low"
            },
            {
              "name": "Stat box",
              "status": false,
              "asignee": "Laveena",
              "complexity": "Medium"
            },
            {
              "name": "Switch",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Low"
            },
            {
              "name": "Switch group ",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Low"
            },
            {
              "name": "Tab Widget ",
              "status": false,
              "asignee": "Shwetha",
              "complexity": "High"
            },
            {
              "name": "Table Widget",
              "status": false,
              "asignee": "Kamakshi",
              "complexity": "Critical"
            },
            {
              "name": "Templates",
              "status": false,
              "asignee": "Richa",
              "complexity": "Critical"
            },
            {
              "name": "Templates",
              "status": true,
              "asignee": "Richa",
              "complexity": "Critical"
            },
            {
              "name": "Theming",
              "status": true,
              "asignee": "Raksha",
              "complexity": "High"
            },
            {
              "name": "Tree Select widget",
              "status": true,
              "asignee": "Shadab",
              "complexity": "Medium"
            },
            {
              "name": "UX/UI Issues",
              "status": false,
              "asignee": "Kamakshi",
              "complexity": "High"
            },
            {
              "name": "Upgrade Testing - FE/NDX/Git",
              "status": false,
              "asignee": "Saptami",
              "complexity": "Critical"
            },
            {
              "name": "Upgrade Testing - FE/NDX/Git",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Critical"
            },
            {
              "name": "Upgrade Testing - Platform/Integration",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Critical"
            },
            {
              "name": "Upgrade Testing - UI/AppViewers/Mobile/Design",
              "status": false,
              "asignee": "Kamakshi",
              "complexity": "Critical"
            },
            {
              "name": "Video",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Low"
            },
            {
              "name": "Vulnerability check",
              "status": false,
              "asignee": "Raksha",
              "complexity": "Critical"
            },
            {
              "name": "Vulnerability check",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Critical"
            },
            {
              "name": "Import/Export App level",
              "status": false,
              "asignee": "Raksha"
            }
          ],
          "done": true,
          "release_id": 103,
          "commit_id": "fadf71283358fbc15eab3f2dc9818d7521c044c7",
          "notes": ""
        },
        {
          "id": 71,
          "created_at": "2023-04-24T08:34:38.249329+00:00",
          "name": "Release",
          "date": "2023-04-24",
          "roster": [
            {
              "name": "API/cURL/Auth API ",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "High"
            },
            {
              "name": "Action Selector",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Critical"
            },
            {
              "name": "Airtable",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Medium"
            },
            {
              "name": "App level actions [Forking App with pages, widgets + datasources + JS objects/Sharing App /Duplicate App]",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Critical"
            },
            {
              "name": "ArangoDB",
              "status": true,
              "asignee": "Anand",
              "complexity": "Low"
            },
            {
              "name": "Audio",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Low"
            },
            {
              "name": "Audio Recorder widget",
              "status": true,
              "asignee": "Richa",
              "complexity": "Low"
            },
            {
              "name": "Billing and Usage Testing",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Critical"
            },
            {
              "name": "Button",
              "status": true,
              "asignee": "Shadab",
              "complexity": "High"
            },
            {
              "name": "Button Group Widget",
              "status": true,
              "asignee": "Shadab",
              "complexity": "Medium"
            },
            {
              "name": "Camera",
              "status": true,
              "asignee": "Chandan",
              "complexity": "Low"
            },
            {
              "name": "Category Slider",
              "status": true,
              "asignee": "Kamakshi",
              "complexity": "Low"
            },
            {
              "name": "Chart",
              "status": true,
              "asignee": "Laveena",
              "complexity": "High"
            },
            {
              "name": "Checkbox Group",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Low"
            },
            {
              "name": "Code Scanner",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Low"
            },
            {
              "name": "Container",
              "status": false,
              "asignee": "Chandan",
              "complexity": "Critical"
            },
            {
              "name": "Currency Input",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Low"
            },
            {
              "name": "Custom libraries",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Critical"
            },
            {
              "name": "Date Picker",
              "status": false,
              "asignee": "Chandan",
              "complexity": "Medium"
            },
            {
              "name": "Divider widget",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Low"
            },
            {
              "name": "Document Viewer",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Low"
            },
            {
              "name": "FilePicker",
              "status": true,
              "asignee": "Kamakshi",
              "complexity": "Medium"
            },
            {
              "name": "Firestore DS",
              "status": true,
              "asignee": "Anand",
              "complexity": "Medium"
            },
            {
              "name": "Form",
              "status": true,
              "asignee": "Kamakshi",
              "complexity": "High"
            },
            {
              "name": "Framework Functions",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Critical"
            },
            {
              "name": "Git + Git import",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Critical"
            },
            {
              "name": "GoogleSheets",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Critical"
            },
            {
              "name": "GraphQL",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Medium"
            },
            {
              "name": "Home page",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Medium"
            },
            {
              "name": "HubSpot",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Low"
            },
            {
              "name": "Icon widget",
              "status": true,
              "asignee": "Richa",
              "complexity": "Medium"
            },
            {
              "name": "Image Widget",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "High"
            },
            {
              "name": "In-built libraries",
              "status": true,
              "asignee": "Anandi",
              "complexity": "High"
            },
            {
              "name": "Input",
              "status": true,
              "asignee": "Shadab",
              "complexity": "Critical"
            },
            {
              "name": "Install testing",
              "status": false,
              "asignee": "Saroj",
              "complexity": "Critical"
            },
            {
              "name": "JS Objects",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Critical"
            },
            {
              "name": "JSON Form",
              "status": false,
              "asignee": "Chandan",
              "complexity": "Medium"
            },
            {
              "name": "Javascript",
              "status": true,
              "asignee": "Saptami",
              "complexity": "High"
            },
            {
              "name": "List",
              "status": true,
              "asignee": "Chandan",
              "complexity": "Critical"
            },
            {
              "name": "Map",
              "status": true,
              "asignee": "Richa",
              "complexity": "Low"
            },
            {
              "name": "Map Chart",
              "status": true,
              "asignee": "Richa",
              "complexity": "Low"
            },
            {
              "name": "Menu Widget",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Medium"
            },
            {
              "name": "Microsoft SQL",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Medium"
            },
            {
              "name": "Modal",
              "status": true,
              "asignee": "Shadab",
              "complexity": "High"
            },
            {
              "name": "MongoDB",
              "status": true,
              "asignee": "Anand",
              "complexity": "Critical"
            },
            {
              "name": "Multi Select widget",
              "status": true,
              "asignee": "Shadab",
              "complexity": "Low"
            },
            {
              "name": "Multi Tree Select widget",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Medium"
            },
            {
              "name": "MySQL",
              "status": true,
              "asignee": "Anand",
              "complexity": "Critical"
            },
            {
              "name": "Number  Slider",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Low"
            },
            {
              "name": "OAuth with Dropbox",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Medium"
            },
            {
              "name": "Older Apps Testing",
              "status": false,
              "asignee": "All",
              "complexity": "High"
            },
            {
              "name": "Omnibar Navigation",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Critical"
            },
            {
              "name": "Page Setting ",
              "status": true,
              "asignee": "Richa",
              "complexity": "High"
            },
            {
              "name": "Page level actions",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Critical"
            },
            {
              "name": "Phone Input",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Low"
            },
            {
              "name": "PostgreSQL",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Critical"
            },
            {
              "name": "Progress",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Low"
            },
            {
              "name": "Radio",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Low"
            },
            {
              "name": "Range Slider",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Low"
            },
            {
              "name": "Rating Widget",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Low"
            },
            {
              "name": "Reflow",
              "status": true,
              "asignee": "Laveena",
              "complexity": "High"
            },
            {
              "name": "Rich Text Editor Widge",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Medium"
            },
            {
              "name": "S3",
              "status": true,
              "asignee": "Anand",
              "complexity": "Medium"
            },
            {
              "name": "SMTP",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Medium"
            },
            {
              "name": "SSO (CE+EE)",
              "status": false,
              "asignee": "Aparna",
              "complexity": "Critical"
            },
            {
              "name": "SSO with other Deployment Scenarios",
              "status": false,
              "asignee": "Raksha",
              "complexity": "Critical"
            },
            {
              "name": "Select widget",
              "status": true,
              "asignee": "Shadab",
              "complexity": "High"
            },
            {
              "name": "Signup/Signin",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Critical"
            },
            {
              "name": "Snowflake",
              "status": true,
              "asignee": "Anand",
              "complexity": "Low"
            },
            {
              "name": "Stat box",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Medium"
            },
            {
              "name": "Switch",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Low"
            },
            {
              "name": "Switch group ",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Low"
            },
            {
              "name": "Tab Widget ",
              "status": true,
              "asignee": "Aparna",
              "complexity": "High"
            },
            {
              "name": "Table Widget",
              "status": false,
              "asignee": "Chandan",
              "complexity": "Critical"
            },
            {
              "name": "Templates",
              "status": true,
              "asignee": "Richa",
              "complexity": "Critical"
            },
            {
              "name": "Text Widget",
              "status": false,
              "asignee": "Kamakshi",
              "complexity": "High"
            },
            {
              "name": "Theming",
              "status": true,
              "asignee": "Richa",
              "complexity": "High"
            },
            {
              "name": "Tree Select widget",
              "status": true,
              "asignee": "Shadab",
              "complexity": "Medium"
            },
            {
              "name": "UX/UI Issues",
              "status": true,
              "asignee": "Kamakshi",
              "complexity": "High"
            },
            {
              "name": "Upgrade Testing - FE/NDX/Git",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Critical"
            },
            {
              "name": "Upgrade Testing - Platform/Integration",
              "status": false,
              "asignee": "Raksha",
              "complexity": "Critical"
            },
            {
              "name": "Upgrade Testing - SSO",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Critical"
            },
            {
              "name": "Upgrade Testing - UI/AppViewers/Mobile/Design",
              "status": false,
              "asignee": "Kamakshi",
              "complexity": "Critical"
            },
            {
              "name": "Video",
              "status": false,
              "asignee": "Anandi",
              "complexity": "Low"
            },
            {
              "name": "Vulnerability check",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Critical"
            },
            {
              "name": "iFrame Widget ",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Medium"
            }
          ],
          "done": true,
          "release_id": 102,
          "commit_id": "7b9b63ba0b6040da3d17c8a35260689b57706380",
          "notes": ""
        },
        {
          "id": 76,
          "created_at": "2023-06-06T07:11:29.526058+00:00",
          "name": "Release",
          "date": "2023-06-06",
          "roster": [
            {
              "name": "API/cURL/Auth API ",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "High"
            },
            {
              "name": "Action Selector",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Critical"
            },
            {
              "name": "Airtable",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Medium"
            },
            {
              "name": "App Level Import",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Medium"
            },
            {
              "name": "App Sharing",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Medium"
            },
            {
              "name": "App level actions [Forking App with pages, widgets + datasources + JS objects/Sharing App /Duplicate App]",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Critical"
            },
            {
              "name": "ArangoDB",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Low"
            },
            {
              "name": "Audio",
              "status": true,
              "asignee": "Chandan",
              "complexity": "Low"
            },
            {
              "name": "Audio Recorder widget",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Low"
            },
            {
              "name": "Billing and Usage Testing",
              "status": false,
              "asignee": "Raksha",
              "complexity": "Critical"
            },
            {
              "name": "Button",
              "status": true,
              "asignee": "Shadab",
              "complexity": "High"
            },
            {
              "name": "Button Group Widget",
              "status": true,
              "asignee": "Shadab",
              "complexity": "Medium"
            },
            {
              "name": "Camera",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Low"
            },
            {
              "name": "Category Slider",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Low"
            },
            {
              "name": "Chart",
              "status": true,
              "asignee": "Chandan",
              "complexity": "High"
            },
            {
              "name": "Checkbox Group",
              "status": true,
              "asignee": "Shadab",
              "complexity": "Low"
            },
            {
              "name": "Code Scanner",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Low"
            },
            {
              "name": "Container",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Critical"
            },
            {
              "name": "Currency Input",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Low"
            },
            {
              "name": "Custom libraries",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Critical"
            },
            {
              "name": "Date Picker",
              "status": true,
              "asignee": "Shadab",
              "complexity": "Medium"
            },
            {
              "name": "Divider widget",
              "status": true,
              "asignee": "Chandan",
              "complexity": "Low"
            },
            {
              "name": "Document Viewer",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Low"
            },
            {
              "name": "FilePicker",
              "status": true,
              "asignee": "Chandan",
              "complexity": "Medium"
            },
            {
              "name": "Firestore DS",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Medium"
            },
            {
              "name": "Form",
              "status": true,
              "asignee": "Chandan",
              "complexity": "High"
            },
            {
              "name": "Framework Functions",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Critical"
            },
            {
              "name": "Git + Git import",
              "status": true,
              "asignee": "Parthvi",
              "complexity": "Critical"
            },
            {
              "name": "GoogleSheets",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Critical"
            },
            {
              "name": "GraphQL",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Medium"
            },
            {
              "name": "Home page",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Medium"
            },
            {
              "name": "HubSpot",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Low"
            },
            {
              "name": "Icon widget",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Medium"
            },
            {
              "name": "Image Widget",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "High"
            },
            {
              "name": "Import/Export App level",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Medium"
            },
            {
              "name": "In-built libraries",
              "status": true,
              "asignee": "Anandi",
              "complexity": "High"
            },
            {
              "name": "Input",
              "status": true,
              "asignee": "Shadab",
              "complexity": "Critical"
            },
            {
              "name": "Install testing",
              "status": true,
              "asignee": "Saroj",
              "complexity": "Critical"
            },
            {
              "name": "JS Objects",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Critical"
            },
            {
              "name": "JSON Form",
              "status": false,
              "asignee": "Chandan",
              "complexity": "Medium"
            },
            {
              "name": "Javascript",
              "status": true,
              "asignee": "Saptami",
              "complexity": "High"
            },
            {
              "name": "List",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Critical"
            },
            {
              "name": "Map",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Low"
            },
            {
              "name": "Map Chart",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Low"
            },
            {
              "name": "Menu Widget",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Medium"
            },
            {
              "name": "Microsoft SQL",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Medium"
            },
            {
              "name": "Modal",
              "status": true,
              "asignee": "Chandan",
              "complexity": "High"
            },
            {
              "name": "MongoDB",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Critical"
            },
            {
              "name": "Multi Select widget",
              "status": true,
              "asignee": "Shadab",
              "complexity": "Low"
            },
            {
              "name": "Multi Tree Select widget",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Medium"
            },
            {
              "name": "MySQL",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Critical"
            },
            {
              "name": "Number  Slider",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Low"
            },
            {
              "name": "OAuth with Dropbox/Calendly",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Medium"
            },
            {
              "name": "Omnibar Navigation",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Critical"
            },
            {
              "name": "Oracle",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "High"
            },
            {
              "name": "Page Setting ",
              "status": true,
              "asignee": "Saptami",
              "complexity": "High"
            },
            {
              "name": "Page level actions",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Critical"
            },
            {
              "name": "Phone Input",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Low"
            },
            {
              "name": "PostgreSQL",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Critical"
            },
            {
              "name": "Progress",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Low"
            },
            {
              "name": "Radio",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Low"
            },
            {
              "name": "Range Slider",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Low"
            },
            {
              "name": "Rating Widget",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Low"
            },
            {
              "name": "Reflow",
              "status": true,
              "asignee": "Laveena",
              "complexity": "High"
            },
            {
              "name": "Rich Text Editor Widge",
              "status": true,
              "asignee": "Chandan",
              "complexity": "Medium"
            },
            {
              "name": "S3",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Medium"
            },
            {
              "name": "SMTP",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Medium"
            },
            {
              "name": "SSO (CE+EE)",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Critical"
            },
            {
              "name": "SSO with other Deployment Scenarios",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Critical"
            },
            {
              "name": "Select widget",
              "status": true,
              "asignee": "Shadab",
              "complexity": "High"
            },
            {
              "name": "Signup/Signin",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Critical"
            },
            {
              "name": "Snowflake",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Low"
            },
            {
              "name": "Stat box",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Medium"
            },
            {
              "name": "Switch",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Low"
            },
            {
              "name": "Switch group ",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Low"
            },
            {
              "name": "Tab Widget ",
              "status": true,
              "asignee": "Laveena",
              "complexity": "High"
            },
            {
              "name": "Table Widget",
              "status": false,
              "asignee": "Chandan",
              "complexity": "Critical"
            },
            {
              "name": "Templates",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Critical"
            },
            {
              "name": "Text Widget",
              "status": true,
              "asignee": "Laveena",
              "complexity": "High"
            },
            {
              "name": "Theming",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "High"
            },
            {
              "name": "Tree Select widget",
              "status": true,
              "asignee": "Shadab",
              "complexity": "Medium"
            },
            {
              "name": "UX/UI Issues",
              "status": true,
              "asignee": "Shadab",
              "complexity": "High"
            },
            {
              "name": "Upgrade Testing - FE/NDX/Git",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Critical"
            },
            {
              "name": "Upgrade Testing - Platform/Integration",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Critical"
            },
            {
              "name": "Upgrade Testing - SSO",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Critical"
            },
            {
              "name": "Upgrade Testing - UI/AppViewers/Mobile/Design",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Critical"
            },
            {
              "name": "Video",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Low"
            },
            {
              "name": "Vulnerability check",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Critical"
            },
            {
              "name": "iFrame Widget ",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Medium"
            }
          ],
          "done": true,
          "release_id": 111,
          "commit_id": "dd54ddae871584fb867114c26e073de4b8c85c1d",
          "notes": ""
        },
        {
          "id": 75,
          "created_at": "2023-05-30T04:51:05.290176+00:00",
          "name": "Release",
          "date": "2023-05-30",
          "roster": [
            {
              "name": "API/cURL/Auth API ",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "High"
            },
            {
              "name": "Action Selector",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Critical"
            },
            {
              "name": "Airtable",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Medium"
            },
            {
              "name": "App Level Import",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Medium"
            },
            {
              "name": "App Sharing",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Medium"
            },
            {
              "name": "App level actions [Forking App with pages, widgets + datasources + JS objects/Sharing App /Duplicate App]",
              "status": true,
              "asignee": "Sripriya",
              "complexity": "Critical"
            },
            {
              "name": "ArangoDB",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Low"
            },
            {
              "name": "Audio",
              "status": true,
              "asignee": "Chandan",
              "complexity": "Low"
            },
            {
              "name": "Audio Recorder widget",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Low"
            },
            {
              "name": "Billing and Usage Testing",
              "status": true,
              "asignee": "Harsha",
              "complexity": "Critical"
            },
            {
              "name": "Button",
              "status": true,
              "asignee": "Shadab",
              "complexity": "High"
            },
            {
              "name": "Button Group Widget",
              "status": true,
              "asignee": "Shadab",
              "complexity": "Medium"
            },
            {
              "name": "Camera",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Low"
            },
            {
              "name": "Category Slider",
              "status": true,
              "asignee": "Sripriya",
              "complexity": "Low"
            },
            {
              "name": "Chart",
              "status": true,
              "asignee": "Chandan",
              "complexity": "High"
            },
            {
              "name": "Checkbox Group",
              "status": true,
              "asignee": "Shadab",
              "complexity": "Low"
            },
            {
              "name": "Code Scanner",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Low"
            },
            {
              "name": "Container",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Critical"
            },
            {
              "name": "Currency Input",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Low"
            },
            {
              "name": "Custom libraries",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Critical"
            },
            {
              "name": "Date Picker",
              "status": true,
              "asignee": "Chandan",
              "complexity": "Medium"
            },
            {
              "name": "Divider widget",
              "status": true,
              "asignee": "Chandan",
              "complexity": "Low"
            },
            {
              "name": "Document Viewer",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Low"
            },
            {
              "name": "FilePicker",
              "status": true,
              "asignee": "Chandan",
              "complexity": "Medium"
            },
            {
              "name": "Firestore DS",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Medium"
            },
            {
              "name": "Form",
              "status": true,
              "asignee": "Shadab",
              "complexity": "High"
            },
            {
              "name": "Framework Functions",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Critical"
            },
            {
              "name": "Git + Git import",
              "status": true,
              "asignee": "Parthvi",
              "complexity": "Critical"
            },
            {
              "name": "GoogleSheets",
              "status": false,
              "asignee": "Prapulla",
              "complexity": "Critical"
            },
            {
              "name": "GraphQL",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Medium"
            },
            {
              "name": "Home page",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Medium"
            },
            {
              "name": "HubSpot",
              "status": false,
              "asignee": "Prapulla",
              "complexity": "Low"
            },
            {
              "name": "Icon widget",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Medium"
            },
            {
              "name": "Image Widget",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "High"
            },
            {
              "name": "Import/Export App level",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Medium"
            },
            {
              "name": "In-built libraries",
              "status": true,
              "asignee": "Anandi",
              "complexity": "High"
            },
            {
              "name": "Input",
              "status": true,
              "asignee": "Shadab",
              "complexity": "Critical"
            },
            {
              "name": "Install testing",
              "status": true,
              "asignee": "Saroj",
              "complexity": "Critical"
            },
            {
              "name": "JS Objects",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Critical"
            },
            {
              "name": "JSON Form",
              "status": true,
              "asignee": "Chandan",
              "complexity": "Medium"
            },
            {
              "name": "Javascript",
              "status": true,
              "asignee": "Saptami",
              "complexity": "High"
            },
            {
              "name": "List",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Critical"
            },
            {
              "name": "Map",
              "status": false,
              "asignee": "Saptami",
              "complexity": "Low"
            },
            {
              "name": "Map Chart",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Low"
            },
            {
              "name": "Menu Widget",
              "status": true,
              "asignee": "Sripriya",
              "complexity": "Medium"
            },
            {
              "name": "Microsoft SQL",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Medium"
            },
            {
              "name": "Modal",
              "status": true,
              "asignee": "Chandan",
              "complexity": "High"
            },
            {
              "name": "MongoDB",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Critical"
            },
            {
              "name": "Multi Select widget",
              "status": true,
              "asignee": "Shadab",
              "complexity": "Low"
            },
            {
              "name": "Multi Tree Select widget",
              "status": true,
              "asignee": "Sripriya",
              "complexity": "Medium"
            },
            {
              "name": "MySQL",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Critical"
            },
            {
              "name": "Number  Slider",
              "status": true,
              "asignee": "Sripriya",
              "complexity": "Low"
            },
            {
              "name": "OAuth with Dropbox/Calendly",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Medium"
            },
            {
              "name": "Older Apps Testing",
              "status": false,
              "asignee": "All",
              "complexity": "High"
            },
            {
              "name": "Omnibar Navigation",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Critical"
            },
            {
              "name": "Oracle",
              "status": true,
              "asignee": "Aparna",
              "complexity": "High"
            },
            {
              "name": "Page Setting ",
              "status": true,
              "asignee": "Saptami",
              "complexity": "High"
            },
            {
              "name": "Page level actions",
              "status": true,
              "asignee": "Sripriya",
              "complexity": "Critical"
            },
            {
              "name": "Phone Input",
              "status": true,
              "asignee": "Chandan",
              "complexity": "Low"
            },
            {
              "name": "PostgreSQL",
              "status": true,
              "asignee": "Harsha",
              "complexity": "Critical"
            },
            {
              "name": "Progress",
              "status": true,
              "asignee": "Sripriya",
              "complexity": "Low"
            },
            {
              "name": "Radio",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Low"
            },
            {
              "name": "Range Slider",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Low"
            },
            {
              "name": "Rating Widget",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Low"
            },
            {
              "name": "Reflow",
              "status": false,
              "asignee": "Kamakshi",
              "complexity": "High"
            },
            {
              "name": "Rich Text Editor Widge",
              "status": true,
              "asignee": "Chandan",
              "complexity": "Medium"
            },
            {
              "name": "S3",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Medium"
            },
            {
              "name": "SMTP",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Medium"
            },
            {
              "name": "SSO (CE+EE)",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Critical"
            },
            {
              "name": "SSO with other Deployment Scenarios",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Critical"
            },
            {
              "name": "Select widget",
              "status": true,
              "asignee": "Shadab",
              "complexity": "High"
            },
            {
              "name": "Signup/Signin",
              "status": true,
              "asignee": "Sripriya",
              "complexity": "Critical"
            },
            {
              "name": "Snowflake",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Low"
            },
            {
              "name": "Stat box",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Medium"
            },
            {
              "name": "Switch",
              "status": true,
              "asignee": "Kamakshi",
              "complexity": "Low"
            },
            {
              "name": "Switch group ",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Low"
            },
            {
              "name": "Tab Widget ",
              "status": true,
              "asignee": "Laveena",
              "complexity": "High"
            },
            {
              "name": "Table Widget",
              "status": true,
              "asignee": "Chandan",
              "complexity": "Critical"
            },
            {
              "name": "Templates",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Critical"
            },
            {
              "name": "Text Widget",
              "status": true,
              "asignee": "Laveena",
              "complexity": "High"
            },
            {
              "name": "Theming",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "High"
            },
            {
              "name": "Tree Select widget",
              "status": true,
              "asignee": "Shadab",
              "complexity": "Medium"
            },
            {
              "name": "UX/UI Issues",
              "status": false,
              "asignee": "Kamakshi",
              "complexity": "High"
            },
            {
              "name": "Upgrade Testing - FE/NDX/Git",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Critical"
            },
            {
              "name": "Upgrade Testing - Platform/Integration",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Critical"
            },
            {
              "name": "Upgrade Testing - SSO",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Critical"
            },
            {
              "name": "Upgrade Testing - UI/AppViewers/Mobile/Design",
              "status": false,
              "asignee": "Kamakshi",
              "complexity": "Critical"
            },
            {
              "name": "Video",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Low"
            },
            {
              "name": "Vulnerability check",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Critical"
            },
            {
              "name": "iFrame Widget ",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Medium"
            }
          ],
          "done": true,
          "release_id": 110,
          "commit_id": "bbd083c3d46e8951ea7ded88ad9f1b283d4beaac",
          "notes": "<p class=\"p1\">This regression happened on both CE and EE environments by creating respective branches from the release. There were a couple of important changes that went in this time. Note: there are comparatively more blockers than usual.<span class=\"Apple-converted-space\">  </span>We are also tracking the blockers and their status here - <a href=\"https://docs.google.com/spreadsheets/d/1LVig_7WbiCwwDsUqsKO7HgKkFb6Obj7c6JLJxC4G1XE/edit#gid=1580699876\"><span class=\"s1\">https://docs.google.com/spreadsheets/d/1LVig_7WbiCwwDsUqsKO7HgKkFb6Obj7c6JLJxC4G1XE/edit#gid=1580699876</span></a>. The blockers are already being worked on by Developers.</p>"
        },
        {
          "id": 84,
          "created_at": "2023-08-01T07:23:19.149972+00:00",
          "name": "Release",
          "date": "2023-08-01",
          "roster": [
            {
              "name": "API/cURL/Auth API ",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "High"
            },
            {
              "name": "Action Selector",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Critical"
            },
            {
              "name": "Airtable",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Medium"
            },
            {
              "name": "App Level Import",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Medium"
            },
            {
              "name": "App Sharing",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Medium"
            },
            {
              "name": "App level actions [Forking App with pages, widgets + datasources + JS objects/Sharing App /Duplicate App]",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Critical"
            },
            {
              "name": "ArangoDB",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Low"
            },
            {
              "name": "Audio",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Low"
            },
            {
              "name": "Audio Recorder widget",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Low"
            },
            {
              "name": "Button",
              "status": true,
              "asignee": "Shadab",
              "complexity": "High"
            },
            {
              "name": "Button Group Widget",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Medium"
            },
            {
              "name": "Camera",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Low"
            },
            {
              "name": "Category Slider",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Low"
            },
            {
              "name": "Chart",
              "status": false,
              "asignee": "Chandan",
              "complexity": "High"
            },
            {
              "name": "Checkbox Group",
              "status": true,
              "asignee": "Harsha",
              "complexity": "Low"
            },
            {
              "name": "Code Scanner",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Low"
            },
            {
              "name": "Container",
              "status": false,
              "asignee": "Chandan",
              "complexity": "Critical"
            },
            {
              "name": "Currency Input",
              "status": true,
              "asignee": "Shadab",
              "complexity": "Low"
            },
            {
              "name": "Custom libraries",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Critical"
            },
            {
              "name": "Date Picker",
              "status": false,
              "asignee": "Shwetha",
              "complexity": "Medium"
            },
            {
              "name": "Divider widget",
              "status": false,
              "asignee": "Chandan",
              "complexity": "Low"
            },
            {
              "name": "Document Viewer",
              "status": false,
              "asignee": "Chandan",
              "complexity": "Low"
            },
            {
              "name": "Enterprise B and U ",
              "status": true,
              "asignee": "Harsha",
              "complexity": "Critical"
            },
            {
              "name": "FilePicker",
              "status": true,
              "asignee": "Shadab",
              "complexity": "Medium"
            },
            {
              "name": "Firestore DS",
              "status": true,
              "asignee": "Harsha",
              "complexity": "Medium"
            },
            {
              "name": "Forking an application - All DS",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Critical"
            },
            {
              "name": "Form",
              "status": true,
              "asignee": "Kamakshi",
              "complexity": "High"
            },
            {
              "name": "Framework Functions",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Critical"
            },
            {
              "name": "GSheets Automation",
              "status": true,
              "asignee": "Saroj",
              "complexity": "High"
            },
            {
              "name": "GSheetsAuthorization",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Critical"
            },
            {
              "name": "Git + Git import",
              "status": true,
              "asignee": "Parthvi",
              "complexity": "Critical"
            },
            {
              "name": "GraphQL",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Medium"
            },
            {
              "name": "Home page",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Medium"
            },
            {
              "name": "HubSpot",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Low"
            },
            {
              "name": "Icon widget",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Medium"
            },
            {
              "name": "Image Widget",
              "status": true,
              "asignee": "Shadab",
              "complexity": "High"
            },
            {
              "name": "Import/Export App level",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Medium"
            },
            {
              "name": "In-built libraries",
              "status": true,
              "asignee": "Saptami",
              "complexity": "High"
            },
            {
              "name": "Input",
              "status": true,
              "asignee": "Shadab",
              "complexity": "Critical"
            },
            {
              "name": "Install testing",
              "status": true,
              "asignee": "Saroj",
              "complexity": "Critical"
            },
            {
              "name": "JS Objects",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Critical"
            },
            {
              "name": "JSON Form",
              "status": false,
              "asignee": "Chandan",
              "complexity": "Medium"
            },
            {
              "name": "Javascript",
              "status": true,
              "asignee": "Saptami",
              "complexity": "High"
            },
            {
              "name": "List",
              "status": true,
              "asignee": "Kamakshi",
              "complexity": "Critical"
            },
            {
              "name": "Map",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Low"
            },
            {
              "name": "Map Chart",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Low"
            },
            {
              "name": "Menu Widget",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Medium"
            },
            {
              "name": "Microsoft SQL",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Medium"
            },
            {
              "name": "Mobile Automation",
              "status": false,
              "asignee": "Vijetha",
              "complexity": "High"
            },
            {
              "name": "Modal",
              "status": false,
              "asignee": "Chandan",
              "complexity": "High"
            },
            {
              "name": "MongoDB",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Critical"
            },
            {
              "name": "Multi Select widget",
              "status": true,
              "asignee": "Kamakshi",
              "complexity": "Low"
            },
            {
              "name": "Multi Tree Select widget",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Medium"
            },
            {
              "name": "Multiple Env",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Critical"
            },
            {
              "name": "MySQL",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Critical"
            },
            {
              "name": "Number  Slider",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Low"
            },
            {
              "name": "OAuth with Dropbox/Calendly",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Medium"
            },
            {
              "name": "Older Apps Testing",
              "status": false,
              "asignee": "All",
              "complexity": "High"
            },
            {
              "name": "Omnibar Navigation",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Critical"
            },
            {
              "name": "Oracle",
              "status": true,
              "asignee": "Aparna",
              "complexity": "High"
            },
            {
              "name": "Page Setting ",
              "status": true,
              "asignee": "Anandi",
              "complexity": "High"
            },
            {
              "name": "Page level actions",
              "status": false,
              "asignee": "Shwetha",
              "complexity": "Critical"
            },
            {
              "name": "Phone Input",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Low"
            },
            {
              "name": "Progress",
              "status": true,
              "asignee": "Harsha",
              "complexity": "Low"
            },
            {
              "name": "Radio",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Low"
            },
            {
              "name": "Range Slider",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Low"
            },
            {
              "name": "Rating Widget",
              "status": true,
              "asignee": "Harsha",
              "complexity": "Low"
            },
            {
              "name": "Reflow",
              "status": true,
              "asignee": "Laveena",
              "complexity": "High"
            },
            {
              "name": "Rich Text Editor Widge",
              "status": false,
              "asignee": "Chandan",
              "complexity": "Medium"
            },
            {
              "name": "S3",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Medium"
            },
            {
              "name": "SCIM",
              "status": true,
              "asignee": "Raksha",
              "complexity": "High"
            },
            {
              "name": "SMTP",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Medium"
            },
            {
              "name": "SSO (CE+EE)",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Critical"
            },
            {
              "name": "SSO with other Deployment Scenarios",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Critical"
            },
            {
              "name": "Select widget",
              "status": false,
              "asignee": "Chandan",
              "complexity": "High"
            },
            {
              "name": "Self Serv B and U",
              "status": true,
              "asignee": "Harsha",
              "complexity": "High"
            },
            {
              "name": "Signup/Signin",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Critical"
            },
            {
              "name": "Snowflake",
              "status": true,
              "asignee": "Harsha",
              "complexity": "Low"
            },
            {
              "name": "Stat box",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Medium"
            },
            {
              "name": "Switch",
              "status": true,
              "asignee": "Shadab",
              "complexity": "Low"
            },
            {
              "name": "Switch group ",
              "status": true,
              "asignee": "Shadab",
              "complexity": "Low"
            },
            {
              "name": "Tab Widget ",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "High"
            },
            {
              "name": "Table Widget",
              "status": true,
              "asignee": "Kamakshi",
              "complexity": "Critical"
            },
            {
              "name": "Templates",
              "status": false,
              "asignee": "Saptami",
              "complexity": "Critical"
            },
            {
              "name": "Text Widget",
              "status": true,
              "asignee": "Laveena",
              "complexity": "High"
            },
            {
              "name": "Theming",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "High"
            },
            {
              "name": "Tree Select widget",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Medium"
            },
            {
              "name": "UX/UI Issues",
              "status": false,
              "asignee": "Kamakshi",
              "complexity": "High"
            },
            {
              "name": "Upgrade Testing - FE/NDX/Git",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Critical"
            },
            {
              "name": "Upgrade Testing - Platform/Integration",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Critical"
            },
            {
              "name": "Upgrade Testing - SSO",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Critical"
            },
            {
              "name": "Upgrade Testing - UI/AppViewers/Mobile/Design",
              "status": false,
              "asignee": "Kamakshi",
              "complexity": "Critical"
            },
            {
              "name": "Video",
              "status": true,
              "asignee": "Kamakshi",
              "complexity": "Low"
            },
            {
              "name": "Vulnerability check",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Critical"
            },
            {
              "name": "iFrame Widget ",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Medium"
            }
          ],
          "done": true,
          "release_id": 135,
          "commit_id": "0521ba2c0d7a62cef3d4def66fc15b59cc34ceef",
          "notes": ""
        },
        {
          "id": 83,
          "created_at": "2023-07-25T10:04:41.499842+00:00",
          "name": "Release",
          "date": "2023-07-24",
          "roster": [
            {
              "name": "API/cURL/Auth API ",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "High"
            },
            {
              "name": "Action Selector",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Critical"
            },
            {
              "name": "Airtable",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Medium"
            },
            {
              "name": "App Level Import",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Medium"
            },
            {
              "name": "App Sharing",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Medium"
            },
            {
              "name": "App level actions [Forking App with pages, widgets + datasources + JS objects/Sharing App /Duplicate App]",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Critical"
            },
            {
              "name": "ArangoDB",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Low"
            },
            {
              "name": "Audio",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Low"
            },
            {
              "name": "Audio Recorder widget",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Low"
            },
            {
              "name": "Button",
              "status": true,
              "asignee": "Chandan",
              "complexity": "High"
            },
            {
              "name": "Button Group Widget",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Medium"
            },
            {
              "name": "Camera",
              "status": true,
              "asignee": "Kavita",
              "complexity": "Low"
            },
            {
              "name": "Category Slider",
              "status": true,
              "asignee": "Chandan",
              "complexity": "Low"
            },
            {
              "name": "Chart",
              "status": true,
              "asignee": "Chandan",
              "complexity": "High"
            },
            {
              "name": "Checkbox Group",
              "status": true,
              "asignee": "Harsha",
              "complexity": "Low"
            },
            {
              "name": "Code Scanner",
              "status": true,
              "asignee": "Kavita",
              "complexity": "Low"
            },
            {
              "name": "Container",
              "status": true,
              "asignee": "Chandan",
              "complexity": "Critical"
            },
            {
              "name": "Currency Input",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Low"
            },
            {
              "name": "Custom libraries",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Critical"
            },
            {
              "name": "Date Picker",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Medium"
            },
            {
              "name": "Divider widget",
              "status": true,
              "asignee": "Chandan",
              "complexity": "Low"
            },
            {
              "name": "Document Viewer",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Low"
            },
            {
              "name": "Enterprise B and U ",
              "status": true,
              "asignee": "Harsha",
              "complexity": "Critical"
            },
            {
              "name": "FilePicker",
              "status": true,
              "asignee": "Kamakshi",
              "complexity": "Medium"
            },
            {
              "name": "Firestore DS",
              "status": true,
              "asignee": "Harsha",
              "complexity": "Medium"
            },
            {
              "name": "Forking an application - All DS",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Critical"
            },
            {
              "name": "Form",
              "status": true,
              "asignee": "Kamakshi",
              "complexity": "High"
            },
            {
              "name": "Framework Functions",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Critical"
            },
            {
              "name": "GSheets Automation",
              "status": true,
              "asignee": "Saroj",
              "complexity": "High"
            },
            {
              "name": "Git + Git import",
              "status": true,
              "asignee": "Parthvi",
              "complexity": "Critical"
            },
            {
              "name": "GoogleSheets",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Critical"
            },
            {
              "name": "GraphQL",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Medium"
            },
            {
              "name": "Home page",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Medium"
            },
            {
              "name": "HubSpot",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Low"
            },
            {
              "name": "Icon widget",
              "status": true,
              "asignee": "Kavita",
              "complexity": "Medium"
            },
            {
              "name": "Image Widget",
              "status": true,
              "asignee": "Kavita",
              "complexity": "High"
            },
            {
              "name": "Import/Export App level",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Medium"
            },
            {
              "name": "In-built libraries",
              "status": true,
              "asignee": "Saptami",
              "complexity": "High"
            },
            {
              "name": "Input",
              "status": true,
              "asignee": "Chandan",
              "complexity": "Critical"
            },
            {
              "name": "Install testing",
              "status": true,
              "asignee": "Saroj",
              "complexity": "Critical"
            },
            {
              "name": "JS Objects",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Critical"
            },
            {
              "name": "JSON Form",
              "status": false,
              "asignee": "Chandan",
              "complexity": "Medium"
            },
            {
              "name": "Javascript",
              "status": true,
              "asignee": "Saptami",
              "complexity": "High"
            },
            {
              "name": "List",
              "status": true,
              "asignee": "Kamakshi",
              "complexity": "Critical"
            },
            {
              "name": "Map",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Low"
            },
            {
              "name": "Map Chart",
              "status": false,
              "asignee": "Shwetha",
              "complexity": "Low"
            },
            {
              "name": "Menu Widget",
              "status": true,
              "asignee": "Chandan",
              "complexity": "Medium"
            },
            {
              "name": "Microsoft SQL",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Medium"
            },
            {
              "name": "Mobile Automation",
              "status": false,
              "asignee": "Vijetha",
              "complexity": "High"
            },
            {
              "name": "Modal",
              "status": true,
              "asignee": "Chandan",
              "complexity": "High"
            },
            {
              "name": "MongoDB",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Critical"
            },
            {
              "name": "Multi Select widget",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Low"
            },
            {
              "name": "Multi Tree Select widget",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Medium"
            },
            {
              "name": "MySQL",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Critical"
            },
            {
              "name": "Number  Slider",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Low"
            },
            {
              "name": "OAuth with Dropbox/Calendly",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Medium"
            },
            {
              "name": "Older Apps Testing",
              "status": false,
              "asignee": "All",
              "complexity": "High"
            },
            {
              "name": "Omnibar Navigation",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Critical"
            },
            {
              "name": "Oracle",
              "status": true,
              "asignee": "Aparna",
              "complexity": "High"
            },
            {
              "name": "Page Setting ",
              "status": true,
              "asignee": "Kavita",
              "complexity": "High"
            },
            {
              "name": "Page level actions",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Critical"
            },
            {
              "name": "Phone Input",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Low"
            },
            {
              "name": "Progress",
              "status": true,
              "asignee": "Harsha",
              "complexity": "Low"
            },
            {
              "name": "Radio",
              "status": true,
              "asignee": "Kavita",
              "complexity": "Low"
            },
            {
              "name": "Range Slider",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Low"
            },
            {
              "name": "Rating Widget",
              "status": true,
              "asignee": "Harsha",
              "complexity": "Low"
            },
            {
              "name": "Reflow",
              "status": true,
              "asignee": "Kamakshi",
              "complexity": "High"
            },
            {
              "name": "Rich Text Editor Widge",
              "status": false,
              "asignee": "Chandan",
              "complexity": "Medium"
            },
            {
              "name": "S3",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Medium"
            },
            {
              "name": "SMTP",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Medium"
            },
            {
              "name": "SSO (CE+EE)",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Critical"
            },
            {
              "name": "SSO with other Deployment Scenarios",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Critical"
            },
            {
              "name": "Select widget",
              "status": true,
              "asignee": "Kamakshi",
              "complexity": "High"
            },
            {
              "name": "Self Serv B and U",
              "status": true,
              "asignee": "Harsha",
              "complexity": "High"
            },
            {
              "name": "Signup/Signin",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Critical"
            },
            {
              "name": "Snowflake",
              "status": true,
              "asignee": "Harsha",
              "complexity": "Low"
            },
            {
              "name": "Stat box",
              "status": true,
              "asignee": "Kavita",
              "complexity": "Medium"
            },
            {
              "name": "Switch",
              "status": true,
              "asignee": "Kamakshi",
              "complexity": "Low"
            },
            {
              "name": "Switch group ",
              "status": true,
              "asignee": "Kamakshi",
              "complexity": "Low"
            },
            {
              "name": "Tab Widget ",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "High"
            },
            {
              "name": "Table Widget",
              "status": true,
              "asignee": "Kamakshi",
              "complexity": "Critical"
            },
            {
              "name": "Templates",
              "status": true,
              "asignee": "Kavita",
              "complexity": "Critical"
            },
            {
              "name": "Text Widget",
              "status": true,
              "asignee": "Kamakshi",
              "complexity": "High"
            },
            {
              "name": "Theming",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "High"
            },
            {
              "name": "Tree Select widget",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Medium"
            },
            {
              "name": "UX/UI Issues",
              "status": false,
              "asignee": "Kamakshi",
              "complexity": "High"
            },
            {
              "name": "Upgrade Testing - FE/NDX/Git",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Critical"
            },
            {
              "name": "Upgrade Testing - Platform/Integration",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Critical"
            },
            {
              "name": "Upgrade Testing - SSO",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Critical"
            },
            {
              "name": "Upgrade Testing - UI/AppViewers/Mobile/Design",
              "status": false,
              "asignee": "Kamakshi",
              "complexity": "Critical"
            },
            {
              "name": "Video",
              "status": true,
              "asignee": "Kavita",
              "complexity": "Low"
            },
            {
              "name": "Vulnerability check",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Critical"
            },
            {
              "name": "iFrame Widget ",
              "status": true,
              "asignee": "Chandan",
              "complexity": "Medium"
            }
          ],
          "done": true,
          "release_id": 134,
          "commit_id": "36fd7b78deba96b0e52913105d93e1503d16bac6",
          "notes": ""
        },
        {
          "id": 77,
          "created_at": "2023-06-12T07:25:14.958685+00:00",
          "name": "Release",
          "date": "2023-06-12",
          "roster": [
            {
              "name": "API/cURL/Auth API ",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "High"
            },
            {
              "name": "Action Selector",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Critical"
            },
            {
              "name": "Airtable",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Medium"
            },
            {
              "name": "App Level Import",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Medium"
            },
            {
              "name": "App Sharing",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Medium"
            },
            {
              "name": "App level actions [Forking App with pages, widgets + datasources + JS objects/Sharing App /Duplicate App]",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Critical"
            },
            {
              "name": "ArangoDB",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Low"
            },
            {
              "name": "Audio",
              "status": false,
              "asignee": "Chandan",
              "complexity": "Low"
            },
            {
              "name": "Audio Recorder widget",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Low"
            },
            {
              "name": "Billing and Usage Testing",
              "status": false,
              "asignee": "Harsha",
              "complexity": "Critical"
            },
            {
              "name": "Button",
              "status": true,
              "asignee": "Shadab",
              "complexity": "High"
            },
            {
              "name": "Button Group Widget",
              "status": true,
              "asignee": "Shadab",
              "complexity": "Medium"
            },
            {
              "name": "Camera",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Low"
            },
            {
              "name": "Category Slider",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Low"
            },
            {
              "name": "Chart",
              "status": false,
              "asignee": "Chandan",
              "complexity": "High"
            },
            {
              "name": "Checkbox Group",
              "status": true,
              "asignee": "Shadab",
              "complexity": "Low"
            },
            {
              "name": "Code Scanner",
              "status": true,
              "asignee": "Kavita",
              "complexity": "Low"
            },
            {
              "name": "Container",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Critical"
            },
            {
              "name": "Currency Input",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Low"
            },
            {
              "name": "Custom libraries",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Critical"
            },
            {
              "name": "Date Picker",
              "status": true,
              "asignee": "Shadab",
              "complexity": "Medium"
            },
            {
              "name": "Divider widget",
              "status": false,
              "asignee": "Chandan",
              "complexity": "Low"
            },
            {
              "name": "Document Viewer",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Low"
            },
            {
              "name": "FilePicker",
              "status": false,
              "asignee": "Chandan",
              "complexity": "Medium"
            },
            {
              "name": "Firestore DS",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Medium"
            },
            {
              "name": "Form",
              "status": false,
              "asignee": "Chandan",
              "complexity": "High"
            },
            {
              "name": "Framework Functions",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Critical"
            },
            {
              "name": "Git + Git import",
              "status": true,
              "asignee": "Parthvi",
              "complexity": "Critical"
            },
            {
              "name": "GoogleSheets",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Critical"
            },
            {
              "name": "GraphQL",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Medium"
            },
            {
              "name": "Home page",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Medium"
            },
            {
              "name": "HubSpot",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Low"
            },
            {
              "name": "Icon widget",
              "status": true,
              "asignee": "Kavita",
              "complexity": "Medium"
            },
            {
              "name": "Image Widget",
              "status": true,
              "asignee": "Kavita",
              "complexity": "High"
            },
            {
              "name": "Import/Export App level",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Medium"
            },
            {
              "name": "In-built libraries",
              "status": true,
              "asignee": "Anandi",
              "complexity": "High"
            },
            {
              "name": "Input",
              "status": true,
              "asignee": "Shadab",
              "complexity": "Critical"
            },
            {
              "name": "Install testing",
              "status": true,
              "asignee": "Saroj",
              "complexity": "Critical"
            },
            {
              "name": "JS Objects",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Critical"
            },
            {
              "name": "JSON Form",
              "status": false,
              "asignee": "Chandan",
              "complexity": "Medium"
            },
            {
              "name": "Javascript",
              "status": true,
              "asignee": "Saptami",
              "complexity": "High"
            },
            {
              "name": "List",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Critical"
            },
            {
              "name": "Map",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Low"
            },
            {
              "name": "Map Chart",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Low"
            },
            {
              "name": "Menu Widget",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Medium"
            },
            {
              "name": "Microsoft SQL",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Medium"
            },
            {
              "name": "Modal",
              "status": false,
              "asignee": "Chandan",
              "complexity": "High"
            },
            {
              "name": "MongoDB",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Critical"
            },
            {
              "name": "Multi Select widget",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Low"
            },
            {
              "name": "Multi Tree Select widget",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Medium"
            },
            {
              "name": "MySQL",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Critical"
            },
            {
              "name": "Number  Slider",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Low"
            },
            {
              "name": "OAuth with Dropbox/Calendly",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Medium"
            },
            {
              "name": "Older Apps Testing",
              "status": false,
              "asignee": "All",
              "complexity": "High"
            },
            {
              "name": "Omnibar Navigation",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Critical"
            },
            {
              "name": "Oracle",
              "status": true,
              "asignee": "Aparna",
              "complexity": "High"
            },
            {
              "name": "Page Setting ",
              "status": true,
              "asignee": "Kavita",
              "complexity": "High"
            },
            {
              "name": "Page level actions",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Critical"
            },
            {
              "name": "Phone Input",
              "status": false,
              "asignee": "Harsha",
              "complexity": "Low"
            },
            {
              "name": "PostgreSQL",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Critical"
            },
            {
              "name": "Progress",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Low"
            },
            {
              "name": "Radio",
              "status": false,
              "asignee": "Chandan",
              "complexity": "Low"
            },
            {
              "name": "Range Slider",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Low"
            },
            {
              "name": "Rating Widget",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Low"
            },
            {
              "name": "Reflow",
              "status": true,
              "asignee": "Laveena",
              "complexity": "High"
            },
            {
              "name": "Rich Text Editor Widge",
              "status": false,
              "asignee": "Chandan",
              "complexity": "Medium"
            },
            {
              "name": "S3",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Medium"
            },
            {
              "name": "SMTP",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Medium"
            },
            {
              "name": "SSO (CE+EE)",
              "status": true,
              "asignee": "Sharanya",
              "complexity": "Critical"
            },
            {
              "name": "SSO with other Deployment Scenarios",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Critical"
            },
            {
              "name": "Select widget",
              "status": true,
              "asignee": "Shadab",
              "complexity": "High"
            },
            {
              "name": "Signup/Signin",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Critical"
            },
            {
              "name": "Snowflake",
              "status": true,
              "asignee": "Sharanya",
              "complexity": "Low"
            },
            {
              "name": "Stat box",
              "status": true,
              "asignee": "Kavita",
              "complexity": "Medium"
            },
            {
              "name": "Switch",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Low"
            },
            {
              "name": "Switch group ",
              "status": true,
              "asignee": "Shadab",
              "complexity": "Low"
            },
            {
              "name": "Tab Widget ",
              "status": true,
              "asignee": "Laveena",
              "complexity": "High"
            },
            {
              "name": "Table Widget",
              "status": false,
              "asignee": "Chandan",
              "complexity": "Critical"
            },
            {
              "name": "Templates",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Critical"
            },
            {
              "name": "Text Widget",
              "status": true,
              "asignee": "Laveena",
              "complexity": "High"
            },
            {
              "name": "Theming",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "High"
            },
            {
              "name": "Tree Select widget",
              "status": true,
              "asignee": "Shadab",
              "complexity": "Medium"
            },
            {
              "name": "UX/UI Issues",
              "status": true,
              "asignee": "Shadab",
              "complexity": "High"
            },
            {
              "name": "Upgrade Testing - FE/NDX/Git",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Critical"
            },
            {
              "name": "Upgrade Testing - Platform/Integration",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Critical"
            },
            {
              "name": "Upgrade Testing - SSO",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Critical"
            },
            {
              "name": "Upgrade Testing - UI/AppViewers/Mobile/Design",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Critical"
            },
            {
              "name": "Video",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Low"
            },
            {
              "name": "Vulnerability check",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Critical"
            },
            {
              "name": "iFrame Widget ",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Medium"
            }
          ],
          "done": true,
          "release_id": 112,
          "commit_id": "9330829e4004d44c13ca916cb633959d544886b2",
          "notes": ""
        },
        {
          "id": 85,
          "created_at": "2023-08-07T12:12:44.194528+00:00",
          "name": "Release",
          "date": "2023-08-07",
          "roster": [
            {
              "name": "API/cURL/Auth API ",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "High"
            },
            {
              "name": "Action Selector",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Critical"
            },
            {
              "name": "Airtable",
              "status": false,
              "asignee": "Prapulla",
              "complexity": "Medium"
            },
            {
              "name": "App Level Import",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Medium"
            },
            {
              "name": "App Sharing",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Medium"
            },
            {
              "name": "App level actions [Forking App with pages, widgets + datasources + JS objects/Sharing App /Duplicate App]",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Critical"
            },
            {
              "name": "ArangoDB",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Low"
            },
            {
              "name": "Audio",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Low"
            },
            {
              "name": "Audio Recorder widget",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Low"
            },
            {
              "name": "Button",
              "status": true,
              "asignee": "Shadab",
              "complexity": "High"
            },
            {
              "name": "Button Group Widget",
              "status": true,
              "asignee": "Kavita",
              "complexity": "Medium"
            },
            {
              "name": "Camera",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Low"
            },
            {
              "name": "Category Slider Automation",
              "status": true,
              "asignee": "Nandan",
              "complexity": "Low"
            },
            {
              "name": "Chart",
              "status": false,
              "asignee": "Chandan",
              "complexity": "High"
            },
            {
              "name": "Checkbox Group",
              "status": true,
              "asignee": "Harsha",
              "complexity": "Low"
            },
            {
              "name": "Code Scanner",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Low"
            },
            {
              "name": "Container",
              "status": false,
              "asignee": "Chandan",
              "complexity": "Critical"
            },
            {
              "name": "Currency Input",
              "status": true,
              "asignee": "Shadab",
              "complexity": "Low"
            },
            {
              "name": "Custom libraries",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Critical"
            },
            {
              "name": "Date Picker",
              "status": true,
              "asignee": "Kavita",
              "complexity": "Medium"
            },
            {
              "name": "Divider widget",
              "status": true,
              "asignee": "Kavita",
              "complexity": "Low"
            },
            {
              "name": "Document Viewer",
              "status": false,
              "asignee": "Chandan",
              "complexity": "Low"
            },
            {
              "name": "Enterprise B and U ",
              "status": false,
              "asignee": "Raksha",
              "complexity": "Critical"
            },
            {
              "name": "FilePicker",
              "status": true,
              "asignee": "Shadab",
              "complexity": "Medium"
            },
            {
              "name": "Firestore DS",
              "status": true,
              "asignee": "Harsha",
              "complexity": "Medium"
            },
            {
              "name": "Forking an application - All DS",
              "status": false,
              "asignee": "Prapulla",
              "complexity": "Critical"
            },
            {
              "name": "Form",
              "status": true,
              "asignee": "Kamakshi",
              "complexity": "High"
            },
            {
              "name": "Framework Functions",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Critical"
            },
            {
              "name": "GSheets Automation",
              "status": true,
              "asignee": "Saroj",
              "complexity": "High"
            },
            {
              "name": "GSheetsAuthorization",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Critical"
            },
            {
              "name": "Git + Git import",
              "status": true,
              "asignee": "Parthvi",
              "complexity": "Critical"
            },
            {
              "name": "GraphQL",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Medium"
            },
            {
              "name": "Home page",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Medium"
            },
            {
              "name": "HubSpot",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Low"
            },
            {
              "name": "Icon widget",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Medium"
            },
            {
              "name": "Image Widget",
              "status": true,
              "asignee": "Shadab",
              "complexity": "High"
            },
            {
              "name": "Import/Export App level",
              "status": false,
              "asignee": "Raksha",
              "complexity": "Medium"
            },
            {
              "name": "In-built libraries",
              "status": true,
              "asignee": "Saptami",
              "complexity": "High"
            },
            {
              "name": "Input",
              "status": true,
              "asignee": "Shadab",
              "complexity": "Critical"
            },
            {
              "name": "Install testing",
              "status": true,
              "asignee": "Saroj",
              "complexity": "Critical"
            },
            {
              "name": "JS Objects",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Critical"
            },
            {
              "name": "JSON Form",
              "status": false,
              "asignee": "Chandan",
              "complexity": "Medium"
            },
            {
              "name": "Javascript",
              "status": true,
              "asignee": "Saptami",
              "complexity": "High"
            },
            {
              "name": "List",
              "status": false,
              "asignee": "Kamakshi",
              "complexity": "Critical"
            },
            {
              "name": "Map",
              "status": false,
              "asignee": "Anandi",
              "complexity": "Low"
            },
            {
              "name": "Map Chart",
              "status": false,
              "asignee": "Laveena",
              "complexity": "Low"
            },
            {
              "name": "Menu Widget",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Medium"
            },
            {
              "name": "Mobile Automation",
              "status": false,
              "asignee": "Vijetha",
              "complexity": "High"
            },
            {
              "name": "Modal",
              "status": false,
              "asignee": "Chandan",
              "complexity": "High"
            },
            {
              "name": "Multi Select widget",
              "status": true,
              "asignee": "Kamakshi",
              "complexity": "Low"
            },
            {
              "name": "Multi Tree Select widget",
              "status": false,
              "asignee": "Laveena",
              "complexity": "Medium"
            },
            {
              "name": "Multiple Env",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Critical"
            },
            {
              "name": "Number  Slider Automation",
              "status": true,
              "asignee": "Nandan",
              "complexity": "Low"
            },
            {
              "name": "OAuth with Dropbox/Calendly",
              "status": false,
              "asignee": "Aparna",
              "complexity": "Medium"
            },
            {
              "name": "Older Apps Testing",
              "status": false,
              "asignee": "All",
              "complexity": "High"
            },
            {
              "name": "Omnibar Navigation",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Critical"
            },
            {
              "name": "Oracle",
              "status": true,
              "asignee": "Aparna",
              "complexity": "High"
            },
            {
              "name": "Page Setting ",
              "status": true,
              "asignee": "Anandi",
              "complexity": "High"
            },
            {
              "name": "Page level actions",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Critical"
            },
            {
              "name": "Phone Input",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Low"
            },
            {
              "name": "Progress",
              "status": false,
              "asignee": "Laveena",
              "complexity": "Low"
            },
            {
              "name": "Radio",
              "status": true,
              "asignee": "Kavita",
              "complexity": "Low"
            },
            {
              "name": "Range Slider Automation",
              "status": true,
              "asignee": "Nandan",
              "complexity": "Low"
            },
            {
              "name": "Reflow",
              "status": false,
              "asignee": "Laveena",
              "complexity": "High"
            },
            {
              "name": "Rich Text Editor Widge",
              "status": false,
              "asignee": "Chandan",
              "complexity": "Medium"
            },
            {
              "name": "S3",
              "status": false,
              "asignee": "Prapulla",
              "complexity": "Medium"
            },
            {
              "name": "SCIM",
              "status": false,
              "asignee": "Raksha",
              "complexity": "High"
            },
            {
              "name": "SMTP",
              "status": false,
              "asignee": "Prapulla",
              "complexity": "Medium"
            },
            {
              "name": "SSO (CE+EE)",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Critical"
            },
            {
              "name": "SSO with other Deployment Scenarios",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Critical"
            },
            {
              "name": "Select widget",
              "status": false,
              "asignee": "Chandan",
              "complexity": "High"
            },
            {
              "name": "Self Serv B and U",
              "status": true,
              "asignee": "Harsha",
              "complexity": "High"
            },
            {
              "name": "Signup/Signin",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Critical"
            },
            {
              "name": "Snowflake",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Low"
            },
            {
              "name": "Stat box",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Medium"
            },
            {
              "name": "Switch",
              "status": true,
              "asignee": "Shadab",
              "complexity": "Low"
            },
            {
              "name": "Switch group ",
              "status": true,
              "asignee": "Shadab",
              "complexity": "Low"
            },
            {
              "name": "Tab Widget ",
              "status": true,
              "asignee": "Kavita",
              "complexity": "High"
            },
            {
              "name": "Table Widget",
              "status": false,
              "asignee": "Kamakshi",
              "complexity": "Critical"
            },
            {
              "name": "Templates",
              "status": true,
              "asignee": "Kavita",
              "complexity": "Critical"
            },
            {
              "name": "Text Widget",
              "status": true,
              "asignee": "Laveena",
              "complexity": "High"
            },
            {
              "name": "Theming",
              "status": true,
              "asignee": "Kamakshi",
              "complexity": "High"
            },
            {
              "name": "Tree Select widget",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Medium"
            },
            {
              "name": "UX/UI Issues",
              "status": false,
              "asignee": "Kamakshi",
              "complexity": "High"
            },
            {
              "name": "Upgrade Testing - FE/NDX/Git",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Critical"
            },
            {
              "name": "Upgrade Testing - Platform/Integration",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Critical"
            },
            {
              "name": "Upgrade Testing - SSO",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Critical"
            },
            {
              "name": "Upgrade Testing - UI/AppViewers/Mobile/Design",
              "status": false,
              "asignee": "Kamakshi",
              "complexity": "Critical"
            },
            {
              "name": "Video",
              "status": true,
              "asignee": "Kavita",
              "complexity": "Low"
            },
            {
              "name": "Vulnerability check",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Critical"
            },
            {
              "name": "iFrame Widget ",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Medium"
            }
          ],
          "done": true,
          "release_id": 136,
          "commit_id": "49a973381e1f6c3031510a859ff2a497c9020272",
          "notes": ""
        },
        {
          "id": 73,
          "created_at": "2023-05-08T11:08:37.534607+00:00",
          "name": "Release",
          "date": "2023-05-08",
          "roster": [
            {
              "name": "API/cURL/Auth API ",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "High"
            },
            {
              "name": "Action Selector",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Critical"
            },
            {
              "name": "Airtable",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Medium"
            },
            {
              "name": "App Level Import",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Medium"
            },
            {
              "name": "App Sharing",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Medium"
            },
            {
              "name": "App level actions [Forking App with pages, widgets + datasources + JS objects/Sharing App /Duplicate App]",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Critical"
            },
            {
              "name": "ArangoDB",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Low"
            },
            {
              "name": "Audio",
              "status": true,
              "asignee": "Richa",
              "complexity": "Low"
            },
            {
              "name": "Audio Recorder widget",
              "status": true,
              "asignee": "Richa",
              "complexity": "Low"
            },
            {
              "name": "Billing and Usage Testing",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Critical"
            },
            {
              "name": "Button",
              "status": true,
              "asignee": "Shadab",
              "complexity": "High"
            },
            {
              "name": "Button Group Widget",
              "status": true,
              "asignee": "Shadab",
              "complexity": "Medium"
            },
            {
              "name": "Camera",
              "status": true,
              "asignee": "Chandan",
              "complexity": "Low"
            },
            {
              "name": "Category Slider",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Low"
            },
            {
              "name": "Chart",
              "status": true,
              "asignee": "Chandan",
              "complexity": "High"
            },
            {
              "name": "Checkbox Group",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Low"
            },
            {
              "name": "Code Scanner",
              "status": false,
              "asignee": "Laveena",
              "complexity": "Low"
            },
            {
              "name": "Container",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Critical"
            },
            {
              "name": "Currency Input",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Low"
            },
            {
              "name": "Custom libraries",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Critical"
            },
            {
              "name": "Date Picker",
              "status": true,
              "asignee": "Chandan",
              "complexity": "Medium"
            },
            {
              "name": "Divider widget",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Low"
            },
            {
              "name": "Document Viewer",
              "status": true,
              "asignee": "Chandan",
              "complexity": "Low"
            },
            {
              "name": "FilePicker",
              "status": true,
              "asignee": "Kamakshi",
              "complexity": "Medium"
            },
            {
              "name": "Firestore DS",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Medium"
            },
            {
              "name": "Form",
              "status": true,
              "asignee": "Shadab",
              "complexity": "High"
            },
            {
              "name": "Framework Functions",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Critical"
            },
            {
              "name": "Git + Git import",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Critical"
            },
            {
              "name": "GoogleSheets",
              "status": false,
              "asignee": "Prapulla",
              "complexity": "Critical"
            },
            {
              "name": "GraphQL",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Medium"
            },
            {
              "name": "Home page",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Medium"
            },
            {
              "name": "HubSpot",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Low"
            },
            {
              "name": "Icon widget",
              "status": true,
              "asignee": "Richa",
              "complexity": "Medium"
            },
            {
              "name": "Image Widget",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "High"
            },
            {
              "name": "Import/Export App level",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Medium"
            },
            {
              "name": "In-built libraries",
              "status": true,
              "asignee": "Anandi",
              "complexity": "High"
            },
            {
              "name": "Input",
              "status": true,
              "asignee": "Shadab",
              "complexity": "Critical"
            },
            {
              "name": "Install testing",
              "status": false,
              "asignee": "Saroj",
              "complexity": "Critical"
            },
            {
              "name": "JS Objects",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Critical"
            },
            {
              "name": "JSON Form",
              "status": true,
              "asignee": "Chandan",
              "complexity": "Medium"
            },
            {
              "name": "Javascript",
              "status": true,
              "asignee": "Saptami",
              "complexity": "High"
            },
            {
              "name": "List",
              "status": true,
              "asignee": "Chandan",
              "complexity": "Critical"
            },
            {
              "name": "Map",
              "status": true,
              "asignee": "Richa",
              "complexity": "Low"
            },
            {
              "name": "Map Chart",
              "status": true,
              "asignee": "Richa",
              "complexity": "Low"
            },
            {
              "name": "Menu Widget",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Medium"
            },
            {
              "name": "Microsoft SQL",
              "status": true,
              "asignee": "Anand",
              "complexity": "Medium"
            },
            {
              "name": "Modal",
              "status": true,
              "asignee": "Shadab",
              "complexity": "High"
            },
            {
              "name": "MongoDB",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Critical"
            },
            {
              "name": "Multi Select widget",
              "status": true,
              "asignee": "Shadab",
              "complexity": "Low"
            },
            {
              "name": "Multi Tree Select widget",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Medium"
            },
            {
              "name": "MySQL",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Critical"
            },
            {
              "name": "Number  Slider",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Low"
            },
            {
              "name": "OAuth with Dropbox/Calendly",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Medium"
            },
            {
              "name": "Older Apps Testing",
              "status": false,
              "asignee": "All",
              "complexity": "High"
            },
            {
              "name": "Omnibar Navigation",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Critical"
            },
            {
              "name": "Page Setting ",
              "status": true,
              "asignee": "Richa",
              "complexity": "High"
            },
            {
              "name": "Page level actions",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Critical"
            },
            {
              "name": "Phone Input",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Low"
            },
            {
              "name": "PostgreSQL",
              "status": true,
              "asignee": "Anand",
              "complexity": "Critical"
            },
            {
              "name": "Progress",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Low"
            },
            {
              "name": "Radio",
              "status": false,
              "asignee": "Laveena",
              "complexity": "Low"
            },
            {
              "name": "Range Slider",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Low"
            },
            {
              "name": "Rating Widget",
              "status": false,
              "asignee": "Laveena",
              "complexity": "Low"
            },
            {
              "name": "Reflow",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "High"
            },
            {
              "name": "Rich Text Editor Widge",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Medium"
            },
            {
              "name": "S3",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Medium"
            },
            {
              "name": "SMTP",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Medium"
            },
            {
              "name": "SSO (CE+EE)",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Critical"
            },
            {
              "name": "SSO with other Deployment Scenarios",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Critical"
            },
            {
              "name": "Select widget",
              "status": true,
              "asignee": "Shadab",
              "complexity": "High"
            },
            {
              "name": "Signup/Signin",
              "status": false,
              "asignee": "Shwetha",
              "complexity": "Critical"
            },
            {
              "name": "Snowflake",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Low"
            },
            {
              "name": "Stat box",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Medium"
            },
            {
              "name": "Switch",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Low"
            },
            {
              "name": "Switch group ",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Low"
            },
            {
              "name": "Tab Widget ",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "High"
            },
            {
              "name": "Table Widget",
              "status": false,
              "asignee": "Chandan",
              "complexity": "Critical"
            },
            {
              "name": "Templates",
              "status": true,
              "asignee": "Richa",
              "complexity": "Critical"
            },
            {
              "name": "Text Widget",
              "status": false,
              "asignee": "Chandan",
              "complexity": "High"
            },
            {
              "name": "Theming",
              "status": true,
              "asignee": "Richa",
              "complexity": "High"
            },
            {
              "name": "Tree Select widget",
              "status": true,
              "asignee": "Shadab",
              "complexity": "Medium"
            },
            {
              "name": "UX/UI Issues",
              "status": false,
              "asignee": "Kamakshi",
              "complexity": "High"
            },
            {
              "name": "Upgrade Testing - FE/NDX/Git",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Critical"
            },
            {
              "name": "Upgrade Testing - Platform/Integration",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Critical"
            },
            {
              "name": "Upgrade Testing - SSO",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Critical"
            },
            {
              "name": "Upgrade Testing - UI/AppViewers/Mobile/Design",
              "status": false,
              "asignee": "Kamakshi",
              "complexity": "Critical"
            },
            {
              "name": "Video",
              "status": true,
              "asignee": "Anandi",
              "complexity": "Low"
            },
            {
              "name": "Vulnerability check",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Critical"
            },
            {
              "name": "iFrame Widget ",
              "status": false,
              "asignee": "Chandan",
              "complexity": "Medium"
            }
          ],
          "done": true,
          "release_id": 104,
          "commit_id": "7d2226eb24e08a2f721238e8414ec8dbdc3bdaf5",
          "notes": "<p>***IMP - GSheets needs to be completely tested once blocker is fixed.***</p>\n<p> </p>"
        },
        {
          "id": 82,
          "created_at": "2023-07-17T06:35:31.338154+00:00",
          "name": "Release",
          "date": "2023-07-17",
          "roster": [
            {
              "name": "API/cURL/Auth API ",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "High"
            },
            {
              "name": "Action Selector",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Critical"
            },
            {
              "name": "Airtable",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Medium"
            },
            {
              "name": "App Level Import",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Medium"
            },
            {
              "name": "App Sharing",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Medium"
            },
            {
              "name": "App level actions [Forking App with pages, widgets + datasources + JS objects/Sharing App /Duplicate App]",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Critical"
            },
            {
              "name": "ArangoDB",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Low"
            },
            {
              "name": "Audio",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Low"
            },
            {
              "name": "Audio Recorder widget",
              "status": true,
              "asignee": "Kamakshi",
              "complexity": "Low"
            },
            {
              "name": "Button",
              "status": true,
              "asignee": "Laveena",
              "complexity": "High"
            },
            {
              "name": "Button Group Widget",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Medium"
            },
            {
              "name": "Camera",
              "status": true,
              "asignee": "Kavita",
              "complexity": "Low"
            },
            {
              "name": "Category Slider",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Low"
            },
            {
              "name": "Chart",
              "status": true,
              "asignee": "Laveena",
              "complexity": "High"
            },
            {
              "name": "Checkbox Group",
              "status": true,
              "asignee": "Harsha",
              "complexity": "Low"
            },
            {
              "name": "Code Scanner",
              "status": true,
              "asignee": "Kavita",
              "complexity": "Low"
            },
            {
              "name": "Container",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Critical"
            },
            {
              "name": "Currency Input",
              "status": false,
              "asignee": "Kamakshi",
              "complexity": "Low"
            },
            {
              "name": "Custom libraries",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Critical"
            },
            {
              "name": "Date Picker",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Medium"
            },
            {
              "name": "Divider widget",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Low"
            },
            {
              "name": "Document Viewer",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Low"
            },
            {
              "name": "Enterprise B and U ",
              "status": true,
              "asignee": "Harsha",
              "complexity": "Critical"
            },
            {
              "name": "FilePicker",
              "status": true,
              "asignee": "Kamakshi",
              "complexity": "Medium"
            },
            {
              "name": "Firestore DS",
              "status": true,
              "asignee": "Harsha",
              "complexity": "Medium"
            },
            {
              "name": "Forking an application - All DS",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Critical"
            },
            {
              "name": "Form",
              "status": true,
              "asignee": "Kamakshi",
              "complexity": "High"
            },
            {
              "name": "Framework Functions",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Critical"
            },
            {
              "name": "GSheets Automation",
              "status": true,
              "asignee": "Saroj",
              "complexity": "High"
            },
            {
              "name": "Git + Git import",
              "status": true,
              "asignee": "Parthvi",
              "complexity": "Critical"
            },
            {
              "name": "GoogleSheets",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Critical"
            },
            {
              "name": "GraphQL",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Medium"
            },
            {
              "name": "Home page",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Medium"
            },
            {
              "name": "HubSpot",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Low"
            },
            {
              "name": "Icon widget",
              "status": true,
              "asignee": "Kavita",
              "complexity": "Medium"
            },
            {
              "name": "Image Widget",
              "status": true,
              "asignee": "Kavita",
              "complexity": "High"
            },
            {
              "name": "Import/Export App level",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Medium"
            },
            {
              "name": "In-built libraries",
              "status": true,
              "asignee": "Saptami",
              "complexity": "High"
            },
            {
              "name": "Input",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Critical"
            },
            {
              "name": "Install testing",
              "status": true,
              "asignee": "Saroj",
              "complexity": "Critical"
            },
            {
              "name": "JS Objects",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Critical"
            },
            {
              "name": "JSON Form",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Medium"
            },
            {
              "name": "Javascript",
              "status": true,
              "asignee": "Saptami",
              "complexity": "High"
            },
            {
              "name": "List",
              "status": false,
              "asignee": "Kamakshi",
              "complexity": "Critical"
            },
            {
              "name": "Map",
              "status": true,
              "asignee": "Kamakshi",
              "complexity": "Low"
            },
            {
              "name": "Map Chart",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Low"
            },
            {
              "name": "Menu Widget",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Medium"
            },
            {
              "name": "Microsoft SQL",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Medium"
            },
            {
              "name": "Mobile Automation",
              "status": false,
              "asignee": "Vijetha",
              "complexity": "High"
            },
            {
              "name": "Modal",
              "status": true,
              "asignee": "Laveena",
              "complexity": "High"
            },
            {
              "name": "MongoDB",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Critical"
            },
            {
              "name": "Multi Select widget",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Low"
            },
            {
              "name": "Multi Tree Select widget",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Medium"
            },
            {
              "name": "MySQL",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Critical"
            },
            {
              "name": "Number  Slider",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Low"
            },
            {
              "name": "OAuth with Dropbox/Calendly",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Medium"
            },
            {
              "name": "Older Apps Testing",
              "status": false,
              "asignee": "All",
              "complexity": "High"
            },
            {
              "name": "Omnibar Navigation",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Critical"
            },
            {
              "name": "Oracle",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "High"
            },
            {
              "name": "Page Setting ",
              "status": true,
              "asignee": "Kavita",
              "complexity": "High"
            },
            {
              "name": "Page level actions",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Critical"
            },
            {
              "name": "Phone Input",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Low"
            },
            {
              "name": "Progress",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Low"
            },
            {
              "name": "Radio",
              "status": true,
              "asignee": "Kavita",
              "complexity": "Low"
            },
            {
              "name": "Range Slider",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Low"
            },
            {
              "name": "Rating Widget",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Low"
            },
            {
              "name": "Reflow",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "High"
            },
            {
              "name": "Rich Text Editor Widge",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Medium"
            },
            {
              "name": "S3",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Medium"
            },
            {
              "name": "SMTP",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Medium"
            },
            {
              "name": "SSO (CE+EE)",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Critical"
            },
            {
              "name": "SSO with other Deployment Scenarios",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Critical"
            },
            {
              "name": "Select widget",
              "status": true,
              "asignee": "Kamakshi",
              "complexity": "High"
            },
            {
              "name": "Self Serv B and U",
              "status": true,
              "asignee": "Harsha",
              "complexity": "High"
            },
            {
              "name": "Signup/Signin",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Critical"
            },
            {
              "name": "Snowflake",
              "status": true,
              "asignee": "Harsha",
              "complexity": "Low"
            },
            {
              "name": "Stat box",
              "status": true,
              "asignee": "Kavita",
              "complexity": "Medium"
            },
            {
              "name": "Switch",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Low"
            },
            {
              "name": "Switch group ",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Low"
            },
            {
              "name": "Tab Widget ",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "High"
            },
            {
              "name": "Table Widget",
              "status": false,
              "asignee": "Kamakshi",
              "complexity": "Critical"
            },
            {
              "name": "Templates",
              "status": true,
              "asignee": "Kavita",
              "complexity": "Critical"
            },
            {
              "name": "Text Widget",
              "status": true,
              "asignee": "Kamakshi",
              "complexity": "High"
            },
            {
              "name": "Theming",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "High"
            },
            {
              "name": "Tree Select widget",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Medium"
            },
            {
              "name": "UX/UI Issues",
              "status": false,
              "asignee": "Kamakshi",
              "complexity": "High"
            },
            {
              "name": "Upgrade Testing - FE/NDX/Git",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Critical"
            },
            {
              "name": "Upgrade Testing - Platform/Integration",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Critical"
            },
            {
              "name": "Upgrade Testing - SSO",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Critical"
            },
            {
              "name": "Upgrade Testing - UI/AppViewers/Mobile/Design",
              "status": false,
              "asignee": "Kamakshi",
              "complexity": "Critical"
            },
            {
              "name": "Video",
              "status": true,
              "asignee": "Kavita",
              "complexity": "Low"
            },
            {
              "name": "Vulnerability check",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Critical"
            },
            {
              "name": "iFrame Widget ",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Medium"
            }
          ],
          "done": true,
          "release_id": 132,
          "commit_id": "83f957e22897ecb756b4957ceceab35043183f17",
          "notes": ""
        },
        {
          "id": 51,
          "created_at": "2022-12-12T05:58:59.994009+00:00",
          "name": "Release",
          "date": "2022-12-12",
          "roster": [
            {
              "name": "API/cURL/Auth API ",
              "status": true,
              "asignee": "Prapulla"
            },
            {
              "name": "Airtable",
              "status": true,
              "asignee": "Prapulla"
            },
            {
              "name": "Audio",
              "status": true,
              "asignee": "Sripriya"
            },
            {
              "name": "Audio Recorder widget",
              "status": true,
              "asignee": "Shadab"
            },
            {
              "name": "Button Group Widget",
              "status": true,
              "asignee": "Shadab"
            },
            {
              "name": "Camera",
              "status": true,
              "asignee": "Chandan"
            },
            {
              "name": "Checkbox Group",
              "status": true,
              "asignee": "Chandan"
            },
            {
              "name": "Code Scanner",
              "status": true,
              "asignee": "Laveena"
            },
            {
              "name": "Currency Input",
              "status": true,
              "asignee": "Saptami"
            },
            {
              "name": "Divider widget",
              "status": true,
              "asignee": "Richa"
            },
            {
              "name": "Document Viewer",
              "status": true,
              "asignee": "Saptami"
            },
            {
              "name": "Editor",
              "status": true,
              "asignee": "Saptami"
            },
            {
              "name": "FilePicker",
              "status": true,
              "asignee": "Kamakshi"
            },
            {
              "name": "Git + Git import",
              "status": true,
              "asignee": "Prapulla"
            },
            {
              "name": "GoogleSheets",
              "status": true,
              "asignee": "Prapulla"
            },
            {
              "name": "GraphQL",
              "status": true,
              "asignee": "Prapulla"
            },
            {
              "name": "Homepage Profile [Forking App with pages, widgets and datasources/Sharing App /Duplicate App]",
              "status": true,
              "asignee": "Sripriya"
            },
            {
              "name": "HubSpot",
              "status": true,
              "asignee": "Prapulla"
            },
            {
              "name": "Icon widget",
              "status": true,
              "asignee": "Richa"
            },
            {
              "name": "Image Widget",
              "status": true,
              "asignee": "Laveena"
            },
            {
              "name": "Input",
              "status": true,
              "asignee": "Shwetha"
            },
            {
              "name": "JSON Form",
              "status": true,
              "asignee": "Laveena"
            },
            {
              "name": "List",
              "status": true,
              "asignee": "Shadab"
            },
            {
              "name": "Menu Widget",
              "status": true,
              "asignee": "Anandi"
            },
            {
              "name": "MongoDB",
              "status": true,
              "asignee": "Prapulla"
            },
            {
              "name": "Multi Select widget",
              "status": true,
              "asignee": "Shadab"
            },
            {
              "name": "Multi Tree Select widget",
              "status": true,
              "asignee": "Sripriya"
            },
            {
              "name": "MySQL",
              "status": true,
              "asignee": "Aparna"
            },
            {
              "name": "Older Apps Testing",
              "status": true,
              "asignee": "All"
            },
            {
              "name": "Omnibar Navigation",
              "status": true,
              "asignee": "Kamakshi"
            },
            {
              "name": "Page Setting ",
              "status": true,
              "asignee": "Anandi"
            },
            {
              "name": "Phone Input",
              "status": true,
              "asignee": "Richa"
            },
            {
              "name": "PostgreSQL",
              "status": true,
              "asignee": "Prapulla"
            },
            {
              "name": "Progress",
              "status": true,
              "asignee": "Richa"
            },
            {
              "name": "Rating Widget",
              "status": true,
              "asignee": "Shadab"
            },
            {
              "name": "Reflow",
              "status": true,
              "asignee": "Laveena"
            },
            {
              "name": "Rich Text Editor Widget",
              "status": true,
              "asignee": "Chandan"
            },
            {
              "name": "S3",
              "status": true,
              "asignee": "Aparna"
            },
            {
              "name": "SMTP",
              "status": true,
              "asignee": "Yatin"
            },
            {
              "name": "SSO (CE+EE)",
              "status": true,
              "asignee": "Yatin"
            },
            {
              "name": "Select widget",
              "status": true,
              "asignee": "Kamakshi"
            },
            {
              "name": "Signup/Signin",
              "status": true,
              "asignee": "Anandi"
            },
            {
              "name": "Slider",
              "status": true,
              "asignee": "Sripriya"
            },
            {
              "name": "Stat box",
              "status": true,
              "asignee": "Laveena"
            },
            {
              "name": "Switch group ",
              "status": true,
              "asignee": "Kamakshi"
            },
            {
              "name": "Tab Widget ",
              "status": true,
              "asignee": "Kamakshi"
            },
            {
              "name": "Table Widget",
              "status": true,
              "asignee": "Chandan"
            },
            {
              "name": "Templates",
              "status": true,
              "asignee": "Richa"
            },
            {
              "name": "Text Widget",
              "status": true,
              "asignee": "Shwetha"
            },
            {
              "name": "Theming",
              "status": true,
              "asignee": "Anandi"
            },
            {
              "name": "Tree Select widget",
              "status": true,
              "asignee": "Anandi"
            },
            {
              "name": "Trigger fields",
              "status": true,
              "asignee": "Saptami"
            },
            {
              "name": "UX/UI Issues",
              "status": true,
              "asignee": "Saptami"
            },
            {
              "name": "iFrame Widget ",
              "status": true,
              "asignee": "Sripriya"
            }
          ],
          "done": true,
          "release_id": 74,
          "commit_id": "236214f18282281e9cd5a31edbc4b151e189427e",
          "notes": ""
        },
        {
          "id": 48,
          "created_at": "2022-11-28T12:44:56.762033+00:00",
          "name": "Release",
          "date": "2022-11-28",
          "roster": [
            {
              "name": "API/cURL/Auth API ",
              "status": false,
              "asignee": "Prapulla"
            },
            {
              "name": "Airtable",
              "status": false,
              "asignee": "Prapulla"
            },
            {
              "name": "Audio",
              "status": true,
              "asignee": "Sripriya"
            },
            {
              "name": "Audio Recorder widget",
              "status": true,
              "asignee": "Shadab"
            },
            {
              "name": "Button Group Widget",
              "status": true,
              "asignee": "Shadab"
            },
            {
              "name": "Camera",
              "status": true,
              "asignee": "Chandan"
            },
            {
              "name": "Checkbox Group",
              "status": true,
              "asignee": "Aparna"
            },
            {
              "name": "Code Scanner",
              "status": true,
              "asignee": "Laveena"
            },
            {
              "name": "Currency Input",
              "status": true,
              "asignee": "Laveena"
            },
            {
              "name": "Divider widget",
              "status": true,
              "asignee": "Richa"
            },
            {
              "name": "Document Viewer",
              "status": true,
              "asignee": "Aparna"
            },
            {
              "name": "Editor",
              "status": true,
              "asignee": "Anandi"
            },
            {
              "name": "FilePicker",
              "status": true,
              "asignee": "Kamakshi"
            },
            {
              "name": "Git + Git import",
              "status": true,
              "asignee": "Raksha"
            },
            {
              "name": "GoogleSheets",
              "status": false,
              "asignee": "Prapulla"
            },
            {
              "name": "GraphQL",
              "status": false,
              "asignee": "Prapulla"
            },
            {
              "name": "Homepage Profile [Forking App with pages, widgets and datasources/Sharing App /Duplicate App]",
              "status": true,
              "asignee": "Sripriya"
            },
            {
              "name": "HubSpot",
              "status": false,
              "asignee": "Prapulla"
            },
            {
              "name": "Icon widget",
              "status": true,
              "asignee": "Richa"
            },
            {
              "name": "Image Widget",
              "status": true,
              "asignee": "Laveena"
            },
            {
              "name": "Input",
              "status": true,
              "asignee": "Laveena"
            },
            {
              "name": "JSON Form",
              "status": true,
              "asignee": "Chandan"
            },
            {
              "name": "List",
              "status": true,
              "asignee": "Shadab"
            },
            {
              "name": "Menu Widget",
              "status": true,
              "asignee": "Anandi"
            },
            {
              "name": "MongoDB",
              "status": false,
              "asignee": "Prapulla"
            },
            {
              "name": "Multi Select widget",
              "status": true,
              "asignee": "Shadab"
            },
            {
              "name": "Multi Tree Select widget",
              "status": true,
              "asignee": "Sripriya"
            },
            {
              "name": "MySQL",
              "status": true,
              "asignee": "Raksha"
            },
            {
              "name": "Older Apps Testing",
              "status": false,
              "asignee": "All"
            },
            {
              "name": "Omnibar Navigation",
              "status": true,
              "asignee": "Kamakshi"
            },
            {
              "name": "Page Setting ",
              "status": true,
              "asignee": "Anandi"
            },
            {
              "name": "Phone Input",
              "status": true,
              "asignee": "Richa"
            },
            {
              "name": "PostgreSQL",
              "status": false,
              "asignee": "Prapulla"
            },
            {
              "name": "Progress",
              "status": true,
              "asignee": "Laveena"
            },
            {
              "name": "Rating Widget",
              "status": true,
              "asignee": "Shadab"
            },
            {
              "name": "Reflow",
              "status": true,
              "asignee": "Richa"
            },
            {
              "name": "Rich Text Editor Widget",
              "status": true,
              "asignee": "Chandan"
            },
            {
              "name": "S3",
              "status": true,
              "asignee": "Raksha"
            },
            {
              "name": "SMTP",
              "status": true,
              "asignee": "Raksha"
            },
            {
              "name": "SSO (CE+EE)",
              "status": true,
              "asignee": "Raksha"
            },
            {
              "name": "Select widget",
              "status": true,
              "asignee": "Kamakshi"
            },
            {
              "name": "Signup/Signin",
              "status": true,
              "asignee": "Anandi"
            },
            {
              "name": "Slider",
              "status": true,
              "asignee": "Sripriya"
            },
            {
              "name": "Stat box",
              "status": true,
              "asignee": "Aparna"
            },
            {
              "name": "Switch group ",
              "status": true,
              "asignee": "Kamakshi"
            },
            {
              "name": "Tab Widget ",
              "status": true,
              "asignee": "Aparna"
            },
            {
              "name": "Table Widget",
              "status": true,
              "asignee": "Chandan"
            },
            {
              "name": "Templates",
              "status": true,
              "asignee": "Richa"
            },
            {
              "name": "Text Widget",
              "status": true,
              "asignee": "Aparna"
            },
            {
              "name": "Theming",
              "status": true,
              "asignee": "Anandi"
            },
            {
              "name": "Tree Select widget",
              "status": true,
              "asignee": "Anandi"
            },
            {
              "name": "Trigger fields",
              "status": true,
              "asignee": "Richa"
            },
            {
              "name": "UX/UI Issues",
              "status": true,
              "asignee": "Laveena"
            },
            {
              "name": "iFrame Widget ",
              "status": true,
              "asignee": "Sripriya"
            }
          ],
          "done": true,
          "release_id": 72,
          "commit_id": "ad55928fc331fece22e5f80a0cec3f63e0678233",
          "notes": ""
        },
        {
          "id": 50,
          "created_at": "2022-12-05T05:05:33.194601+00:00",
          "name": "Release",
          "date": "2022-12-05",
          "roster": [
            {
              "name": "API/cURL/Auth API ",
              "status": true,
              "asignee": "Prapulla"
            },
            {
              "name": "Airtable",
              "status": true,
              "asignee": "Prapulla"
            },
            {
              "name": "Audio",
              "status": true,
              "asignee": "Sripriya"
            },
            {
              "name": "Audio Recorder widget",
              "status": true,
              "asignee": "Shadab"
            },
            {
              "name": "Button Group Widget",
              "status": true,
              "asignee": "Shadab"
            },
            {
              "name": "Camera",
              "status": true,
              "asignee": "Sripriya"
            },
            {
              "name": "Checkbox Group",
              "status": true,
              "asignee": "Aparna"
            },
            {
              "name": "Code Scanner",
              "status": true,
              "asignee": "Laveena"
            },
            {
              "name": "Currency Input",
              "status": true,
              "asignee": "Saptami"
            },
            {
              "name": "Divider widget",
              "status": true,
              "asignee": "Richa"
            },
            {
              "name": "Document Viewer",
              "status": true,
              "asignee": "Aparna"
            },
            {
              "name": "Editor",
              "status": true,
              "asignee": "Saptami"
            },
            {
              "name": "FilePicker",
              "status": true,
              "asignee": "Kamakshi"
            },
            {
              "name": "Git + Git import",
              "status": true,
              "asignee": "Raksha"
            },
            {
              "name": "GoogleSheets",
              "status": true,
              "asignee": "Prapulla"
            },
            {
              "name": "GraphQL",
              "status": true,
              "asignee": "Prapulla"
            },
            {
              "name": "Homepage Profile [Forking App with pages, widgets and datasources/Sharing App /Duplicate App]",
              "status": true,
              "asignee": "Sripriya/Aparna"
            },
            {
              "name": "HubSpot",
              "status": true,
              "asignee": "Prapulla"
            },
            {
              "name": "Icon widget",
              "status": true,
              "asignee": "Richa"
            },
            {
              "name": "Image Widget",
              "status": true,
              "asignee": "Laveena"
            },
            {
              "name": "Input",
              "status": true,
              "asignee": "Laveena"
            },
            {
              "name": "JSON Form",
              "status": true,
              "asignee": "Chandan"
            },
            {
              "name": "List",
              "status": true,
              "asignee": "Shadab"
            },
            {
              "name": "Menu Widget",
              "status": true,
              "asignee": "Anandi"
            },
            {
              "name": "MongoDB",
              "status": true,
              "asignee": "Prapulla"
            },
            {
              "name": "Multi Select widget",
              "status": true,
              "asignee": "Shadab"
            },
            {
              "name": "Multi Tree Select widget",
              "status": true,
              "asignee": "Sripriya"
            },
            {
              "name": "MySQL",
              "status": true,
              "asignee": "Raksha"
            },
            {
              "name": "Older Apps Testing",
              "status": true,
              "asignee": "All"
            },
            {
              "name": "Omnibar Navigation",
              "status": true,
              "asignee": "Kamakshi"
            },
            {
              "name": "Page Setting ",
              "status": true,
              "asignee": "Anandi"
            },
            {
              "name": "Phone Input",
              "status": true,
              "asignee": "Richa"
            },
            {
              "name": "PostgreSQL",
              "status": true,
              "asignee": "Prapulla"
            },
            {
              "name": "Progress",
              "status": true,
              "asignee": "Richa"
            },
            {
              "name": "Rating Widget",
              "status": true,
              "asignee": "Shadab"
            },
            {
              "name": "Reflow",
              "status": true,
              "asignee": "Richa"
            },
            {
              "name": "Rich Text Editor Widget",
              "status": true,
              "asignee": "Chandan"
            },
            {
              "name": "S3",
              "status": true,
              "asignee": "Raksha"
            },
            {
              "name": "SMTP",
              "status": true,
              "asignee": "Raksha"
            },
            {
              "name": "SSO (CE+EE)",
              "status": true,
              "asignee": "Raksha"
            },
            {
              "name": "Select widget",
              "status": true,
              "asignee": "Kamakshi"
            },
            {
              "name": "Signup/Signin",
              "status": true,
              "asignee": "Anandi"
            },
            {
              "name": "Slider",
              "status": true,
              "asignee": "Sripriya"
            },
            {
              "name": "Stat box",
              "status": true,
              "asignee": "Aparna"
            },
            {
              "name": "Switch group ",
              "status": true,
              "asignee": "Chandan"
            },
            {
              "name": "Tab Widget ",
              "status": true,
              "asignee": "Aparna"
            },
            {
              "name": "Table Widget",
              "status": true,
              "asignee": "Chandan"
            },
            {
              "name": "Templates",
              "status": true,
              "asignee": "Richa"
            },
            {
              "name": "Text Widget",
              "status": true,
              "asignee": "Aparna"
            },
            {
              "name": "Theming",
              "status": true,
              "asignee": "Anandi"
            },
            {
              "name": "Tree Select widget",
              "status": true,
              "asignee": "Anandi"
            },
            {
              "name": "Trigger fields",
              "status": true,
              "asignee": "Saptami"
            },
            {
              "name": "UX/UI Issues",
              "status": true,
              "asignee": "Saptami"
            },
            {
              "name": "iFrame Widget ",
              "status": true,
              "asignee": "Sripriya"
            }
          ],
          "done": true,
          "release_id": 73,
          "commit_id": "ad55928fc331fece22e5f80a0cec3f63e0678233",
          "notes": ""
        },
        {
          "id": 52,
          "created_at": "2022-12-21T06:48:06.19145+00:00",
          "name": "Release",
          "date": "2022-12-21",
          "roster": [
            {
              "name": "API/cURL/Auth API ",
              "status": true,
              "asignee": "Prapulla"
            },
            {
              "name": "Airtable",
              "status": true,
              "asignee": "Prapulla"
            },
            {
              "name": "Audio",
              "status": false,
              "asignee": "Raksha"
            },
            {
              "name": "Audio Recorder widget",
              "status": true,
              "asignee": "Shadab"
            },
            {
              "name": "Button Group Widget",
              "status": true,
              "asignee": "Shadab"
            },
            {
              "name": "Camera",
              "status": true,
              "asignee": "Aparna"
            },
            {
              "name": "Checkbox Group",
              "status": false,
              "asignee": "Raksha"
            },
            {
              "name": "Code Scanner",
              "status": false,
              "asignee": "Richa"
            },
            {
              "name": "Currency Input",
              "status": true,
              "asignee": "Aparna"
            },
            {
              "name": "Divider widget",
              "status": true,
              "asignee": "Richa"
            },
            {
              "name": "Document Viewer",
              "status": true,
              "asignee": "Richa"
            },
            {
              "name": "Editor",
              "status": false,
              "asignee": "Saptami"
            },
            {
              "name": "FilePicker",
              "status": true,
              "asignee": "Kamakshi"
            },
            {
              "name": "Git + Git import",
              "status": false,
              "asignee": "Parthvi"
            },
            {
              "name": "GoogleSheets",
              "status": true,
              "asignee": "Prapulla"
            },
            {
              "name": "GraphQL",
              "status": true,
              "asignee": "Prapulla"
            },
            {
              "name": "Homepage Profile [Forking App with pages, widgets and datasources/Sharing App /Duplicate App]",
              "status": false,
              "asignee": "Parthvi"
            },
            {
              "name": "HubSpot",
              "status": true,
              "asignee": "Prapulla"
            },
            {
              "name": "Icon widget",
              "status": false,
              "asignee": "Richa"
            },
            {
              "name": "Image Widget",
              "status": true,
              "asignee": "Aparna"
            },
            {
              "name": "Input",
              "status": true,
              "asignee": "Aparna"
            },
            {
              "name": "JSON Form",
              "status": true,
              "asignee": "Laveena"
            },
            {
              "name": "List",
              "status": true,
              "asignee": "Shadab"
            },
            {
              "name": "Menu Widget",
              "status": true,
              "asignee": "Anandi"
            },
            {
              "name": "MongoDB",
              "status": true,
              "asignee": "Prapulla"
            },
            {
              "name": "Multi Select widget",
              "status": true,
              "asignee": "Shadab"
            },
            {
              "name": "Multi Tree Select widget",
              "status": false,
              "asignee": "Shwetha"
            },
            {
              "name": "MySQL",
              "status": true,
              "asignee": "Aparna"
            },
            {
              "name": "Older Apps Testing",
              "status": false,
              "asignee": "All"
            },
            {
              "name": "Omnibar Navigation",
              "status": false,
              "asignee": "Parthvi"
            },
            {
              "name": "Page Setting ",
              "status": false,
              "asignee": "Parthvi"
            },
            {
              "name": "Phone Input",
              "status": true,
              "asignee": "Richa"
            },
            {
              "name": "PostgreSQL",
              "status": true,
              "asignee": "Prapulla"
            },
            {
              "name": "Progress",
              "status": true,
              "asignee": "Richa"
            },
            {
              "name": "Rating Widget",
              "status": true,
              "asignee": "Shadab"
            },
            {
              "name": "Reflow",
              "status": true,
              "asignee": "Laveena"
            },
            {
              "name": "Rich Text Editor Widge",
              "status": false,
              "asignee": "Shwetha"
            },
            {
              "name": "S3",
              "status": false,
              "asignee": "Raksha"
            },
            {
              "name": "SMTP",
              "status": false,
              "asignee": "Raksha"
            },
            {
              "name": "SSO (CE+EE)",
              "status": false,
              "asignee": "Raksha"
            },
            {
              "name": "Select widget",
              "status": false,
              "asignee": "Aparna"
            },
            {
              "name": "Signup/Signin",
              "status": false,
              "asignee": "Raksha"
            },
            {
              "name": "Slider",
              "status": false,
              "asignee": "Shwetha"
            },
            {
              "name": "Stat box",
              "status": false,
              "asignee": "Shwetha"
            },
            {
              "name": "Switch group ",
              "status": true,
              "asignee": "Kamakshi"
            },
            {
              "name": "Tab Widget ",
              "status": true,
              "asignee": "Kamakshi"
            },
            {
              "name": "Table Widget",
              "status": true,
              "asignee": "Laveena"
            },
            {
              "name": "Templates",
              "status": false,
              "asignee": "Parthvi"
            },
            {
              "name": "Text Widget",
              "status": true,
              "asignee": "Aparna"
            },
            {
              "name": "Theming",
              "status": true,
              "asignee": "Anandi"
            },
            {
              "name": "Tree Select widget",
              "status": true,
              "asignee": "Anandi"
            },
            {
              "name": "Trigger fields",
              "status": false,
              "asignee": "Saptami"
            },
            {
              "name": "UX/UI Issues",
              "status": false,
              "asignee": "Saptami"
            },
            {
              "name": "iFrame Widget ",
              "status": false,
              "asignee": "Shwetha"
            }
          ],
          "done": true,
          "release_id": null,
          "commit_id": "1de045d9d841299587b091f3947e4023c3af36ad",
          "notes": ""
        },
        {
          "id": 53,
          "created_at": "2022-12-26T05:11:27.620613+00:00",
          "name": "Release",
          "date": "2022-12-26",
          "roster": [
            {
              "name": "API/cURL/Auth API ",
              "status": false,
              "asignee": "Prapulla"
            },
            {
              "name": "Airtable",
              "status": false,
              "asignee": "Prapulla"
            },
            {
              "name": "Audio",
              "status": false,
              "asignee": "Anand"
            },
            {
              "name": "Audio Recorder widget",
              "status": false,
              "asignee": "Anand"
            },
            {
              "name": "Button Group Widget",
              "status": false,
              "asignee": "Shadab"
            },
            {
              "name": "Camera",
              "status": false,
              "asignee": "Anand"
            },
            {
              "name": "Checkbox Group",
              "status": false,
              "asignee": "Raksha"
            },
            {
              "name": "Code Scanner",
              "status": false,
              "asignee": "Kamakshi"
            },
            {
              "name": "Currency Input",
              "status": false,
              "asignee": "Kamakshi"
            },
            {
              "name": "Divider widget",
              "status": false,
              "asignee": "Anand"
            },
            {
              "name": "Document Viewer",
              "status": false,
              "asignee": "Chandan"
            },
            {
              "name": "Editor",
              "status": false,
              "asignee": "Saptami"
            },
            {
              "name": "FilePicker",
              "status": false,
              "asignee": "Kamakshi"
            },
            {
              "name": "Git + Git import",
              "status": false,
              "asignee": "Parthvi"
            },
            {
              "name": "GoogleSheets",
              "status": false,
              "asignee": "Prapulla"
            },
            {
              "name": "GraphQL",
              "status": false,
              "asignee": "Prapulla"
            },
            {
              "name": "Homepage Profile [Forking App with pages, widgets and datasources/Sharing App /Duplicate App]",
              "status": false,
              "asignee": "Parthvi"
            },
            {
              "name": "HubSpot",
              "status": false,
              "asignee": "Prapulla"
            },
            {
              "name": "Icon widget",
              "status": false,
              "asignee": "Anand"
            },
            {
              "name": "Image Widget",
              "status": false,
              "asignee": "Chandan"
            },
            {
              "name": "Input",
              "status": false,
              "asignee": "Kamakshi"
            },
            {
              "name": "JSON Form",
              "status": false,
              "asignee": "Shadab"
            },
            {
              "name": "List",
              "status": false,
              "asignee": "Shadab"
            },
            {
              "name": "Menu Widget",
              "status": false,
              "asignee": "Anandi"
            },
            {
              "name": "MongoDB",
              "status": false,
              "asignee": "Prapulla"
            },
            {
              "name": "Multi Select widget",
              "status": false,
              "asignee": "Shadab"
            },
            {
              "name": "Multi Tree Select widget",
              "status": false,
              "asignee": "Shwetha"
            },
            {
              "name": "MySQL",
              "status": false,
              "asignee": "Raksha"
            },
            {
              "name": "Older Apps Testing",
              "status": false,
              "asignee": "All"
            },
            {
              "name": "Omnibar Navigation",
              "status": false,
              "asignee": "Parthvi"
            },
            {
              "name": "Page Setting ",
              "status": false,
              "asignee": "Shadab"
            },
            {
              "name": "Phone Input",
              "status": false,
              "asignee": "Shwetha"
            },
            {
              "name": "PostgreSQL",
              "status": false,
              "asignee": "Prapulla"
            },
            {
              "name": "Progress",
              "status": false,
              "asignee": "Anand"
            },
            {
              "name": "Rating Widget",
              "status": false,
              "asignee": "Shwetha"
            },
            {
              "name": "Reflow",
              "status": false,
              "asignee": "Shadab"
            },
            {
              "name": "Rich Text Editor Widge",
              "status": false,
              "asignee": "Shwetha"
            },
            {
              "name": "S3",
              "status": false,
              "asignee": "Raksha"
            },
            {
              "name": "SMTP",
              "status": false,
              "asignee": "Raksha"
            },
            {
              "name": "SSO (CE+EE)",
              "status": false,
              "asignee": "Raksha"
            },
            {
              "name": "Select widget",
              "status": false,
              "asignee": "Chandan"
            },
            {
              "name": "Signup/Signin",
              "status": false,
              "asignee": "Raksha"
            },
            {
              "name": "Slider",
              "status": false,
              "asignee": "Shwetha"
            },
            {
              "name": "Stat box",
              "status": false,
              "asignee": "Shwetha"
            },
            {
              "name": "Switch group ",
              "status": false,
              "asignee": "Shadab"
            },
            {
              "name": "Tab Widget ",
              "status": false,
              "asignee": "Kamakshi"
            },
            {
              "name": "Table Widget",
              "status": false,
              "asignee": "Kamakshi"
            },
            {
              "name": "Templates",
              "status": false,
              "asignee": "Parthvi"
            },
            {
              "name": "Text Widget",
              "status": false,
              "asignee": "Shwetha"
            },
            {
              "name": "Theming",
              "status": false,
              "asignee": "Saptami"
            },
            {
              "name": "Tree Select widget",
              "status": false,
              "asignee": "Anandi"
            },
            {
              "name": "Trigger fields",
              "status": false,
              "asignee": "Saptami"
            },
            {
              "name": "UX/UI Issues",
              "status": false,
              "asignee": "Saptami"
            },
            {
              "name": "iFrame Widget ",
              "status": false,
              "asignee": "Shwetha"
            }
          ],
          "done": false,
          "release_id": null,
          "commit_id": "2b1c27de04175d98a1758526b8b118a9ee81985a",
          "notes": ""
        },
        {
          "id": 58,
          "created_at": "2023-01-30T07:08:04.55344+00:00",
          "name": "Release",
          "date": "2023-01-30",
          "roster": [
            {
              "name": "API/cURL/Auth API ",
              "status": true,
              "asignee": "Prapulla"
            },
            {
              "name": "Airtable",
              "status": false,
              "asignee": "Prapulla"
            },
            {
              "name": "ArangoDB",
              "status": true,
              "asignee": "Anand"
            },
            {
              "name": "Audio",
              "status": true,
              "asignee": "Anandi"
            },
            {
              "name": "Audio Recorder widget",
              "status": true,
              "asignee": "Richa"
            },
            {
              "name": "Button Group Widget",
              "status": true,
              "asignee": "Shadab"
            },
            {
              "name": "Camera",
              "status": true,
              "asignee": "Kamakshi"
            },
            {
              "name": "Checkbox Group",
              "status": true,
              "asignee": "Aparna"
            },
            {
              "name": "Code Scanner",
              "status": true,
              "asignee": "Kamakshi"
            },
            {
              "name": "Currency Input",
              "status": true,
              "asignee": "Chandan"
            },
            {
              "name": "Divider widget",
              "status": true,
              "asignee": "Laveena"
            },
            {
              "name": "Document Viewer",
              "status": false,
              "asignee": "Chandan"
            },
            {
              "name": "Editor",
              "status": true,
              "asignee": "Saptami"
            },
            {
              "name": "FilePicker",
              "status": true,
              "asignee": "Kamakshi"
            },
            {
              "name": "Firestore DS",
              "status": true,
              "asignee": "Anand"
            },
            {
              "name": "Git + Git import",
              "status": false,
              "asignee": "Raksha"
            },
            {
              "name": "GoogleSheets",
              "status": false,
              "asignee": "Raksha"
            },
            {
              "name": "GraphQL",
              "status": true,
              "asignee": "Prapulla"
            },
            {
              "name": "Homepage Profile [Forking App with pages, widgets and datasources/Sharing App /Duplicate App]",
              "status": false,
              "asignee": "Sripriya"
            },
            {
              "name": "HubSpot",
              "status": false,
              "asignee": "Prapulla"
            },
            {
              "name": "Icon widget",
              "status": true,
              "asignee": "Richa"
            },
            {
              "name": "Image Widget",
              "status": true,
              "asignee": "Richa"
            },
            {
              "name": "Input",
              "status": true,
              "asignee": "Laveena"
            },
            {
              "name": "JSON Form",
              "status": false,
              "asignee": "Chandan"
            },
            {
              "name": "List",
              "status": true,
              "asignee": "Shadab"
            },
            {
              "name": "Menu Widget",
              "status": true,
              "asignee": "Richa"
            },
            {
              "name": "MongoDB",
              "status": true,
              "asignee": "Anand"
            },
            {
              "name": "Multi Select widget",
              "status": true,
              "asignee": "Shadab"
            },
            {
              "name": "Multi Tree Select widget",
              "status": false,
              "asignee": "Sripriya"
            },
            {
              "name": "MySQL",
              "status": false,
              "asignee": "Raksha"
            },
            {
              "name": "OAuth with Dropbox",
              "status": true,
              "asignee": "Aparna"
            },
            {
              "name": "Older Apps Testing",
              "status": true,
              "asignee": "All"
            },
            {
              "name": "Omnibar Navigation",
              "status": true,
              "asignee": "Saptami"
            },
            {
              "name": "Page Setting ",
              "status": true,
              "asignee": "Anandi"
            },
            {
              "name": "Phone Input",
              "status": false,
              "asignee": "Shwetha"
            },
            {
              "name": "PostgreSQL",
              "status": true,
              "asignee": "Anand"
            },
            {
              "name": "Progress",
              "status": true,
              "asignee": "Laveena"
            },
            {
              "name": "Rating Widget",
              "status": false,
              "asignee": "Shwetha"
            },
            {
              "name": "Reflow",
              "status": true,
              "asignee": "Laveena"
            },
            {
              "name": "Rich Text Editor Widge",
              "status": false,
              "asignee": "Shwetha"
            },
            {
              "name": "S3",
              "status": true,
              "asignee": "Prapulla"
            },
            {
              "name": "SMTP",
              "status": false,
              "asignee": "Raksha"
            },
            {
              "name": "SSO (CE+EE)",
              "status": true,
              "asignee": "Aparna"
            },
            {
              "name": "Select widget",
              "status": false,
              "asignee": "Chandan"
            },
            {
              "name": "Signup/Signin",
              "status": false,
              "asignee": "Sripriya"
            },
            {
              "name": "Slider",
              "status": false,
              "asignee": "Sripriya"
            },
            {
              "name": "Snowflake",
              "status": true,
              "asignee": "Aparna"
            },
            {
              "name": "Stat box",
              "status": true,
              "asignee": "Shwetha"
            },
            {
              "name": "Switch group ",
              "status": true,
              "asignee": "Shadab"
            },
            {
              "name": "Tab Widget ",
              "status": true,
              "asignee": "Kamakshi"
            },
            {
              "name": "Table Widget",
              "status": false,
              "asignee": "Kamakshi"
            },
            {
              "name": "Templates",
              "status": true,
              "asignee": "Richa"
            },
            {
              "name": "Text Widget",
              "status": true,
              "asignee": "Anandi"
            },
            {
              "name": "Theming",
              "status": true,
              "asignee": "Anandi"
            },
            {
              "name": "Tree Select widget",
              "status": true,
              "asignee": "Anandi"
            },
            {
              "name": "Trigger fields",
              "status": true,
              "asignee": "Saptami"
            },
            {
              "name": "UX/UI Issues",
              "status": true,
              "asignee": "Saptami"
            },
            {
              "name": "Upgrade Testing - SSO",
              "status": false,
              "asignee": "Raksha"
            },
            {
              "name": "iFrame Widget ",
              "status": true,
              "asignee": "Laveena"
            }
          ],
          "done": true,
          "release_id": 86,
          "commit_id": "de0479096f931f31051f84ac1ba5eca761725d4d",
          "notes": "<p>1. Since <a href=\"https://github.com/appsmithorg/appsmith/issues/15253\">key</a> field is not visible on Saas Integrations, we were unable to conduct Regression in this area. </p>\n<p>2. Dev is currently looking at <a href=\"https://github.com/appsmithorg/appsmith/pull/20095\">this</a> PR. Though it has been merged, the changes are not reflected yet on Release, and this is a required PR that should go into this release.</p>\n<p> </p>"
        },
        {
          "id": 54,
          "created_at": "2022-12-26T05:16:23.382776+00:00",
          "name": "Release",
          "date": "2022-12-26",
          "roster": [
            {
              "name": "API/cURL/Auth API ",
              "status": true,
              "asignee": "Prapulla"
            },
            {
              "name": "Airtable",
              "status": true,
              "asignee": "Prapulla"
            },
            {
              "name": "Audio",
              "status": false,
              "asignee": "Anand"
            },
            {
              "name": "Audio Recorder widget",
              "status": false,
              "asignee": "Anand"
            },
            {
              "name": "Button Group Widget",
              "status": true,
              "asignee": "Shadab"
            },
            {
              "name": "Camera",
              "status": false,
              "asignee": "Anand"
            },
            {
              "name": "Checkbox Group",
              "status": true,
              "asignee": "Raksha"
            },
            {
              "name": "Code Scanner",
              "status": true,
              "asignee": "Kamakshi"
            },
            {
              "name": "Currency Input",
              "status": true,
              "asignee": "Kamakshi"
            },
            {
              "name": "Divider widget",
              "status": false,
              "asignee": "Anand"
            },
            {
              "name": "Document Viewer",
              "status": true,
              "asignee": "Chandan"
            },
            {
              "name": "Editor",
              "status": false,
              "asignee": "Saptami"
            },
            {
              "name": "FilePicker",
              "status": true,
              "asignee": "Kamakshi"
            },
            {
              "name": "Git + Git import",
              "status": true,
              "asignee": "Parthvi"
            },
            {
              "name": "GoogleSheets",
              "status": true,
              "asignee": "Prapulla"
            },
            {
              "name": "GraphQL",
              "status": true,
              "asignee": "Prapulla"
            },
            {
              "name": "Homepage Profile [Forking App with pages, widgets and datasources/Sharing App /Duplicate App]",
              "status": true,
              "asignee": "Parthvi"
            },
            {
              "name": "HubSpot",
              "status": true,
              "asignee": "Prapulla"
            },
            {
              "name": "Icon widget",
              "status": false,
              "asignee": "Anand"
            },
            {
              "name": "Image Widget",
              "status": true,
              "asignee": "Chandan"
            },
            {
              "name": "Input",
              "status": false,
              "asignee": "Kamakshi"
            },
            {
              "name": "JSON Form",
              "status": true,
              "asignee": "Shadab"
            },
            {
              "name": "List",
              "status": true,
              "asignee": "Shadab"
            },
            {
              "name": "Menu Widget",
              "status": false,
              "asignee": "Anandi"
            },
            {
              "name": "MongoDB",
              "status": true,
              "asignee": "Prapulla"
            },
            {
              "name": "Multi Select widget",
              "status": true,
              "asignee": "Shadab"
            },
            {
              "name": "Multi Tree Select widget",
              "status": false,
              "asignee": "Shwetha"
            },
            {
              "name": "MySQL",
              "status": true,
              "asignee": "Raksha"
            },
            {
              "name": "Older Apps Testing",
              "status": false,
              "asignee": "All"
            },
            {
              "name": "Omnibar Navigation",
              "status": true,
              "asignee": "Parthvi"
            },
            {
              "name": "Page Setting ",
              "status": true,
              "asignee": "Shadab"
            },
            {
              "name": "Phone Input",
              "status": false,
              "asignee": "Shwetha"
            },
            {
              "name": "PostgreSQL",
              "status": true,
              "asignee": "Prapulla"
            },
            {
              "name": "Progress",
              "status": false,
              "asignee": "Anand"
            },
            {
              "name": "Rating Widget",
              "status": false,
              "asignee": "Shwetha"
            },
            {
              "name": "Reflow",
              "status": true,
              "asignee": "Shadab"
            },
            {
              "name": "Rich Text Editor Widge",
              "status": false,
              "asignee": "Shwetha"
            },
            {
              "name": "S3",
              "status": true,
              "asignee": "Raksha"
            },
            {
              "name": "SMTP",
              "status": true,
              "asignee": "Raksha"
            },
            {
              "name": "SSO (CE+EE)",
              "status": false,
              "asignee": "Raksha"
            },
            {
              "name": "Select widget",
              "status": false,
              "asignee": "Chandan"
            },
            {
              "name": "Signup/Signin",
              "status": false,
              "asignee": "Raksha"
            },
            {
              "name": "Slider",
              "status": false,
              "asignee": "Shwetha"
            },
            {
              "name": "Stat box",
              "status": false,
              "asignee": "Shwetha"
            },
            {
              "name": "Switch group ",
              "status": true,
              "asignee": "Shadab"
            },
            {
              "name": "Tab Widget ",
              "status": true,
              "asignee": "Kamakshi"
            },
            {
              "name": "Table Widget",
              "status": true,
              "asignee": "Kamakshi"
            },
            {
              "name": "Templates",
              "status": true,
              "asignee": "Parthvi"
            },
            {
              "name": "Text Widget",
              "status": false,
              "asignee": "Shwetha"
            },
            {
              "name": "Theming",
              "status": false,
              "asignee": "Saptami"
            },
            {
              "name": "Tree Select widget",
              "status": false,
              "asignee": "Anandi"
            },
            {
              "name": "Trigger fields",
              "status": false,
              "asignee": "Saptami"
            },
            {
              "name": "UX/UI Issues",
              "status": false,
              "asignee": "Saptami"
            },
            {
              "name": "iFrame Widget ",
              "status": false,
              "asignee": "Shwetha"
            }
          ],
          "done": true,
          "release_id": 77,
          "commit_id": "db399c96c7d28e53505416cafc87668880a1878d",
          "notes": ""
        },
        {
          "id": 55,
          "created_at": "2023-01-04T05:19:29.824816+00:00",
          "name": "Release",
          "date": "2023-01-04",
          "roster": [
            {
              "name": "API/cURL/Auth API ",
              "status": true,
              "asignee": "Prapulla"
            },
            {
              "name": "Airtable",
              "status": true,
              "asignee": "Prapulla"
            },
            {
              "name": "Audio",
              "status": true,
              "asignee": "Saptami"
            },
            {
              "name": "Audio Recorder widget",
              "status": true,
              "asignee": "Richa"
            },
            {
              "name": "Button Group Widget",
              "status": true,
              "asignee": "Anandi"
            },
            {
              "name": "Camera",
              "status": true,
              "asignee": "Aparna"
            },
            {
              "name": "Checkbox Group",
              "status": false,
              "asignee": "Sripriya"
            },
            {
              "name": "Code Scanner",
              "status": true,
              "asignee": "Kamakshi"
            },
            {
              "name": "Currency Input",
              "status": true,
              "asignee": "Chandan"
            },
            {
              "name": "Divider widget",
              "status": true,
              "asignee": "Laveena"
            },
            {
              "name": "Document Viewer",
              "status": true,
              "asignee": "Chandan"
            },
            {
              "name": "Editor",
              "status": true,
              "asignee": "Saptami"
            },
            {
              "name": "FilePicker",
              "status": true,
              "asignee": "Kamakshi"
            },
            {
              "name": "Git + Git import",
              "status": true,
              "asignee": "Raksha"
            },
            {
              "name": "GoogleSheets",
              "status": true,
              "asignee": "Prapulla"
            },
            {
              "name": "GraphQL",
              "status": true,
              "asignee": "Prapulla"
            },
            {
              "name": "Homepage Profile [Forking App with pages, widgets and datasources/Sharing App /Duplicate App]",
              "status": true,
              "asignee": "Kamakshi"
            },
            {
              "name": "HubSpot",
              "status": false,
              "asignee": "Raksha"
            },
            {
              "name": "Icon widget",
              "status": true,
              "asignee": "Richa"
            },
            {
              "name": "Image Widget",
              "status": true,
              "asignee": "Aparna"
            },
            {
              "name": "Input",
              "status": true,
              "asignee": "Laveena"
            },
            {
              "name": "JSON Form",
              "status": true,
              "asignee": "Chandan"
            },
            {
              "name": "List",
              "status": true,
              "asignee": "Laveena"
            },
            {
              "name": "Menu Widget",
              "status": true,
              "asignee": "Richa"
            },
            {
              "name": "MongoDB",
              "status": true,
              "asignee": "Prapulla"
            },
            {
              "name": "Multi Select widget",
              "status": true,
              "asignee": "Laveena"
            },
            {
              "name": "Multi Tree Select widget",
              "status": true,
              "asignee": "Richa"
            },
            {
              "name": "MySQL",
              "status": false,
              "asignee": "Aparna"
            },
            {
              "name": "Older Apps Testing",
              "status": false,
              "asignee": "All"
            },
            {
              "name": "Omnibar Navigation",
              "status": true,
              "asignee": "Saptami"
            },
            {
              "name": "Page Setting ",
              "status": true,
              "asignee": "Anandi"
            },
            {
              "name": "Phone Input",
              "status": false,
              "asignee": "Shwetha"
            },
            {
              "name": "PostgreSQL",
              "status": true,
              "asignee": "Aparna"
            },
            {
              "name": "Progress",
              "status": true,
              "asignee": "Laveena"
            },
            {
              "name": "Rating Widget",
              "status": false,
              "asignee": "Shwetha"
            },
            {
              "name": "Reflow",
              "status": true,
              "asignee": "Laveena"
            },
            {
              "name": "Rich Text Editor Widge",
              "status": false,
              "asignee": "Shwetha"
            },
            {
              "name": "S3",
              "status": true,
              "asignee": "Raksha"
            },
            {
              "name": "SMTP",
              "status": true,
              "asignee": "Raksha"
            },
            {
              "name": "SSO (CE+EE)",
              "status": true,
              "asignee": "Raksha"
            },
            {
              "name": "Select widget",
              "status": true,
              "asignee": "Chandan"
            },
            {
              "name": "Signup/Signin",
              "status": true,
              "asignee": "Anandi"
            },
            {
              "name": "Slider",
              "status": true,
              "asignee": "Sripriya"
            },
            {
              "name": "Stat box",
              "status": false,
              "asignee": "Shwetha"
            },
            {
              "name": "Switch group ",
              "status": false,
              "asignee": "Richa"
            },
            {
              "name": "Tab Widget ",
              "status": true,
              "asignee": "Kamakshi"
            },
            {
              "name": "Table Widget",
              "status": true,
              "asignee": "Kamakshi"
            },
            {
              "name": "Templates",
              "status": true,
              "asignee": "Richa"
            },
            {
              "name": "Text Widget",
              "status": true,
              "asignee": "Anandi"
            },
            {
              "name": "Theming",
              "status": true,
              "asignee": "Anandi"
            },
            {
              "name": "Tree Select widget",
              "status": true,
              "asignee": "Anandi"
            },
            {
              "name": "Trigger fields",
              "status": true,
              "asignee": "Saptami"
            },
            {
              "name": "UX/UI Issues",
              "status": true,
              "asignee": "Saptami"
            },
            {
              "name": "iFrame Widget ",
              "status": false,
              "asignee": "Shwetha"
            }
          ],
          "done": true,
          "release_id": 79,
          "commit_id": "01d665898a08c1df385a3d7d13069f1d30f6e6cb",
          "notes": "<p>Apart from Regular Regression, also covered testing with MySQL versions 5.7 and 8.0 to ensure Spring Upgrade did not cause any breaks in these areas. </p>"
        },
        {
          "id": 69,
          "created_at": "2023-04-04T09:39:41.54726+00:00",
          "name": "Release",
          "date": "2023-04-04",
          "roster": [
            {
              "name": "API/cURL/Auth API ",
              "status": false,
              "asignee": "Prapulla",
              "complexity": ""
            },
            {
              "name": "Action Selector",
              "status": false,
              "asignee": "Shwetha",
              "complexity": ""
            },
            {
              "name": "Airtable",
              "status": false,
              "asignee": "Prapulla",
              "complexity": ""
            },
            {
              "name": "App level actions [Forking App with pages, widgets + datasources + JS objects/Sharing App /Duplicate App]",
              "status": false,
              "asignee": "Laveena",
              "complexity": ""
            },
            {
              "name": "ArangoDB",
              "status": true,
              "asignee": "Aparna",
              "complexity": ""
            },
            {
              "name": "Audio",
              "status": false,
              "asignee": "Shwetha",
              "complexity": ""
            },
            {
              "name": "Audio Recorder widget",
              "status": false,
              "asignee": "Richa",
              "complexity": ""
            },
            {
              "name": "Billing and Usage Testing",
              "status": false,
              "asignee": "Raksha",
              "complexity": ""
            },
            {
              "name": "Button Group Widget",
              "status": true,
              "asignee": "Saptami",
              "complexity": ""
            },
            {
              "name": "Camera",
              "status": false,
              "asignee": "Richa",
              "complexity": ""
            },
            {
              "name": "Checkbox Group",
              "status": false,
              "asignee": "Kamakshi",
              "complexity": ""
            },
            {
              "name": "Code Scanner",
              "status": false,
              "asignee": "Anand",
              "complexity": ""
            },
            {
              "name": "Currency Input",
              "status": false,
              "asignee": "Laveena",
              "complexity": ""
            },
            {
              "name": "Divider widget",
              "status": false,
              "asignee": "Laveena",
              "complexity": ""
            },
            {
              "name": "Document Viewer",
              "status": false,
              "asignee": "Chandan",
              "complexity": ""
            },
            {
              "name": "Editor",
              "status": false,
              "asignee": "Shwetha",
              "complexity": ""
            },
            {
              "name": "FilePicker",
              "status": false,
              "asignee": "Kamakshi",
              "complexity": ""
            },
            {
              "name": "Firestore DS",
              "status": true,
              "asignee": "Saptami",
              "complexity": ""
            },
            {
              "name": "Framework Functions",
              "status": true,
              "asignee": "Saptami",
              "complexity": ""
            },
            {
              "name": "Git + Git import",
              "status": true,
              "asignee": "Raksha",
              "complexity": ""
            },
            {
              "name": "GoogleSheets",
              "status": false,
              "asignee": "Prapulla",
              "complexity": ""
            },
            {
              "name": "GraphQL",
              "status": false,
              "asignee": "Prapulla",
              "complexity": ""
            },
            {
              "name": "HubSpot",
              "status": false,
              "asignee": "Prapulla",
              "complexity": ""
            },
            {
              "name": "Icon widget",
              "status": false,
              "asignee": "Richa",
              "complexity": ""
            },
            {
              "name": "Image Widget",
              "status": false,
              "asignee": "Laveena",
              "complexity": ""
            },
            {
              "name": "Input",
              "status": false,
              "asignee": "Anand",
              "complexity": ""
            },
            {
              "name": "JSON Form",
              "status": false,
              "asignee": "Chandan",
              "complexity": ""
            },
            {
              "name": "List",
              "status": false,
              "asignee": "Kamakshi",
              "complexity": ""
            },
            {
              "name": "Menu Widget",
              "status": false,
              "asignee": "Richa",
              "complexity": ""
            },
            {
              "name": "MongoDB",
              "status": false,
              "asignee": "Anand",
              "complexity": ""
            },
            {
              "name": "Multi Select widget",
              "status": false,
              "asignee": "Sripriya",
              "complexity": ""
            },
            {
              "name": "Multi Tree Select widget",
              "status": false,
              "asignee": "Aparna",
              "complexity": ""
            },
            {
              "name": "MySQL",
              "status": false,
              "asignee": "Prapulla",
              "complexity": ""
            },
            {
              "name": "OAuth with Dropbox",
              "status": true,
              "asignee": "Aparna",
              "complexity": ""
            },
            {
              "name": "Older Apps Testing",
              "status": false,
              "asignee": "All",
              "complexity": "High"
            },
            {
              "name": "Omnibar Navigation",
              "status": true,
              "asignee": "Saptami",
              "complexity": ""
            },
            {
              "name": "Page Setting ",
              "status": false,
              "asignee": "Shwetha",
              "complexity": ""
            },
            {
              "name": "Page level actions",
              "status": false,
              "asignee": "Sripriya",
              "complexity": ""
            },
            {
              "name": "Phone Input",
              "status": false,
              "asignee": "Richa",
              "complexity": ""
            },
            {
              "name": "PostgreSQL",
              "status": false,
              "asignee": "Anand",
              "complexity": ""
            },
            {
              "name": "Progress",
              "status": true,
              "asignee": "Aparna",
              "complexity": ""
            },
            {
              "name": "Rating Widget",
              "status": false,
              "asignee": "Laveena",
              "complexity": ""
            },
            {
              "name": "Reflow",
              "status": false,
              "asignee": "Laveena",
              "complexity": ""
            },
            {
              "name": "Rich Text Editor Widge",
              "status": false,
              "asignee": "Shwetha",
              "complexity": ""
            },
            {
              "name": "S3",
              "status": false,
              "asignee": "Anand",
              "complexity": ""
            },
            {
              "name": "SMTP",
              "status": true,
              "asignee": "Aparna",
              "complexity": ""
            },
            {
              "name": "SSO (CE+EE)",
              "status": true,
              "asignee": "Aparna",
              "complexity": ""
            },
            {
              "name": "SSO with other Deployment Scenarios",
              "status": true,
              "asignee": "Raksha",
              "complexity": ""
            },
            {
              "name": "Select widget",
              "status": false,
              "asignee": "Chandan",
              "complexity": ""
            },
            {
              "name": "Signup/Signin",
              "status": false,
              "asignee": "Sripriya",
              "complexity": ""
            },
            {
              "name": "Slider",
              "status": true,
              "asignee": "Saptami",
              "complexity": ""
            },
            {
              "name": "Snowflake",
              "status": false,
              "asignee": "Anand",
              "complexity": ""
            },
            {
              "name": "Stat box",
              "status": false,
              "asignee": "Shwetha",
              "complexity": ""
            },
            {
              "name": "Switch group ",
              "status": false,
              "asignee": "Chandan",
              "complexity": ""
            },
            {
              "name": "Tab Widget ",
              "status": true,
              "asignee": "Aparna",
              "complexity": ""
            },
            {
              "name": "Table Widget",
              "status": false,
              "asignee": "Kamakshi",
              "complexity": ""
            },
            {
              "name": "Templates",
              "status": false,
              "asignee": "Richa",
              "complexity": ""
            },
            {
              "name": "Text Widget",
              "status": false,
              "asignee": "Chandan",
              "complexity": ""
            },
            {
              "name": "Theming",
              "status": false,
              "asignee": "Anandi",
              "complexity": ""
            },
            {
              "name": "Tree Select widget",
              "status": false,
              "asignee": "Chandan",
              "complexity": ""
            },
            {
              "name": "UX/UI Issues",
              "status": false,
              "asignee": "Kamakshi",
              "complexity": ""
            },
            {
              "name": "Upgrade Testing - FE/NDX/Git",
              "status": true,
              "asignee": "Saptami",
              "complexity": ""
            },
            {
              "name": "Upgrade Testing - Platform/Integration",
              "status": false,
              "asignee": "Raksha",
              "complexity": ""
            },
            {
              "name": "Upgrade Testing - SSO",
              "status": true,
              "asignee": "Raksha",
              "complexity": ""
            },
            {
              "name": "Upgrade Testing - UI/AppViewers/Mobile/Design",
              "status": false,
              "asignee": "Kamakshi",
              "complexity": ""
            },
            {
              "name": "Vulnerability check",
              "status": true,
              "asignee": "Raksha",
              "complexity": ""
            },
            {
              "name": "iFrame Widget ",
              "status": false,
              "asignee": "Laveena",
              "complexity": ""
            }
          ],
          "done": true,
          "release_id": 100,
          "commit_id": "292c32407b52070a40c4f8df9efae4ee0e6b11a1",
          "notes": "<p>Note: Blockers have been resolved and verified by QA</p>"
        },
        {
          "id": 56,
          "created_at": "2023-01-10T05:31:55.235556+00:00",
          "name": "Release",
          "date": "2023-01-10",
          "roster": [
            {
              "name": "API/cURL/Auth API ",
              "status": true,
              "asignee": "Prapulla"
            },
            {
              "name": "Airtable",
              "status": true,
              "asignee": "Prapulla"
            },
            {
              "name": "Audio",
              "status": true,
              "asignee": "Anandi"
            },
            {
              "name": "Audio Recorder widget",
              "status": true,
              "asignee": "Richa"
            },
            {
              "name": "Button Group Widget",
              "status": true,
              "asignee": "Shadab"
            },
            {
              "name": "Camera",
              "status": true,
              "asignee": "Anand"
            },
            {
              "name": "Checkbox Group",
              "status": true,
              "asignee": "Aparna"
            },
            {
              "name": "Code Scanner",
              "status": true,
              "asignee": "Kamakshi"
            },
            {
              "name": "Currency Input",
              "status": false,
              "asignee": "Chandan"
            },
            {
              "name": "Divider widget",
              "status": true,
              "asignee": "Laveena"
            },
            {
              "name": "Document Viewer",
              "status": false,
              "asignee": "Chandan"
            },
            {
              "name": "Editor",
              "status": true,
              "asignee": "Saptami"
            },
            {
              "name": "FilePicker",
              "status": true,
              "asignee": "Kamakshi"
            },
            {
              "name": "Git + Git import",
              "status": true,
              "asignee": "Raksha"
            },
            {
              "name": "GoogleSheets",
              "status": true,
              "asignee": "Raksha"
            },
            {
              "name": "GraphQL",
              "status": true,
              "asignee": "Prapulla"
            },
            {
              "name": "Homepage Profile [Forking App with pages, widgets and datasources/Sharing App /Duplicate App]",
              "status": false,
              "asignee": "Sripriya"
            },
            {
              "name": "HubSpot",
              "status": true,
              "asignee": "Prapulla"
            },
            {
              "name": "Icon widget",
              "status": true,
              "asignee": "Richa"
            },
            {
              "name": "Image Widget",
              "status": true,
              "asignee": "Aparna"
            },
            {
              "name": "Input",
              "status": true,
              "asignee": "Laveena"
            },
            {
              "name": "JSON Form",
              "status": false,
              "asignee": "Chandan"
            },
            {
              "name": "List",
              "status": true,
              "asignee": "Shadab"
            },
            {
              "name": "Menu Widget",
              "status": true,
              "asignee": "Richa"
            },
            {
              "name": "MongoDB",
              "status": true,
              "asignee": "Raksha"
            },
            {
              "name": "Multi Select widget",
              "status": true,
              "asignee": "Shadab"
            },
            {
              "name": "Multi Tree Select widget",
              "status": false,
              "asignee": "Sripriya"
            },
            {
              "name": "MySQL",
              "status": false,
              "asignee": "Prapulla"
            },
            {
              "name": "Older Apps Testing",
              "status": false,
              "asignee": "All"
            },
            {
              "name": "Omnibar Navigation",
              "status": true,
              "asignee": "Saptami"
            },
            {
              "name": "Page Setting ",
              "status": true,
              "asignee": "Anandi"
            },
            {
              "name": "Phone Input",
              "status": false,
              "asignee": "Shwetha"
            },
            {
              "name": "PostgreSQL",
              "status": true,
              "asignee": "Anand"
            },
            {
              "name": "Progress",
              "status": true,
              "asignee": "Laveena"
            },
            {
              "name": "Rating Widget",
              "status": false,
              "asignee": "Shwetha"
            },
            {
              "name": "Reflow",
              "status": true,
              "asignee": "Laveena"
            },
            {
              "name": "Rich Text Editor Widge",
              "status": false,
              "asignee": "Shwetha"
            },
            {
              "name": "S3",
              "status": true,
              "asignee": "Raksha"
            },
            {
              "name": "SMTP",
              "status": true,
              "asignee": "Raksha"
            },
            {
              "name": "SSO (CE+EE)",
              "status": true,
              "asignee": "Aparna"
            },
            {
              "name": "Select widget",
              "status": false,
              "asignee": "Chandan"
            },
            {
              "name": "Signup/Signin",
              "status": false,
              "asignee": "Sripriya"
            },
            {
              "name": "Slider",
              "status": false,
              "asignee": "Sripriya"
            },
            {
              "name": "Stat box",
              "status": false,
              "asignee": "Shwetha"
            },
            {
              "name": "Switch group ",
              "status": true,
              "asignee": "Shadab"
            },
            {
              "name": "Tab Widget ",
              "status": true,
              "asignee": "Kamakshi"
            },
            {
              "name": "Table Widget",
              "status": true,
              "asignee": "Kamakshi"
            },
            {
              "name": "Templates",
              "status": true,
              "asignee": "Richa"
            },
            {
              "name": "Text Widget",
              "status": true,
              "asignee": "Anandi"
            },
            {
              "name": "Theming",
              "status": true,
              "asignee": "Anandi"
            },
            {
              "name": "Tree Select widget",
              "status": true,
              "asignee": "Anandi"
            },
            {
              "name": "Trigger fields",
              "status": true,
              "asignee": "Saptami"
            },
            {
              "name": "UX/UI Issues",
              "status": true,
              "asignee": "Saptami"
            },
            {
              "name": "iFrame Widget ",
              "status": false,
              "asignee": "Shwetha"
            },
            {
              "name": "Snowflake",
              "status": false,
              "asignee": ""
            }
          ],
          "done": true,
          "release_id": 82,
          "commit_id": "5e97eec525d815dc18e6467163682fd2705467c5",
          "notes": "<p>IMPORTANT NOTE: The one blocker that was reported has been fixed and the issue has also been closed. </p>"
        },
        {
          "id": 70,
          "created_at": "2023-04-11T05:14:36.379305+00:00",
          "name": "Release",
          "date": "2023-04-11",
          "roster": [
            {
              "name": "API/cURL/Auth API ",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "High"
            },
            {
              "name": "Action Selector",
              "status": false,
              "asignee": "Shwetha",
              "complexity": "Critical"
            },
            {
              "name": "Airtable",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Medium"
            },
            {
              "name": "App level actions [Forking App with pages, widgets + datasources + JS objects/Sharing App /Duplicate App]",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Critical"
            },
            {
              "name": "ArangoDB",
              "status": true,
              "asignee": "Anand",
              "complexity": "Low"
            },
            {
              "name": "Audio",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Low"
            },
            {
              "name": "Audio Recorder widget",
              "status": true,
              "asignee": "Richa",
              "complexity": "Low"
            },
            {
              "name": "Billing and Usage Testing",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Critical"
            },
            {
              "name": "Button",
              "status": true,
              "asignee": "Laveena",
              "complexity": "High"
            },
            {
              "name": "Button Group Widget",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Medium"
            },
            {
              "name": "Camera",
              "status": true,
              "asignee": "Richa",
              "complexity": "Low"
            },
            {
              "name": "Category Slider",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Low"
            },
            {
              "name": "Chart",
              "status": true,
              "asignee": "Laveena",
              "complexity": "High"
            },
            {
              "name": "Checkbox Group",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Low"
            },
            {
              "name": "Code Scanner",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Low"
            },
            {
              "name": "Container",
              "status": true,
              "asignee": "Kamakshi",
              "complexity": "Critical"
            },
            {
              "name": "Currency Input",
              "status": true,
              "asignee": "Anand",
              "complexity": "Low"
            },
            {
              "name": "Date Picker",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Medium"
            },
            {
              "name": "Divider widget",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Low"
            },
            {
              "name": "Document Viewer",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Low"
            },
            {
              "name": "FilePicker",
              "status": true,
              "asignee": "Kamakshi",
              "complexity": "Medium"
            },
            {
              "name": "Firestore DS",
              "status": true,
              "asignee": "Anand",
              "complexity": "Medium"
            },
            {
              "name": "Form",
              "status": false,
              "asignee": "Chandan",
              "complexity": "High"
            },
            {
              "name": "Framework Functions",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Critical"
            },
            {
              "name": "Git + Git import",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Critical"
            },
            {
              "name": "GoogleSheets",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Critical"
            },
            {
              "name": "GraphQL",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Medium"
            },
            {
              "name": "HubSpot",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Low"
            },
            {
              "name": "Icon widget",
              "status": true,
              "asignee": "Richa",
              "complexity": "Medium"
            },
            {
              "name": "Image Widget",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "High"
            },
            {
              "name": "Input",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Critical"
            },
            {
              "name": "Install testing",
              "status": true,
              "asignee": "Saroj",
              "complexity": "Critical"
            },
            {
              "name": "JS Objects",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Critical"
            },
            {
              "name": "JSON Form",
              "status": false,
              "asignee": "Chandan",
              "complexity": "Medium"
            },
            {
              "name": "Javascript",
              "status": true,
              "asignee": "Saptami",
              "complexity": "High"
            },
            {
              "name": "List",
              "status": true,
              "asignee": "Kamakshi",
              "complexity": "Critical"
            },
            {
              "name": "Map",
              "status": true,
              "asignee": "Richa",
              "complexity": "Low"
            },
            {
              "name": "Map Chart",
              "status": true,
              "asignee": "Richa",
              "complexity": "Low"
            },
            {
              "name": "Menu Widget",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Medium"
            },
            {
              "name": "Microsoft SQL",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Medium"
            },
            {
              "name": "Modal",
              "status": true,
              "asignee": "Saptami",
              "complexity": "High"
            },
            {
              "name": "MongoDB",
              "status": true,
              "asignee": "Anand",
              "complexity": "Critical"
            },
            {
              "name": "Multi Select widget",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Low"
            },
            {
              "name": "Multi Tree Select widget",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Medium"
            },
            {
              "name": "MySQL",
              "status": true,
              "asignee": "Anand",
              "complexity": "Critical"
            },
            {
              "name": "Number  Slider",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Low"
            },
            {
              "name": "OAuth with Dropbox",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Medium"
            },
            {
              "name": "Older Apps Testing",
              "status": false,
              "asignee": "All",
              "complexity": "High"
            },
            {
              "name": "Omnibar Navigation",
              "status": true,
              "asignee": "Richa",
              "complexity": "Critical"
            },
            {
              "name": "Page Setting ",
              "status": true,
              "asignee": "Richa",
              "complexity": "High"
            },
            {
              "name": "Page level actions",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Critical"
            },
            {
              "name": "Phone Input",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Low"
            },
            {
              "name": "PostgreSQL",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Critical"
            },
            {
              "name": "Progress",
              "status": true,
              "asignee": "Shwetha",
              "complexity": "Low"
            },
            {
              "name": "Radio",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Low"
            },
            {
              "name": "Range Slider",
              "status": false,
              "asignee": "Sripriya",
              "complexity": "Low"
            },
            {
              "name": "Rating Widget",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Low"
            },
            {
              "name": "Reflow",
              "status": true,
              "asignee": "Laveena",
              "complexity": "High"
            },
            {
              "name": "Rich Text Editor Widge",
              "status": false,
              "asignee": "Shwetha",
              "complexity": "Medium"
            },
            {
              "name": "S3",
              "status": true,
              "asignee": "Anand",
              "complexity": "Medium"
            },
            {
              "name": "SMTP",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Medium"
            },
            {
              "name": "SSO (CE+EE)",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Critical"
            },
            {
              "name": "SSO with other Deployment Scenarios",
              "status": false,
              "asignee": "Raksha",
              "complexity": "Critical"
            },
            {
              "name": "Select widget",
              "status": false,
              "asignee": "Chandan",
              "complexity": "High"
            },
            {
              "name": "Signup/Signin",
              "status": true,
              "asignee": "Aparna",
              "complexity": "Critical"
            },
            {
              "name": "Snowflake",
              "status": true,
              "asignee": "Anand",
              "complexity": "Low"
            },
            {
              "name": "Stat box",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Medium"
            },
            {
              "name": "Switch",
              "status": true,
              "asignee": "Anand",
              "complexity": "Low"
            },
            {
              "name": "Switch group ",
              "status": true,
              "asignee": "Anand",
              "complexity": "Low"
            },
            {
              "name": "Tab Widget ",
              "status": true,
              "asignee": "Aparna",
              "complexity": "High"
            },
            {
              "name": "Table Widget",
              "status": false,
              "asignee": "Chandan",
              "complexity": "Critical"
            },
            {
              "name": "Templates",
              "status": true,
              "asignee": "Richa",
              "complexity": "Critical"
            },
            {
              "name": "Text Widget",
              "status": true,
              "asignee": "Kamakshi",
              "complexity": "High"
            },
            {
              "name": "Theming",
              "status": true,
              "asignee": "Richa",
              "complexity": "High"
            },
            {
              "name": "Tree Select widget",
              "status": false,
              "asignee": "Chandan",
              "complexity": "Medium"
            },
            {
              "name": "UX/UI Issues",
              "status": true,
              "asignee": "Saptami",
              "complexity": "High"
            },
            {
              "name": "Upgrade Testing - FE/NDX/Git",
              "status": true,
              "asignee": "Saptami",
              "complexity": "Critical"
            },
            {
              "name": "Upgrade Testing - Platform/Integration",
              "status": false,
              "asignee": "Raksha",
              "complexity": "Critical"
            },
            {
              "name": "Upgrade Testing - SSO",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Critical"
            },
            {
              "name": "Upgrade Testing - UI/AppViewers/Mobile/Design",
              "status": false,
              "asignee": "Kamakshi",
              "complexity": "Critical"
            },
            {
              "name": "Video",
              "status": true,
              "asignee": "Prapulla",
              "complexity": "Low"
            },
            {
              "name": "Vulnerability check",
              "status": true,
              "asignee": "Raksha",
              "complexity": "Critical"
            },
            {
              "name": "iFrame Widget ",
              "status": true,
              "asignee": "Laveena",
              "complexity": "Medium"
            }
          ],
          "done": true,
          "release_id": 101,
          "commit_id": "07e6f1533659ab475b306fa41628204778b7ad6c",
          "notes": ""
        },
        {
          "id": 63,
          "created_at": "2023-03-06T07:09:05.31669+00:00",
          "name": "Release",
          "date": "2023-03-06",
          "roster": [
            {
              "name": "API/cURL/Auth API ",
              "status": true,
              "asignee": "Prapulla"
            },
            {
              "name": "Airtable",
              "status": true,
              "asignee": "Prapulla"
            },
            {
              "name": "ArangoDB",
              "status": true,
              "asignee": "Aparna"
            },
            {
              "name": "Audio",
              "status": true,
              "asignee": "Anandi"
            },
            {
              "name": "Audio Recorder widget",
              "status": true,
              "asignee": "Richa"
            },
            {
              "name": "Billing and Usage Testing",
              "status": false,
              "asignee": "Raksha"
            },
            {
              "name": "Button Group Widget",
              "status": true,
              "asignee": "Shadab"
            },
            {
              "name": "Camera",
              "status": true,
              "asignee": "Laveena"
            },
            {
              "name": "Checkbox Group",
              "status": false,
              "asignee": "Sripriya"
            },
            {
              "name": "Code Scanner",
              "status": true,
              "asignee": "Kamakshi"
            },
            {
              "name": "Currency Input",
              "status": true,
              "asignee": "Chandan"
            },
            {
              "name": "Divider widget",
              "status": false,
              "asignee": "Chandan"
            },
            {
              "name": "Document Viewer",
              "status": true,
              "asignee": "Laveena"
            },
            {
              "name": "Editor",
              "status": true,
              "asignee": "Saptami"
            },
            {
              "name": "FilePicker",
              "status": true,
              "asignee": "Kamakshi"
            },
            {
              "name": "Firestore DS",
              "status": true,
              "asignee": "Aparna"
            },
            {
              "name": "Git + Git import",
              "status": true,
              "asignee": "Raksha"
            },
            {
              "name": "GoogleSheets",
              "status": true,
              "asignee": "Saptami"
            },
            {
              "name": "GraphQL",
              "status": true,
              "asignee": "Prapulla"
            },
            {
              "name": "Homepage Profile [Forking App with pages, widgets and datasources/Sharing App /Duplicate App]",
              "status": false,
              "asignee": "Sripriya"
            },
            {
              "name": "HubSpot",
              "status": true,
              "asignee": "Prapulla"
            },
            {
              "name": "Icon widget",
              "status": true,
              "asignee": "Richa"
            },
            {
              "name": "Image Widget",
              "status": true,
              "asignee": "Richa"
            },
            {
              "name": "Input",
              "status": true,
              "asignee": "Laveena"
            },
            {
              "name": "JSON Form",
              "status": true,
              "asignee": "Chandan"
            },
            {
              "name": "List",
              "status": true,
              "asignee": "Shadab"
            },
            {
              "name": "Menu Widget",
              "status": true,
              "asignee": "Richa"
            },
            {
              "name": "MongoDB",
              "status": true,
              "asignee": "Prapulla"
            },
            {
              "name": "Multi Select widget",
              "status": true,
              "asignee": "Shadab"
            },
            {
              "name": "Multi Tree Select widget",
              "status": false,
              "asignee": "Sripriya"
            },
            {
              "name": "MySQL",
              "status": true,
              "asignee": "Prapulla"
            },
            {
              "name": "OAuth with Dropbox",
              "status": true,
              "asignee": "Aparna"
            },
            {
              "name": "Older Apps Testing",
              "status": false,
              "asignee": "All"
            },
            {
              "name": "Omnibar Navigation",
              "status": true,
              "asignee": "Richa"
            },
            {
              "name": "Page Setting ",
              "status": true,
              "asignee": "Anandi"
            },
            {
              "name": "Phone Input",
              "status": false,
              "asignee": "Shwetha"
            },
            {
              "name": "PostgreSQL",
              "status": true,
              "asignee": "Saptami"
            },
            {
              "name": "Progress",
              "status": false,
              "asignee": "Shwetha"
            },
            {
              "name": "Rating Widget",
              "status": false,
              "asignee": "Shwetha"
            },
            {
              "name": "Reflow",
              "status": true,
              "asignee": "Laveena"
            },
            {
              "name": "Rich Text Editor Widge",
              "status": false,
              "asignee": "Shwetha"
            },
            {
              "name": "S3",
              "status": true,
              "asignee": "Aparna"
            },
            {
              "name": "SMTP",
              "status": true,
              "asignee": "Raksha"
            },
            {
              "name": "SSO (CE+EE)",
              "status": true,
              "asignee": "Aparna"
            },
            {
              "name": "SSO with other Deployment Scenarios",
              "status": true,
              "asignee": "Raksha"
            },
            {
              "name": "Select widget",
              "status": false,
              "asignee": "Chandan"
            },
            {
              "name": "Signup/Signin",
              "status": false,
              "asignee": "Sripriya"
            },
            {
              "name": "Slider",
              "status": false,
              "asignee": "Sripriya"
            },
            {
              "name": "Snowflake",
              "status": true,
              "asignee": "Aparna"
            },
            {
              "name": "Stat box",
              "status": true,
              "asignee": "Laveena"
            },
            {
              "name": "Switch group ",
              "status": true,
              "asignee": "Shadab"
            },
            {
              "name": "Tab Widget ",
              "status": true,
              "asignee": "Shadab"
            },
            {
              "name": "Table Widget",
              "status": true,
              "asignee": "Kamakshi"
            },
            {
              "name": "Templates",
              "status": true,
              "asignee": "Richa"
            },
            {
              "name": "Text Widget",
              "status": false,
              "asignee": "Sripriya"
            },
            {
              "name": "Theming",
              "status": true,
              "asignee": "Anandi"
            },
            {
              "name": "Tree Select widget",
              "status": true,
              "asignee": "Anandi"
            },
            {
              "name": "Trigger fields",
              "status": true,
              "asignee": "Saptami"
            },
            {
              "name": "UX/UI Issues",
              "status": true,
              "asignee": "Kamakshi"
            },
            {
              "name": "Upgrade Testing - FE/NDX/Git",
              "status": true,
              "asignee": "Saptami"
            },
            {
              "name": "Upgrade Testing - Platform/Integration",
              "status": true,
              "asignee": "Aparna"
            },
            {
              "name": "Upgrade Testing - SSO",
              "status": true,
              "asignee": "Raksha"
            },
            {
              "name": "Upgrade Testing - UI/AppViewers/Mobile/Design",
              "status": true,
              "asignee": "Kamakshi"
            },
            {
              "name": "Vulnerability check",
              "status": true,
              "asignee": "Raksha"
            },
            {
              "name": "iFrame Widget ",
              "status": true,
              "asignee": "Laveena"
            }
          ],
          "done": true,
          "release_id": 93,
          "commit_id": "0e8c1fb535f978ec9e60e19aec182a40c43f8612",
          "notes": ""
        },
        {
          "id": 61,
          "created_at": "2023-02-28T05:08:28.258744+00:00",
          "name": "Release",
          "date": "2023-02-28",
          "roster": [
            {
              "name": "API/cURL/Auth API ",
              "status": true,
              "asignee": "Prapulla"
            },
            {
              "name": "Airtable",
              "status": true,
              "asignee": "Prapulla"
            },
            {
              "name": "ArangoDB",
              "status": true,
              "asignee": "Aparna"
            },
            {
              "name": "Audio",
              "status": true,
              "asignee": "Anandi"
            },
            {
              "name": "Audio Recorder widget",
              "status": true,
              "asignee": "Richa"
            },
            {
              "name": "Button Group Widget",
              "status": true,
              "asignee": "Shadab"
            },
            {
              "name": "Camera",
              "status": true,
              "asignee": "Kamakshi"
            },
            {
              "name": "Checkbox Group",
              "status": false,
              "asignee": "Sripriya"
            },
            {
              "name": "Code Scanner",
              "status": true,
              "asignee": "Kamakshi"
            },
            {
              "name": "Currency Input",
              "status": true,
              "asignee": "Chandan"
            },
            {
              "name": "Divider widget",
              "status": true,
              "asignee": "Chandan"
            },
            {
              "name": "Document Viewer",
              "status": true,
              "asignee": "Chandan"
            },
            {
              "name": "Editor",
              "status": true,
              "asignee": "Anandi"
            },
            {
              "name": "FilePicker",
              "status": true,
              "asignee": "Kamakshi"
            },
            {
              "name": "Firestore DS",
              "status": true,
              "asignee": "Aparna"
            },
            {
              "name": "Git + Git import",
              "status": true,
              "asignee": "Raksha"
            },
            {
              "name": "GoogleSheets",
              "status": true,
              "asignee": "Prapulla"
            },
            {
              "name": "GraphQL",
              "status": true,
              "asignee": "Prapulla"
            },
            {
              "name": "Homepage Profile [Forking App with pages, widgets and datasources/Sharing App /Duplicate App]",
              "status": false,
              "asignee": "Sripriya"
            },
            {
              "name": "HubSpot",
              "status": true,
              "asignee": "Prapulla"
            },
            {
              "name": "Icon widget",
              "status": true,
              "asignee": "Richa"
            },
            {
              "name": "Image Widget",
              "status": true,
              "asignee": "Richa"
            },
            {
              "name": "Input",
              "status": true,
              "asignee": "Laveena"
            },
            {
              "name": "JSON Form",
              "status": false,
              "asignee": "Chandan"
            },
            {
              "name": "List",
              "status": true,
              "asignee": "Shadab"
            },
            {
              "name": "Menu Widget",
              "status": true,
              "asignee": "Richa"
            },
            {
              "name": "MongoDB",
              "status": true,
              "asignee": "Raksha"
            },
            {
              "name": "Multi Select widget",
              "status": true,
              "asignee": "Shadab"
            },
            {
              "name": "Multi Tree Select widget",
              "status": false,
              "asignee": "Sripriya"
            },
            {
              "name": "MySQL",
              "status": false,
              "asignee": "Prapulla"
            },
            {
              "name": "OAuth with Dropbox",
              "status": true,
              "asignee": "Aparna"
            },
            {
              "name": "Older Apps Testing",
              "status": false,
              "asignee": "All"
            },
            {
              "name": "Omnibar Navigation",
              "status": true,
              "asignee": "Richa"
            },
            {
              "name": "Page Setting ",
              "status": true,
              "asignee": "Anandi"
            },
            {
              "name": "Phone Input",
              "status": false,
              "asignee": "Shwetha"
            },
            {
              "name": "PostgreSQL",
              "status": true,
              "asignee": "Aparna"
            },
            {
              "name": "Progress",
              "status": false,
              "asignee": "Shwetha"
            },
            {
              "name": "Rating Widget",
              "status": false,
              "asignee": "Shwetha"
            },
            {
              "name": "Reflow",
              "status": true,
              "asignee": "Laveena"
            },
            {
              "name": "Rich Text Editor Widge",
              "status": false,
              "asignee": "Shwetha"
            },
            {
              "name": "S3",
              "status": true,
              "asignee": "Raksha"
            },
            {
              "name": "SMTP",
              "status": true,
              "asignee": "Raksha"
            },
            {
              "name": "SSO (CE+EE)",
              "status": true,
              "asignee": "Aparna"
            },
            {
              "name": "Select widget",
              "status": false,
              "asignee": "Chandan"
            },
            {
              "name": "Signup/Signin",
              "status": false,
              "asignee": "Sripriya"
            },
            {
              "name": "Slider",
              "status": false,
              "asignee": "Sripriya"
            },
            {
              "name": "Snowflake",
              "status": true,
              "asignee": "Aparna"
            },
            {
              "name": "Stat box",
              "status": false,
              "asignee": "Shwetha"
            },
            {
              "name": "Switch group ",
              "status": true,
              "asignee": "Shadab"
            },
            {
              "name": "Tab Widget ",
              "status": true,
              "asignee": "Shadab"
            },
            {
              "name": "Table Widget",
              "status": true,
              "asignee": "Kamakshi"
            },
            {
              "name": "Templates",
              "status": true,
              "asignee": "Richa"
            },
            {
              "name": "Text Widget",
              "status": false,
              "asignee": "Sripriya"
            },
            {
              "name": "Theming",
              "status": true,
              "asignee": "Anandi"
            },
            {
              "name": "Tree Select widget",
              "status": true,
              "asignee": "Anandi"
            },
            {
              "name": "Trigger fields",
              "status": true,
              "asignee": "Anandi"
            },
            {
              "name": "UX/UI Issues",
              "status": true,
              "asignee": "Kamakshi"
            },
            {
              "name": "Upgrade Testing - SSO",
              "status": true,
              "asignee": "Raksha"
            },
            {
              "name": "Vulnerability check",
              "status": true,
              "asignee": "Raksha"
            },
            {
              "name": "iFrame Widget ",
              "status": true,
              "asignee": "Laveena"
            }
          ],
          "done": true,
          "release_id": 92,
          "commit_id": "a27c52a7e499b9164004c74027a5d2498a1a7da4",
          "notes": "<p><strong>Blocker found on cloud-services - </strong></p>\n<p class=\"p1\">538-[Bug]: The price plan is not getting attached in Togai</p>\n<p>IMP: Regression was performed on a deploy preview this time, without placing mergefreeze. The Branch name being: release_28Feb2023</p>"
        },
        {
          "id": 59,
          "created_at": "2023-02-13T10:17:38.140165+00:00",
          "name": "Release",
          "date": "2023-02-13",
          "roster": [
            {
              "name": "API/cURL/Auth API ",
              "status": true,
              "asignee": "Prapulla"
            },
            {
              "name": "Airtable",
              "status": false,
              "asignee": "Prapulla"
            },
            {
              "name": "ArangoDB",
              "status": true,
              "asignee": "Prapulla"
            },
            {
              "name": "Audio",
              "status": true,
              "asignee": "Anandi"
            },
            {
              "name": "Audio Recorder widget",
              "status": true,
              "asignee": "Richa"
            },
            {
              "name": "Button Group Widget",
              "status": true,
              "asignee": "Shadab"
            },
            {
              "name": "Camera",
              "status": true,
              "asignee": "Kamakshi"
            },
            {
              "name": "Checkbox Group",
              "status": false,
              "asignee": "Sripriya"
            },
            {
              "name": "Code Scanner",
              "status": true,
              "asignee": "Kamakshi"
            },
            {
              "name": "Currency Input",
              "status": false,
              "asignee": "Chandan"
            },
            {
              "name": "Divider widget",
              "status": true,
              "asignee": "Laveena"
            },
            {
              "name": "Document Viewer",
              "status": false,
              "asignee": "Chandan"
            },
            {
              "name": "Editor",
              "status": false,
              "asignee": "Saptami"
            },
            {
              "name": "FilePicker",
              "status": true,
              "asignee": "Kamakshi"
            },
            {
              "name": "Firestore DS",
              "status": true,
              "asignee": "Aparna"
            },
            {
              "name": "Git + Git import",
              "status": true,
              "asignee": "Raksha"
            },
            {
              "name": "GoogleSheets",
              "status": true,
              "asignee": "Raksha"
            },
            {
              "name": "GraphQL",
              "status": true,
              "asignee": "Prapulla"
            },
            {
              "name": "Homepage Profile [Forking App with pages, widgets and datasources/Sharing App /Duplicate App]",
              "status": false,
              "asignee": "Sripriya"
            },
            {
              "name": "HubSpot",
              "status": false,
              "asignee": "Prapulla"
            },
            {
              "name": "Icon widget",
              "status": true,
              "asignee": "Richa"
            },
            {
              "name": "Image Widget",
              "status": true,
              "asignee": "Richa"
            },
            {
              "name": "Input",
              "status": true,
              "asignee": "Laveena"
            },
            {
              "name": "JSON Form",
              "status": false,
              "asignee": "Chandan"
            },
            {
              "name": "List",
              "status": true,
              "asignee": "Shadab"
            },
            {
              "name": "Menu Widget",
              "status": true,
              "asignee": "Richa"
            },
            {
              "name": "MongoDB",
              "status": true,
              "asignee": "Raksha"
            },
            {
              "name": "Multi Select widget",
              "status": true,
              "asignee": "Shadab"
            },
            {
              "name": "Multi Tree Select widget",
              "status": false,
              "asignee": "Sripriya"
            },
            {
              "name": "MySQL",
              "status": true,
              "asignee": "Raksha"
            },
            {
              "name": "OAuth with Dropbox",
              "status": true,
              "asignee": "Aparna"
            },
            {
              "name": "Older Apps Testing",
              "status": false,
              "asignee": "All"
            },
            {
              "name": "Omnibar Navigation",
              "status": false,
              "asignee": "Saptami"
            },
            {
              "name": "Page Setting ",
              "status": true,
              "asignee": "Anandi"
            },
            {
              "name": "Phone Input",
              "status": false,
              "asignee": "Shwetha"
            },
            {
              "name": "PostgreSQL",
              "status": true,
              "asignee": "Aparna"
            },
            {
              "name": "Progress",
              "status": true,
              "asignee": "Laveena"
            },
            {
              "name": "Rating Widget",
              "status": false,
              "asignee": "Shwetha"
            },
            {
              "name": "Reflow",
              "status": true,
              "asignee": "Laveena"
            },
            {
              "name": "Rich Text Editor Widge",
              "status": false,
              "asignee": "Shwetha"
            },
            {
              "name": "S3",
              "status": true,
              "asignee": "Prapulla"
            },
            {
              "name": "SMTP",
              "status": true,
              "asignee": "Raksha"
            },
            {
              "name": "SSO (CE+EE)",
              "status": true,
              "asignee": "Aparna"
            },
            {
              "name": "Select widget",
              "status": false,
              "asignee": "Chandan"
            },
            {
              "name": "Signup/Signin",
              "status": false,
              "asignee": "Sripriya"
            },
            {
              "name": "Slider",
              "status": false,
              "asignee": "Sripriya"
            },
            {
              "name": "Snowflake",
              "status": true,
              "asignee": "Aparna"
            },
            {
              "name": "Stat box",
              "status": false,
              "asignee": "Shwetha"
            },
            {
              "name": "Switch group ",
              "status": true,
              "asignee": "Shadab"
            },
            {
              "name": "Tab Widget ",
              "status": true,
              "asignee": "Shadab"
            },
            {
              "name": "Table Widget",
              "status": true,
              "asignee": "Kamakshi"
            },
            {
              "name": "Templates",
              "status": true,
              "asignee": "Richa"
            },
            {
              "name": "Text Widget",
              "status": true,
              "asignee": "Anandi"
            },
            {
              "name": "Theming",
              "status": true,
              "asignee": "Anandi"
            },
            {
              "name": "Tree Select widget",
              "status": true,
              "asignee": "Anandi"
            },
            {
              "name": "Trigger fields",
              "status": false,
              "asignee": "Saptami"
            },
            {
              "name": "UX/UI Issues",
              "status": false,
              "asignee": "Saptami"
            },
            {
              "name": "Upgrade Testing - SSO",
              "status": false,
              "asignee": "Raksha"
            },
            {
              "name": "iFrame Widget ",
              "status": true,
              "asignee": "Laveena"
            }
          ],
          "done": true,
          "release_id": 90,
          "commit_id": "a3fb818c7c97a58ff8021949e26f33fcc718ec43",
          "notes": "<p>Airtable and Hubspot could not be tested due to the issue - https://github.com/appsmithorg/appsmith/issues/15253</p>"
        },
        {
          "id": 57,
          "created_at": "2023-01-23T09:18:50.471059+00:00",
          "name": "Release",
          "date": "2023-01-23",
          "roster": [
            {
              "name": "API/cURL/Auth API ",
              "status": true,
              "asignee": "Prapulla"
            },
            {
              "name": "Airtable",
              "status": false,
              "asignee": "Prapulla"
            },
            {
              "name": "Audio",
              "status": true,
              "asignee": "Anandi"
            },
            {
              "name": "Audio Recorder widget",
              "status": true,
              "asignee": "Richa"
            },
            {
              "name": "Button Group Widget",
              "status": true,
              "asignee": "Shadab"
            },
            {
              "name": "Camera",
              "status": true,
              "asignee": "Anand"
            },
            {
              "name": "Checkbox Group",
              "status": true,
              "asignee": "Aparna"
            },
            {
              "name": "Code Scanner",
              "status": true,
              "asignee": "Kamakshi"
            },
            {
              "name": "Currency Input",
              "status": false,
              "asignee": "Chandan"
            },
            {
              "name": "Divider widget",
              "status": true,
              "asignee": "Laveena"
            },
            {
              "name": "Document Viewer",
              "status": false,
              "asignee": "Chandan"
            },
            {
              "name": "Editor",
              "status": true,
              "asignee": "Saptami"
            },
            {
              "name": "FilePicker",
              "status": true,
              "asignee": "Kamakshi"
            },
            {
              "name": "Git + Git import",
              "status": false,
              "asignee": "Parthvi"
            },
            {
              "name": "GoogleSheets",
              "status": true,
              "asignee": "Raksha"
            },
            {
              "name": "GraphQL",
              "status": true,
              "asignee": "Prapulla"
            },
            {
              "name": "Homepage Profile [Forking App with pages, widgets and datasources/Sharing App /Duplicate App]",
              "status": false,
              "asignee": "Sripriya"
            },
            {
              "name": "HubSpot",
              "status": false,
              "asignee": "Prapulla"
            },
            {
              "name": "Icon widget",
              "status": true,
              "asignee": "Richa"
            },
            {
              "name": "Image Widget",
              "status": true,
              "asignee": "Richa"
            },
            {
              "name": "Input",
              "status": true,
              "asignee": "Laveena"
            },
            {
              "name": "JSON Form",
              "status": false,
              "asignee": "Chandan"
            },
            {
              "name": "List",
              "status": true,
              "asignee": "Shadab"
            },
            {
              "name": "Menu Widget",
              "status": true,
              "asignee": "Richa"
            },
            {
              "name": "MongoDB",
              "status": true,
              "asignee": "Anand"
            },
            {
              "name": "Multi Select widget",
              "status": true,
              "asignee": "Shadab"
            },
            {
              "name": "Multi Tree Select widget",
              "status": false,
              "asignee": "Sripriya"
            },
            {
              "name": "MySQL",
              "status": true,
              "asignee": "Raksha"
            },
            {
              "name": "OAuth with Dropbox",
              "status": true,
              "asignee": "Aparna"
            },
            {
              "name": "Older Apps Testing",
              "status": false,
              "asignee": "All"
            },
            {
              "name": "Omnibar Navigation",
              "status": true,
              "asignee": "Saptami"
            },
            {
              "name": "Page Setting ",
              "status": true,
              "asignee": "Anandi"
            },
            {
              "name": "Phone Input",
              "status": false,
              "asignee": "Shwetha"
            },
            {
              "name": "PostgreSQL",
              "status": true,
              "asignee": "Anand"
            },
            {
              "name": "Progress",
              "status": true,
              "asignee": "Laveena"
            },
            {
              "name": "Rating Widget",
              "status": false,
              "asignee": "Shwetha"
            },
            {
              "name": "Reflow",
              "status": true,
              "asignee": "Laveena"
            },
            {
              "name": "Rich Text Editor Widge",
              "status": false,
              "asignee": "Shwetha"
            },
            {
              "name": "S3",
              "status": true,
              "asignee": "Prapulla"
            },
            {
              "name": "SMTP",
              "status": true,
              "asignee": "Raksha"
            },
            {
              "name": "SSO (CE+EE)",
              "status": true,
              "asignee": "Aparna"
            },
            {
              "name": "Select widget",
              "status": false,
              "asignee": "Chandan"
            },
            {
              "name": "Signup/Signin",
              "status": false,
              "asignee": "Sripriya"
            },
            {
              "name": "Slider",
              "status": false,
              "asignee": "Sripriya"
            },
            {
              "name": "Snowflake",
              "status": true,
              "asignee": "Anand"
            },
            {
              "name": "Stat box",
              "status": false,
              "asignee": "Shwetha"
            },
            {
              "name": "Switch group ",
              "status": true,
              "asignee": "Shadab"
            },
            {
              "name": "Tab Widget ",
              "status": true,
              "asignee": "Kamakshi"
            },
            {
              "name": "Table Widget",
              "status": true,
              "asignee": "Kamakshi"
            },
            {
              "name": "Templates",
              "status": true,
              "asignee": "Richa"
            },
            {
              "name": "Text Widget",
              "status": true,
              "asignee": "Anandi"
            },
            {
              "name": "Theming",
              "status": true,
              "asignee": "Anandi"
            },
            {
              "name": "Tree Select widget",
              "status": true,
              "asignee": "Anandi"
            },
            {
              "name": "Trigger fields",
              "status": true,
              "asignee": "Saptami"
            },
            {
              "name": "UX/UI Issues",
              "status": true,
              "asignee": "Saptami"
            },
            {
              "name": "Upgrade Testing - SSO",
              "status": true,
              "asignee": "Raksha"
            },
            {
              "name": "iFrame Widget ",
              "status": true,
              "asignee": "Laveena"
            }
          ],
          "done": true,
          "release_id": 85,
          "commit_id": "b02d227505194388ceb465f340bd172fc21b9745",
          "notes": ""
        },
        {
          "id": 60,
          "created_at": "2023-02-21T11:07:02.649193+00:00",
          "name": "Release",
          "date": "2023-02-21",
          "roster": [
            {
              "name": "API/cURL/Auth API ",
              "status": true,
              "asignee": "Prapulla"
            },
            {
              "name": "Airtable",
              "status": true,
              "asignee": "Prapulla"
            },
            {
              "name": "ArangoDB",
              "status": true,
              "asignee": "Anand"
            },
            {
              "name": "Audio",
              "status": true,
              "asignee": "Anandi"
            },
            {
              "name": "Audio Recorder widget",
              "status": true,
              "asignee": "Richa"
            },
            {
              "name": "Button Group Widget",
              "status": true,
              "asignee": "Shadab"
            },
            {
              "name": "Camera",
              "status": true,
              "asignee": "Kamakshi"
            },
            {
              "name": "Checkbox Group",
              "status": false,
              "asignee": "Sripriya"
            },
            {
              "name": "Code Scanner",
              "status": true,
              "asignee": "Kamakshi"
            },
            {
              "name": "Currency Input",
              "status": false,
              "asignee": "Chandan"
            },
            {
              "name": "Divider widget",
              "status": true,
              "asignee": "Laveena"
            },
            {
              "name": "Document Viewer",
              "status": false,
              "asignee": "Chandan"
            },
            {
              "name": "Editor",
              "status": true,
              "asignee": "Saptami"
            },
            {
              "name": "FilePicker",
              "status": true,
              "asignee": "Kamakshi"
            },
            {
              "name": "Firestore DS",
              "status": true,
              "asignee": "Aparna"
            },
            {
              "name": "Git + Git import",
              "status": true,
              "asignee": "Raksha"
            },
            {
              "name": "GoogleSheets",
              "status": true,
              "asignee": "Prapulla"
            },
            {
              "name": "GraphQL",
              "status": true,
              "asignee": "Prapulla"
            },
            {
              "name": "Homepage Profile [Forking App with pages, widgets and datasources/Sharing App /Duplicate App]",
              "status": false,
              "asignee": "Sripriya"
            },
            {
              "name": "HubSpot",
              "status": false,
              "asignee": "Prapulla"
            },
            {
              "name": "Icon widget",
              "status": true,
              "asignee": "Richa"
            },
            {
              "name": "Image Widget",
              "status": true,
              "asignee": "Richa"
            },
            {
              "name": "Input",
              "status": true,
              "asignee": "Laveena"
            },
            {
              "name": "JSON Form",
              "status": false,
              "asignee": "Chandan"
            },
            {
              "name": "List",
              "status": true,
              "asignee": "Shadab"
            },
            {
              "name": "Menu Widget",
              "status": false,
              "asignee": "Richa"
            },
            {
              "name": "MongoDB",
              "status": true,
              "asignee": "Anand"
            },
            {
              "name": "Multi Select widget",
              "status": true,
              "asignee": "Shadab"
            },
            {
              "name": "Multi Tree Select widget",
              "status": false,
              "asignee": "Sripriya"
            },
            {
              "name": "MySQL",
              "status": true,
              "asignee": "Raksha"
            },
            {
              "name": "OAuth with Dropbox",
              "status": true,
              "asignee": "Aparna"
            },
            {
              "name": "Older Apps Testing",
              "status": false,
              "asignee": "All"
            },
            {
              "name": "Omnibar Navigation",
              "status": true,
              "asignee": "Saptami"
            },
            {
              "name": "Page Setting ",
              "status": false,
              "asignee": "Anandi"
            },
            {
              "name": "Phone Input",
              "status": false,
              "asignee": "Shwetha"
            },
            {
              "name": "PostgreSQL",
              "status": true,
              "asignee": "Anand"
            },
            {
              "name": "Progress",
              "status": true,
              "asignee": "Laveena"
            },
            {
              "name": "Rating Widget",
              "status": false,
              "asignee": "Shwetha"
            },
            {
              "name": "Reflow",
              "status": true,
              "asignee": "Laveena"
            },
            {
              "name": "Rich Text Editor Widge",
              "status": false,
              "asignee": "Shwetha"
            },
            {
              "name": "S3",
              "status": true,
              "asignee": "Anand"
            },
            {
              "name": "SMTP",
              "status": true,
              "asignee": "Raksha"
            },
            {
              "name": "SSO (CE+EE)",
              "status": true,
              "asignee": "Aparna"
            },
            {
              "name": "Select widget",
              "status": false,
              "asignee": "Chandan"
            },
            {
              "name": "Signup/Signin",
              "status": false,
              "asignee": "Sripriya"
            },
            {
              "name": "Slider",
              "status": false,
              "asignee": "Sripriya"
            },
            {
              "name": "Snowflake",
              "status": true,
              "asignee": "Aparna"
            },
            {
              "name": "Stat box",
              "status": false,
              "asignee": "Shwetha"
            },
            {
              "name": "Switch group ",
              "status": true,
              "asignee": "Shadab"
            },
            {
              "name": "Tab Widget ",
              "status": true,
              "asignee": "Shadab"
            },
            {
              "name": "Table Widget",
              "status": false,
              "asignee": "Kamakshi"
            },
            {
              "name": "Templates",
              "status": false,
              "asignee": "Richa"
            },
            {
              "name": "Text Widget",
              "status": true,
              "asignee": "Anandi"
            },
            {
              "name": "Theming",
              "status": true,
              "asignee": "Anandi"
            },
            {
              "name": "Tree Select widget",
              "status": true,
              "asignee": "Anandi"
            },
            {
              "name": "Trigger fields",
              "status": true,
              "asignee": "Saptami"
            },
            {
              "name": "UX/UI Issues",
              "status": true,
              "asignee": "Saptami"
            },
            {
              "name": "Upgrade Testing - SSO",
              "status": true,
              "asignee": "Raksha"
            },
            {
              "name": "Vulnerability check",
              "status": true,
              "asignee": "Raksha"
            },
            {
              "name": "iFrame Widget ",
              "status": true,
              "asignee": "Laveena"
            }
          ],
          "done": true,
          "release_id": 91,
          "commit_id": "bea69fa1d0e9f1283a79c35ddfaea9dc40ca511d",
          "notes": "<p>***We ran the vulnerability check this release and a <strong>release blocker </strong>was logged for the same for the critical issues found in this check - <strong>https://github.com/appsmithorg/appsmith-ee/issues/1116***</strong></p>"
        },
        {
          "id": 64,
          "created_at": "2023-03-14T05:47:46.263321+00:00",
          "name": "Regression",
          "date": "2023-03-14",
          "roster": [
            {
              "name": "API/cURL/Auth API ",
              "status": false,
              "asignee": "Prapulla"
            },
            {
              "name": "Action Selector",
              "status": true,
              "asignee": "Anandi"
            },
            {
              "name": "Airtable",
              "status": false,
              "asignee": "Prapulla"
            },
            {
              "name": "ArangoDB",
              "status": true,
              "asignee": "Aparna"
            },
            {
              "name": "Audio",
              "status": true,
              "asignee": "Anandi"
            },
            {
              "name": "Audio Recorder widget",
              "status": true,
              "asignee": "Richa"
            },
            {
              "name": "Billing and Usage Testing",
              "status": true,
              "asignee": "Raksha"
            },
            {
              "name": "Button Group Widget",
              "status": true,
              "asignee": "Shadab"
            },
            {
              "name": "Camera",
              "status": true,
              "asignee": "Richa"
            },
            {
              "name": "Checkbox Group",
              "status": true,
              "asignee": "Shwetha"
            },
            {
              "name": "Code Scanner",
              "status": false,
              "asignee": "Kamakshi"
            },
            {
              "name": "Currency Input",
              "status": true,
              "asignee": "Shadab"
            },
            {
              "name": "Divider widget",
              "status": true,
              "asignee": "Laveena"
            },
            {
              "name": "Document Viewer",
              "status": true,
              "asignee": "Shwetha"
            },
            {
              "name": "Editor",
              "status": true,
              "asignee": "Shwetha"
            },
            {
              "name": "FilePicker",
              "status": true,
              "asignee": "Kamakshi"
            },
            {
              "name": "Firestore DS",
              "status": true,
              "asignee": "Aparna"
            },
            {
              "name": "Framework Functions",
              "status": false,
              "asignee": "Anandi"
            },
            {
              "name": "Git + Git import",
              "status": true,
              "asignee": "Raksha"
            },
            {
              "name": "GoogleSheets",
              "status": true,
              "asignee": "Saptami"
            },
            {
              "name": "GraphQL",
              "status": false,
              "asignee": "Prapulla"
            },
            {
              "name": "Homepage Profile [Forking App with pages, widgets and datasources/Sharing App /Duplicate App]",
              "status": true,
              "asignee": "Laveena"
            },
            {
              "name": "HubSpot",
              "status": false,
              "asignee": "Prapulla"
            },
            {
              "name": "Icon widget",
              "status": true,
              "asignee": "Richa"
            },
            {
              "name": "Image Widget",
              "status": true,
              "asignee": "Richa"
            },
            {
              "name": "Input",
              "status": true,
              "asignee": "Laveena"
            },
            {
              "name": "JSON Form",
              "status": false,
              "asignee": "Kamakshi"
            },
            {
              "name": "List",
              "status": true,
              "asignee": "Shadab"
            },
            {
              "name": "Menu Widget",
              "status": true,
              "asignee": "Richa"
            },
            {
              "name": "MongoDB",
              "status": false,
              "asignee": "Prapulla"
            },
            {
              "name": "Multi Select widget",
              "status": true,
              "asignee": "Shadab"
            },
            {
              "name": "Multi Tree Select widget",
              "status": false,
              "asignee": "Sripriya"
            },
            {
              "name": "MySQL",
              "status": false,
              "asignee": "Prapulla"
            },
            {
              "name": "OAuth with Dropbox",
              "status": true,
              "asignee": "Aparna"
            },
            {
              "name": "Older Apps Testing",
              "status": false,
              "asignee": "All"
            },
            {
              "name": "Omnibar Navigation",
              "status": true,
              "asignee": "Richa"
            },
            {
              "name": "Page Setting ",
              "status": true,
              "asignee": "Anandi"
            },
            {
              "name": "Phone Input",
              "status": true,
              "asignee": "Shwetha"
            },
            {
              "name": "PostgreSQL",
              "status": false,
              "asignee": "Prapulla"
            },
            {
              "name": "Progress",
              "status": true,
              "asignee": "Shwetha"
            },
            {
              "name": "Rating Widget",
              "status": true,
              "asignee": "Laveena"
            },
            {
              "name": "Reflow",
              "status": true,
              "asignee": "Laveena"
            },
            {
              "name": "Rich Text Editor Widge",
              "status": true,
              "asignee": "Shwetha"
            },
            {
              "name": "S3",
              "status": true,
              "asignee": "Aparna"
            },
            {
              "name": "SMTP",
              "status": true,
              "asignee": "Raksha"
            },
            {
              "name": "SSO (CE+EE)",
              "status": true,
              "asignee": "Aparna"
            },
            {
              "name": "SSO with other Deployment Scenarios",
              "status": true,
              "asignee": "Raksha"
            },
            {
              "name": "Select widget",
              "status": true,
              "asignee": "Saptami"
            },
            {
              "name": "Signup/Signin",
              "status": true,
              "asignee": "Saptami"
            },
            {
              "name": "Slider",
              "status": false,
              "asignee": "Sripriya"
            },
            {
              "name": "Snowflake",
              "status": true,
              "asignee": "Aparna"
            },
            {
              "name": "Stat box",
              "status": true,
              "asignee": "Shwetha"
            },
            {
              "name": "Switch group ",
              "status": true,
              "asignee": "Shadab"
            },
            {
              "name": "Tab Widget ",
              "status": true,
              "asignee": "Shadab"
            },
            {
              "name": "Table Widget",
              "status": true,
              "asignee": "Kamakshi"
            },
            {
              "name": "Templates",
              "status": true,
              "asignee": "Richa"
            },
            {
              "name": "Text Widget",
              "status": true,
              "asignee": "Saptami"
            },
            {
              "name": "Theming",
              "status": true,
              "asignee": "Anandi"
            },
            {
              "name": "Tree Select widget",
              "status": true,
              "asignee": "Anandi"
            },
            {
              "name": "UX/UI Issues",
              "status": false,
              "asignee": "Kamakshi"
            },
            {
              "name": "Upgrade Testing - FE/NDX/Git",
              "status": false,
              "asignee": "Saptami"
            },
            {
              "name": "Upgrade Testing - Platform/Integration",
              "status": false,
              "asignee": "Aparna"
            },
            {
              "name": "Upgrade Testing - SSO",
              "status": true,
              "asignee": "Raksha"
            },
            {
              "name": "Upgrade Testing - UI/AppViewers/Mobile/Design",
              "status": false,
              "asignee": "Kamakshi"
            },
            {
              "name": "Vulnerability check",
              "status": false,
              "asignee": "Raksha"
            },
            {
              "name": "iFrame Widget ",
              "status": true,
              "asignee": "Laveena"
            },
            {
              "name": "Page level actions",
              "status": false,
              "asignee": "Sripriya"
            }
          ],
          "done": true,
          "release_id": null,
          "commit_id": "ed2f51e929607736db26029495eb2deccc00fb57",
          "notes": ""
        },
        {
          "id": 65,
          "created_at": "2023-03-23T05:08:03.977487+00:00",
          "name": "Regression",
          "date": "2023-03-23",
          "roster": [
            {
              "name": "API/cURL/Auth API ",
              "status": true,
              "asignee": "Saptami"
            },
            {
              "name": "Action Selector",
              "status": true,
              "asignee": "Shwetha"
            },
            {
              "name": "Airtable",
              "status": true,
              "asignee": "Prapulla"
            },
            {
              "name": "App level actions [Forking App with pages, widgets + datasources + JS objects/Sharing App /Duplicate App]",
              "status": true,
              "asignee": "Laveena"
            },
            {
              "name": "ArangoDB",
              "status": false,
              "asignee": "Sripriya"
            },
            {
              "name": "Audio",
              "status": false,
              "asignee": "Chandan"
            },
            {
              "name": "Audio Recorder widget",
              "status": true,
              "asignee": "Saptami"
            },
            {
              "name": "Billing and Usage Testing",
              "status": true,
              "asignee": "Parthvi"
            },
            {
              "name": "Button Group Widget",
              "status": true,
              "asignee": "Shadab"
            },
            {
              "name": "Camera",
              "status": true,
              "asignee": "Richa"
            },
            {
              "name": "Checkbox Group",
              "status": true,
              "asignee": "Shwetha"
            },
            {
              "name": "Code Scanner",
              "status": false,
              "asignee": "Sripriya"
            },
            {
              "name": "Currency Input",
              "status": true,
              "asignee": "Shadab"
            },
            {
              "name": "Divider widget",
              "status": true,
              "asignee": "Laveena"
            },
            {
              "name": "Document Viewer",
              "status": true,
              "asignee": "Chandan"
            },
            {
              "name": "Editor",
              "status": true,
              "asignee": "Shwetha"
            },
            {
              "name": "FilePicker",
              "status": true,
              "asignee": "Kamakshi"
            },
            {
              "name": "Firestore DS",
              "status": true,
              "asignee": "Saptami"
            },
            {
              "name": "Framework Functions",
              "status": false,
              "asignee": "Anandi"
            },
            {
              "name": "Git + Git import",
              "status": true,
              "asignee": "Parthvi"
            },
            {
              "name": "GoogleSheets",
              "status": true,
              "asignee": "Prapulla"
            },
            {
              "name": "GraphQL",
              "status": true,
              "asignee": "Prapulla"
            },
            {
              "name": "HubSpot",
              "status": true,
              "asignee": "Prapulla"
            },
            {
              "name": "Icon widget",
              "status": true,
              "asignee": "Richa"
            },
            {
              "name": "Image Widget",
              "status": false,
              "asignee": "Sripriya"
            },
            {
              "name": "Input",
              "status": true,
              "asignee": "Laveena"
            },
            {
              "name": "JSON Form",
              "status": true,
              "asignee": "Kamakshi"
            },
            {
              "name": "List",
              "status": true,
              "asignee": "Shadab"
            },
            {
              "name": "Menu Widget",
              "status": true,
              "asignee": "Richa"
            },
            {
              "name": "MongoDB",
              "status": true,
              "asignee": "Prapulla"
            },
            {
              "name": "Multi Select widget",
              "status": true,
              "asignee": "Shadab"
            },
            {
              "name": "Multi Tree Select widget",
              "status": false,
              "asignee": "Sripriya"
            },
            {
              "name": "MySQL",
              "status": true,
              "asignee": "Prapulla"
            },
            {
              "name": "OAuth with Dropbox",
              "status": false,
              "asignee": "Anandi"
            },
            {
              "name": "Older Apps Testing",
              "status": false,
              "asignee": "All"
            },
            {
              "name": "Omnibar Navigation",
              "status": true,
              "asignee": "Richa"
            },
            {
              "name": "Page Setting ",
              "status": true,
              "asignee": "Anandi"
            },
            {
              "name": "Page level actions",
              "status": false,
              "asignee": "Sripriya"
            },
            {
              "name": "Phone Input",
              "status": true,
              "asignee": "Richa"
            },
            {
              "name": "PostgreSQL",
              "status": true,
              "asignee": "Saptami"
            },
            {
              "name": "Progress",
              "status": true,
              "asignee": "Shwetha"
            },
            {
              "name": "Rating Widget",
              "status": true,
              "asignee": "Laveena"
            },
            {
              "name": "Reflow",
              "status": true,
              "asignee": "Laveena"
            },
            {
              "name": "Rich Text Editor Widge",
              "status": true,
              "asignee": "Shwetha"
            },
            {
              "name": "S3",
              "status": true,
              "asignee": "Laveena"
            },
            {
              "name": "SMTP",
              "status": true,
              "asignee": "Prapulla"
            },
            {
              "name": "SSO (CE+EE)",
              "status": false,
              "asignee": "Kamakshi"
            },
            {
              "name": "SSO with other Deployment Scenarios",
              "status": false,
              "asignee": "Prapulla"
            },
            {
              "name": "Select widget",
              "status": false,
              "asignee": "Chandan"
            },
            {
              "name": "Signup/Signin",
              "status": false,
              "asignee": "Chandan"
            },
            {
              "name": "Slider",
              "status": false,
              "asignee": "Sripriya"
            },
            {
              "name": "Snowflake",
              "status": true,
              "asignee": "Shadab"
            },
            {
              "name": "Stat box",
              "status": true,
              "asignee": "Shwetha"
            },
            {
              "name": "Switch group ",
              "status": true,
              "asignee": "Shadab"
            },
            {
              "name": "Tab Widget ",
              "status": true,
              "asignee": "Shadab"
            },
            {
              "name": "Table Widget",
              "status": true,
              "asignee": "Kamakshi"
            },
            {
              "name": "Templates",
              "status": true,
              "asignee": "Richa"
            },
            {
              "name": "Text Widget",
              "status": false,
              "asignee": "Chandan"
            },
            {
              "name": "Theming",
              "status": false,
              "asignee": "Anandi"
            },
            {
              "name": "Tree Select widget",
              "status": false,
              "asignee": "Chandan"
            },
            {
              "name": "UX/UI Issues",
              "status": false,
              "asignee": "Kamakshi"
            },
            {
              "name": "Upgrade Testing - FE/NDX/Git",
              "status": true,
              "asignee": "Saptami"
            },
            {
              "name": "Upgrade Testing - Platform/Integration",
              "status": false,
              "asignee": ""
            },
            {
              "name": "Upgrade Testing - SSO",
              "status": false,
              "asignee": ""
            },
            {
              "name": "Upgrade Testing - UI/AppViewers/Mobile/Design",
              "status": false,
              "asignee": "Kamakshi"
            },
            {
              "name": "Vulnerability check",
              "status": false,
              "asignee": ""
            },
            {
              "name": "iFrame Widget ",
              "status": true,
              "asignee": "Laveena"
            },
            {
              "name": "New feature Test",
              "status": false,
              "asignee": "Anandi"
            }
          ],
          "done": true,
          "release_id": null,
          "commit_id": "4d4a05c103eaec49a97ba8c2d9b1c5a4034f4b6e",
          "notes": ""
        },
        {
          "id": 67,
          "created_at": "2023-03-27T05:55:26.907965+00:00",
          "name": "Release",
          "date": "2023-03-27",
          "roster": [
            {
              "name": "API/cURL/Auth API ",
              "status": true,
              "asignee": "Prapulla",
              "complexity": ""
            },
            {
              "name": "Action Selector",
              "status": true,
              "asignee": "Shwetha",
              "complexity": ""
            },
            {
              "name": "Airtable",
              "status": true,
              "asignee": "Prapulla",
              "complexity": ""
            },
            {
              "name": "App level actions [Forking App with pages, widgets + datasources + JS objects/Sharing App /Duplicate App]",
              "status": true,
              "asignee": "Laveena",
              "complexity": ""
            },
            {
              "name": "ArangoDB",
              "status": false,
              "asignee": "Sripriya",
              "complexity": ""
            },
            {
              "name": "Audio",
              "status": true,
              "asignee": "Chandan",
              "complexity": ""
            },
            {
              "name": "Audio Recorder widget",
              "status": true,
              "asignee": "Richa",
              "complexity": ""
            },
            {
              "name": "Billing and Usage Testing",
              "status": false,
              "asignee": "Raksha",
              "complexity": ""
            },
            {
              "name": "Button Group Widget",
              "status": true,
              "asignee": "Shadab",
              "complexity": ""
            },
            {
              "name": "Camera",
              "status": true,
              "asignee": "Richa",
              "complexity": ""
            },
            {
              "name": "Checkbox Group",
              "status": true,
              "asignee": "Shwetha",
              "complexity": ""
            },
            {
              "name": "Code Scanner",
              "status": false,
              "asignee": "Sripriya",
              "complexity": ""
            },
            {
              "name": "Currency Input",
              "status": true,
              "asignee": "Shadab",
              "complexity": ""
            },
            {
              "name": "Divider widget",
              "status": true,
              "asignee": "Laveena",
              "complexity": ""
            },
            {
              "name": "Document Viewer",
              "status": true,
              "asignee": "Chandan",
              "complexity": ""
            },
            {
              "name": "Editor",
              "status": true,
              "asignee": "Shwetha",
              "complexity": ""
            },
            {
              "name": "FilePicker",
              "status": true,
              "asignee": "Kamakshi",
              "complexity": ""
            },
            {
              "name": "Firestore DS",
              "status": true,
              "asignee": "Saptami",
              "complexity": ""
            },
            {
              "name": "Framework Functions",
              "status": true,
              "asignee": "Anandi",
              "complexity": ""
            },
            {
              "name": "Git + Git import",
              "status": true,
              "asignee": "Raksha",
              "complexity": ""
            },
            {
              "name": "GoogleSheets",
              "status": false,
              "asignee": "Chandan",
              "complexity": ""
            },
            {
              "name": "GraphQL",
              "status": true,
              "asignee": "Prapulla",
              "complexity": ""
            },
            {
              "name": "HubSpot",
              "status": true,
              "asignee": "Prapulla",
              "complexity": ""
            },
            {
              "name": "Icon widget",
              "status": true,
              "asignee": "Richa",
              "complexity": ""
            },
            {
              "name": "Image Widget",
              "status": false,
              "asignee": "Sripriya",
              "complexity": ""
            },
            {
              "name": "Input",
              "status": true,
              "asignee": "Laveena",
              "complexity": ""
            },
            {
              "name": "JSON Form",
              "status": true,
              "asignee": "Kamakshi",
              "complexity": ""
            },
            {
              "name": "List",
              "status": true,
              "asignee": "Shadab",
              "complexity": ""
            },
            {
              "name": "Menu Widget",
              "status": true,
              "asignee": "Richa",
              "complexity": ""
            },
            {
              "name": "MongoDB",
              "status": false,
              "asignee": "Prapulla",
              "complexity": ""
            },
            {
              "name": "Multi Select widget",
              "status": true,
              "asignee": "Shadab",
              "complexity": ""
            },
            {
              "name": "Multi Tree Select widget",
              "status": false,
              "asignee": "Sripriya",
              "complexity": ""
            },
            {
              "name": "MySQL",
              "status": true,
              "asignee": "Aparna",
              "complexity": ""
            },
            {
              "name": "OAuth with Dropbox",
              "status": true,
              "asignee": "Anandi",
              "complexity": ""
            },
            {
              "name": "Older Apps Testing",
              "status": false,
              "asignee": "All",
              "complexity": "High"
            },
            {
              "name": "Omnibar Navigation",
              "status": true,
              "asignee": "Anandi",
              "complexity": ""
            },
            {
              "name": "Page Setting ",
              "status": true,
              "asignee": "Anandi",
              "complexity": ""
            },
            {
              "name": "Page level actions",
              "status": false,
              "asignee": "Sripriya",
              "complexity": ""
            },
            {
              "name": "Phone Input",
              "status": true,
              "asignee": "Richa",
              "complexity": ""
            },
            {
              "name": "PostgreSQL",
              "status": false,
              "asignee": "Prapulla",
              "complexity": ""
            },
            {
              "name": "Progress",
              "status": true,
              "asignee": "Shwetha",
              "complexity": ""
            },
            {
              "name": "Rating Widget",
              "status": true,
              "asignee": "Laveena",
              "complexity": ""
            },
            {
              "name": "Reflow",
              "status": true,
              "asignee": "Laveena",
              "complexity": ""
            },
            {
              "name": "Rich Text Editor Widge",
              "status": true,
              "asignee": "Shwetha",
              "complexity": ""
            },
            {
              "name": "S3",
              "status": true,
              "asignee": "Aparna",
              "complexity": ""
            },
            {
              "name": "SMTP",
              "status": true,
              "asignee": "Aparna",
              "complexity": ""
            },
            {
              "name": "SSO (CE+EE)",
              "status": false,
              "asignee": "Aparna",
              "complexity": ""
            },
            {
              "name": "SSO with other Deployment Scenarios",
              "status": true,
              "asignee": "Raksha",
              "complexity": ""
            },
            {
              "name": "Select widget",
              "status": true,
              "asignee": "Anandi",
              "complexity": ""
            },
            {
              "name": "Signup/Signin",
              "status": true,
              "asignee": "Saptami",
              "complexity": ""
            },
            {
              "name": "Slider",
              "status": false,
              "asignee": "Sripriya",
              "complexity": ""
            },
            {
              "name": "Snowflake",
              "status": true,
              "asignee": "Aparna",
              "complexity": ""
            },
            {
              "name": "Stat box",
              "status": true,
              "asignee": "Shwetha",
              "complexity": ""
            },
            {
              "name": "Switch group ",
              "status": true,
              "asignee": "Shadab",
              "complexity": ""
            },
            {
              "name": "Tab Widget ",
              "status": true,
              "asignee": "Shadab",
              "complexity": ""
            },
            {
              "name": "Table Widget",
              "status": true,
              "asignee": "Kamakshi",
              "complexity": ""
            },
            {
              "name": "Templates",
              "status": true,
              "asignee": "Richa",
              "complexity": ""
            },
            {
              "name": "Text Widget",
              "status": true,
              "asignee": "Chandan",
              "complexity": ""
            },
            {
              "name": "Theming",
              "status": true,
              "asignee": "Anandi",
              "complexity": ""
            },
            {
              "name": "Tree Select widget",
              "status": false,
              "asignee": "Chandan",
              "complexity": ""
            },
            {
              "name": "UX/UI Issues",
              "status": false,
              "asignee": "Kamakshi",
              "complexity": ""
            },
            {
              "name": "Upgrade Testing - FE/NDX/Git",
              "status": true,
              "asignee": "Saptami",
              "complexity": ""
            },
            {
              "name": "Upgrade Testing - Platform/Integration",
              "status": false,
              "asignee": "Aparna",
              "complexity": ""
            },
            {
              "name": "Upgrade Testing - SSO",
              "status": true,
              "asignee": "Raksha",
              "complexity": ""
            },
            {
              "name": "Upgrade Testing - UI/AppViewers/Mobile/Design",
              "status": false,
              "asignee": "Kamakshi",
              "complexity": ""
            },
            {
              "name": "Vulnerability check",
              "status": true,
              "asignee": "Raksha",
              "complexity": ""
            },
            {
              "name": "iFrame Widget ",
              "status": true,
              "asignee": "Laveena",
              "complexity": ""
            }
          ],
          "done": true,
          "release_id": 97,
          "commit_id": "18b82667a259f9dbee4e0e577aeb5ffbb508fe3a",
          "notes": ""
        }
      ]`,
    );
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.TABLE);
    propPane.EnterJSContext("Table data", `{{Api1.data.body}}`);
    agHelper.RefreshPage();
    cy.wait(500);
    // Make sure onPageLoad action has run before validating the data
    cy.wait("@postExecute");
    cy.wait(2000);
    table.AssertTableLoaded();

    //Works in the published version"
    deployMode.DeployApp();
    cy.wait(500);
    // Make sure onPageLoad action has run before validating the data
    cy.wait("@postExecute");
    cy.wait(2000);
    table.AssertTableLoaded();
  });
});
