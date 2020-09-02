#!/bin/bash

set -o nounset

mongo_root_user="$1"
mongo_root_password="$2"

cat << EOF
let error = false
print("**** Going to start Mongo seed ****")

let res = [
    db.createUser(
        {
            user: "$mongo_root_user",
            pwd: "$mongo_root_password",
            roles: [{
                role: "readAnyDatabase",
                db: "admin"
            }, "readWrite"]
        }
    ),

    db.group.insert({
        "_id" : ObjectId("5df8c225078d501fc3f45361"),
        "name" : "Admin",
        "displayName" : "Admin",
        "organizationId" : "default-org",
        "permissions" : [ 
            "read:groups", 
            "read:organizations", 
            "create:users", 
            "update:users", 
            "create:groups", 
            "create:organizations", 
            "read:users", 
            "read:pages", 
            "create:pages", 
            "update:pages", 
            "read:layouts", 
            "create:layouts", 
            "update:layouts", 
            "read:properties", 
            "create:properties", 
            "update:properties", 
            "read:actions", 
            "create:actions", 
            "update:actions", 
            "read:resources", 
            "create:resources", 
            "update:resources", 
            "read:plugins", 
            "create:plugins", 
            "delete:actions", 
            "create:collections", 
            "update:collections", 
            "delete:collections", 
            "read:collections", 
            "create:applications", 
            "update:applications", 
            "read:applications", 
            "read:datasources", 
            "create:datasources", 
            "update:datasources", 
            "read:configs", 
            "update:configs", 
            "create:configs", 
            "delete:applications", 
            "create:import", 
            "read:import", 
            "update:import", 
            "create:providers", 
            "read:providers", 
            "update:providers", 
            "read:marketplace", 
            "delete:import", 
            "delete:pages", 
            "create:templates", 
            "update:templates", 
            "read:templates", 
            "read:items", 
            "create:items", 
            "delete:datasources"
        ],
        "isDefault" : false,
        "deleted" : false,
        "_class" : "com.appsmith.server.domains.Group"
    }),


    db.group.insert({
        "_id" : ObjectId("5df8c1fa078d501fc3f44d41"),
        "name" : "Member",
        "displayName" : "Member",
        "organizationId" : "default-org",
        "permissions" : [ 
            "read:groups", 
            "read:organizations", 
            "create:users", 
            "update:users", 
            "create:groups", 
            "create:organizations", 
            "read:users", 
            "read:pages", 
            "create:pages", 
            "update:pages", 
            "read:layouts", 
            "create:layouts", 
            "update:layouts", 
            "read:properties", 
            "create:properties", 
            "update:properties", 
            "read:actions", 
            "create:actions", 
            "update:actions", 
            "read:resources", 
            "create:resources", 
            "update:resources", 
            "read:plugins", 
            "create:plugins", 
            "delete:actions", 
            "create:collections", 
            "update:collections", 
            "delete:collections", 
            "read:collections", 
            "create:applications", 
            "update:applications", 
            "read:applications", 
            "read:datasources", 
            "create:datasources", 
            "update:datasources", 
            "read:configs", 
            "update:configs", 
            "create:configs", 
            "delete:applications", 
            "create:import", 
            "read:import", 
            "update:import", 
            "create:providers", 
            "read:providers", 
            "update:providers", 
            "read:marketplace", 
            "delete:import", 
            "delete:pages", 
            "create:templates", 
            "update:templates", 
            "read:templates", 
            "read:items", 
            "create:items", 
            "delete:datasources"
        ],
        "isDefault" : true,
        "deleted" : false,
        "_class" : "com.appsmith.server.domains.Group"
    }),

    db.group.insert({
        "_id" : ObjectId("5df8c1e0078d501fc3f4491b"),
        "name" : "Owner",
        "displayName" : "Owner",
        "organizationId" : "default-org",
        "permissions" : [ 
            "read:groups", 
            "read:organizations", 
            "create:users", 
            "update:users", 
            "create:groups", 
            "create:organizations", 
            "read:users", 
            "read:pages", 
            "create:pages", 
            "update:pages", 
            "read:layouts", 
            "create:layouts", 
            "update:layouts", 
            "read:properties", 
            "create:properties", 
            "update:properties", 
            "read:actions", 
            "create:actions", 
            "update:actions", 
            "read:resources", 
            "create:resources", 
            "update:resources", 
            "read:plugins", 
            "create:plugins", 
            "delete:actions", 
            "create:collections", 
            "update:collections", 
            "delete:collections", 
            "read:collections", 
            "create:applications", 
            "update:applications", 
            "read:applications", 
            "read:datasources", 
            "create:datasources", 
            "update:datasources", 
            "read:configs", 
            "update:configs", 
            "create:configs", 
            "delete:applications", 
            "create:import", 
            "read:import", 
            "update:import", 
            "create:providers", 
            "read:providers", 
            "update:providers", 
            "read:marketplace", 
            "delete:import", 
            "delete:pages", 
            "create:templates", 
            "update:templates", 
            "read:templates", 
            "read:items", 
            "create:items", 
            "delete:datasources"
        ],
        "isDefault" : false,
        "deleted" : false,
        "_class" : "com.appsmith.server.domains.Group"
    }),

    db.config.insert({
        "config" : {
            "CONTAINER_WIDGET" : [ 
                {
                    "id" : "5.1",
                    "sectionName" : "General",
                    "children" : [ 
                        {
                            "id" : "5.1.1",
                            "helpText" : "Use a html color name, HEX, RGB or RGBA value",
                            "placeholderText" : "#FFFFFF / Gray / rgb(255, 99, 71)",
                            "propertyName" : "backgroundColor",
                            "label" : "Background Color",
                            "validationType" : "HTML_COLOR",
                            "errorMessage" : "Invalid HTML color name, HEX, RGB or RGBA value",
                            "expected" : {
                                "message" : "HTML colors/HEX/RGB/RGBA value",
                                "type" : "string"
                            },
                            "controlType" : "INPUT_TEXT"
                        }, 
                        {
                            "id" : "5.1.2",
                            "helpText" : "Controls the visibility of the widget",
                            "propertyName" : "isVisible",
                            "label" : "Visible",
                            "validationType" : "BOOLEAN",
                            "errorMessage" : "Must be a valid boolean value",
                            "expected" : {
                                "message" : "Value should evaluate to true or false",
                                "type" : "Boolean"
                            },
                            "controlType" : "SWITCH",
                            "isJSConvertible" : true
                        }, 
                        {
                            "id" : "5.1.3",
                            "propertyName" : "shouldScrollContents",
                            "label" : "Scroll Contents",
                            "validationType" : "BOOLEAN",
                            "errorMessage" : "Must be a valid boolean value",
                            "expected" : {
                                "message" : "Value should evaluate to true or false",
                                "type" : "Boolean"
                            },
                            "controlType" : "SWITCH"
                        }
                    ]
                }
            ],
            "DATE_PICKER_WIDGET" : [ 
                {
                    "sectionName" : "General",
                    "id" : "6.1",
                    "children" : [ 
                        {
                            "id" : "6.1.2",
                            "propertyName" : "defaultDate",
                            "label" : "Default Date",
                            "validationType" : "DATE",
                            "helpText" : "Sets the default date of the widget. The date is updated if the default date changes",
                            "errorMessage" : "Must be a valid date",
                            "controlType" : "DATE_PICKER",
                            "placeholderText" : "Enter Default Date",
                            "isJSConvertible" : true
                        }, 
                        {
                            "id" : "6.1.3",
                            "propertyName" : "isRequired",
                            "label" : "Required",
                            "helpText" : "Disables a form submit button when this widget is empty",
                            "validationType" : "BOOLEAN",
                            "errorMessage" : "Must be a valid boolean value",
                            "controlType" : "SWITCH"
                        }, 
                        {
                            "id" : "6.1.4",
                            "propertyName" : "isVisible",
                            "label" : "Visible",
                            "helpText" : "Controls the visibility of the widget",
                            "validationType" : "BOOLEAN",
                            "errorMessage" : "Must be a valid boolean value",
                            "controlType" : "SWITCH"
                        }, 
                        {
                            "id" : "6.1.5",
                            "propertyName" : "isDisabled",
                            "label" : "Disabled",
                            "validationType" : "BOOLEAN",
                            "helpText" : "Disables input to this widget",
                            "errorMessage" : "Must be a valid boolean value",
                            "controlType" : "SWITCH"
                        }
                    ]
                }, 
                {
                    "sectionName" : "Actions",
                    "id" : "6.2",
                    "children" : [ 
                        {
                            "id" : "6.2.1",
                            "propertyName" : "onDateSelected",
                            "label" : "onDateSelected",
                            "controlType" : "ACTION_SELECTOR"
                        }
                    ]
                }
            ],
            "TABLE_WIDGET" : [ 
                {
                    "id" : "7.1",
                    "sectionName" : "General",
                    "children" : [ 
                        {
                            "id" : "7.1.1",
                            "helpText" : "Takes in an array of objects to display rows in the table. Bind data from an API using {{}}",
                            "propertyName" : "tableData",
                            "label" : "Table Data",
                            "controlType" : "INPUT_TEXT",
                            "validationType" : "TABLE_ARRAY",
                            "errorMessage" : "Requires an array of objects",
                            "expected" : {
                                "message" : "An array of objects. Keys are column names",
                                "type" : "Record<string, string>[]"
                            },
                            "placeholderText" : "Enter [{ \"col1\": \"val1\" }]",
                            "inputType" : "ARRAY"
                        }, 
                        {
                            "id" : "7.1.2",
                            "helpText" : "Bind the Table.pageNo property in your API and call it onPageChange",
                            "validationType" : "BOOLEAN",
                            "errorMessage" : "Must be a valid boolean value",
                            "propertyName" : "serverSidePaginationEnabled",
                            "label" : "Server Side Pagination",
                            "controlType" : "SWITCH"
                        }, 
                        {
                            "id" : "7.1.3",
                            "helpText" : "Controls the visibility of the widget",
                            "propertyName" : "isVisible",
                            "validationType" : "BOOLEAN",
                            "errorMessage" : "Must be a valid boolean value",
                            "isJSConvertible" : true,
                            "label" : "Visible",
                            "controlType" : "SWITCH",
                            "expected" : {
                                "message" : "Value should evaluate to true or false",
                                "type" : "Boolean"
                            }
                        }, 
                        {
                            "id" : "7.1.4",
                            "helpText" : "Enable PDF Export",
                            "propertyName" : "exportPDF",
                            "label" : "PDF Export",
                            "controlType" : "SWITCH"
                        }, 
                        {
                            "id" : "7.1.5",
                            "helpText" : "Enable Excel Export",
                            "propertyName" : "exportExcel",
                            "label" : "Excel Export",
                            "controlType" : "SWITCH"
                        }, 
                        {
                            "id" : "7.1.6",
                            "helpText" : "Enable CSV Export",
                            "propertyName" : "exportCsv",
                            "label" : "CSV Export",
                            "controlType" : "SWITCH"
                        }
                    ]
                }, 
                {
                    "id" : "7.2",
                    "sectionName" : "Actions",
                    "children" : [ 
                        {
                            "id" : "7.2.1",
                            "helpText" : "Adds a button action for every row. Reference the Table.selectedRow property in the action",
                            "propertyName" : "columnActions",
                            "label" : "Row Button",
                            "controlType" : "COLUMN_ACTION_SELECTOR"
                        }, 
                        {
                            "id" : "7.2.2",
                            "helpText" : "Triggers an action when a table row is selected",
                            "propertyName" : "onRowSelected",
                            "label" : "onRowSelected",
                            "controlType" : "ACTION_SELECTOR",
                            "isJSConvertible" : true
                        }, 
                        {
                            "id" : "7.2.3",
                            "helpText" : "Triggers an action when a table page is changed",
                            "propertyName" : "onPageChange",
                            "label" : "onPageChange",
                            "controlType" : "ACTION_SELECTOR",
                            "isJSConvertible" : true
                        }
                    ]
                }
            ],
            "IMAGE_WIDGET" : [ 
                {
                    "id" : "3.1",
                    "sectionName" : "General",
                    "children" : [ 
                        {
                            "id" : "3.1.1",
                            "helpText" : "Renders the url or Base64 in the widget",
                            "propertyName" : "image",
                            "label" : "Image",
                            "controlType" : "INPUT_TEXT",
                            "validationType" : "URL_BASE64",
                            "errorMessage" : "Must be a valid url or base64 string",
                            "placeholderText" : "Enter URL / Base64"
                        }, 
                        {
                            "id" : "3.1.2",
                            "helpText" : "Renders the url or Base64 when no image is provided",
                            "propertyName" : "defaultImage",
                            "label" : "Default Image",
                            "controlType" : "INPUT_TEXT",
                            "validationType" : "URL_BASE64",
                            "errorMessage" : "Must be a valid url or base64 string",
                            "placeholderText" : "Enter URL / Base64"
                        }, 
                        {
                            "id" : "3.1.3",
                            "helpText" : "Controls the visibility of the widget",
                            "propertyName" : "isVisible",
                            "validationType" : "BOOLEAN",
                            "errorMessage" : "Must be a valid boolean value",
                            "label" : "Visible",
                            "controlType" : "SWITCH",
                            "isJSConvertible" : true
                        }
                    ]
                }
            ],
            "RADIO_GROUP_WIDGET" : [ 
                {
                    "id" : "10.1",
                    "sectionName" : "General",
                    "children" : [ 
                        {
                            "id" : "10.1.2",
                            "helpText" : "Displays a list of options for a user to select. Values must be unique",
                            "validationType" : "KEY_VAL",
                            "errorMessage" : "Requires an array of objects with label and value fields",
                            "propertyName" : "options",
                            "label" : "Options",
                            "controlType" : "OPTION_INPUT",
                            "isJSConvertible" : true
                        }, 
                        {
                            "id" : "10.1.3",
                            "helpText" : "Selects a value of the options entered by default",
                            "propertyName" : "defaultOptionValue",
                            "label" : "Default Selected Value",
                            "validationType" : "TEXT",
                            "errorMessage" : "Must be a valid string",
                            "placeholderText" : "Enter option value",
                            "controlType" : "INPUT_TEXT"
                        }, 
                        {
                            "id" : "10.1.4",
                            "helpText" : "Disables a form submit button when this widget is empty",
                            "propertyName" : "isRequired",
                            "label" : "Required",
                            "validationType" : "BOOLEAN",
                            "errorMessage" : "Must be a valid boolean value",
                            "controlType" : "SWITCH",
                            "isJSConvertible" : true
                        }, 
                        {
                            "id" : "10.1.5",
                            "helpText" : "Controls the visibility of the widget",
                            "propertyName" : "isVisible",
                            "label" : "Visible",
                            "validationType" : "BOOLEAN",
                            "errorMessage" : "Must be a valid boolean value",
                            "controlType" : "SWITCH",
                            "isJSConvertible" : true
                        }
                    ]
                }, 
                {
                    "id" : "10.2",
                    "sectionName" : "Actions",
                    "children" : [ 
                        {
                            "id" : "10.2.1",
                            "helpText" : "Triggers an action when a user changes the selected option",
                            "propertyName" : "onSelectionChange",
                            "label" : "onSelectionChange",
                            "controlType" : "ACTION_SELECTOR",
                            "isJSConvertible" : true
                        }
                    ]
                }
            ],
            "TABS_WIDGET" : [ 
                {
                    "id" : "16.1",
                    "sectionName" : "General",
                    "children" : [ 
                        {
                            "id" : "16.1.1",
                            "helpText" : "Takes an array of tab names to render tabs",
                            "propertyName" : "tabs",
                            "isJSConvertible" : true,
                            "label" : "Tabs",
                            "controlType" : "TABS_INPUT"
                        }, 
                        {
                            "id" : "16.1.2",
                            "propertyName" : "selectedTab",
                            "helpText" : "Selects a tab name specified by default",
                            "placeholderText" : "Enter tab name",
                            "label" : "Default Tab",
                            "validationType" : "TEXT",
                            "errorMessage" : "Must be a valid string",
                            "controlType" : "INPUT_TEXT"
                        }, 
                        {
                            "id" : "16.1.5",
                            "propertyName" : "shouldScrollContents",
                            "label" : "Scroll Contents",
                            "validationType" : "BOOLEAN",
                            "errorMessage" : "Must be a valid boolean value",
                            "controlType" : "SWITCH"
                        }, 
                        {
                            "id" : "16.1.4",
                            "propertyName" : "isVisible",
                            "label" : "Visible",
                            "helpText" : "Controls the visibility of the widget",
                            "validationType" : "BOOLEAN",
                            "errorMessage" : "Must be a valid boolean value",
                            "controlType" : "SWITCH",
                            "isJSConvertible" : true
                        }
                    ]
                }
            ],
            "CHART_WIDGET" : [ 
                {
                    "id" : "13.1",
                    "sectionName" : "General",
                    "children" : [ 
                        {
                            "id" : "13.1.1",
                            "helpText" : "Adds a title to the chart",
                            "placeholderText" : "Enter title",
                            "propertyName" : "chartName",
                            "label" : "Title",
                            "controlType" : "INPUT_TEXT"
                        }, 
                        {
                            "id" : "13.1.2",
                            "helpText" : "Changes the visualisation of the chart data",
                            "propertyName" : "chartType",
                            "label" : "Chart Type",
                            "controlType" : "DROP_DOWN",
                            "options" : [ 
                                {
                                    "label" : "Line Chart",
                                    "value" : "LINE_CHART"
                                }, 
                                {
                                    "label" : "Bar Chart",
                                    "value" : "BAR_CHART"
                                }, 
                                {
                                    "label" : "Pie Chart",
                                    "value" : "PIE_CHART"
                                }, 
                                {
                                    "label" : "Column Chart",
                                    "value" : "COLUMN_CHART"
                                }, 
                                {
                                    "label" : "Area Chart",
                                    "value" : "AREA_CHART"
                                }
                            ],
                            "isJSConvertible" : true
                        }, 
                        {
                            "id" : "13.1.6",
                            "helpText" : "Populates the chart with the data",
                            "propertyName" : "singleChartData",
                            "placeholderText" : "Enter [{ \"x\": \"val\", \"y\": \"val\" }]",
                            "validationType" : "CHART_ARRAY",
                            "errorMessage" : "Must be an array of x,y",
                            "label" : "Chart Data",
                            "controlType" : "INPUT_TEXT"
                        }, 
                        {
                            "id" : "13.1.3",
                            "helpText" : "Specifies the label of the x-axis",
                            "propertyName" : "xAxisName",
                            "placeholderText" : "Enter label text",
                            "label" : "x-axis Label",
                            "validationType" : "TEXT",
                            "errorMessage" : "Must be a valid string",
                            "controlType" : "INPUT_TEXT"
                        }, 
                        {
                            "id" : "13.1.5",
                            "helpText" : "Specifies the label of the y-axis",
                            "propertyName" : "yAxisName",
                            "placeholderText" : "Enter label text",
                            "label" : "y-axis Label",
                            "controlType" : "INPUT_TEXT"
                        }, 
                        {
                            "id" : "13.1.4",
                            "helpText" : "Enables scrolling inside the chart",
                            "propertyName" : "allowHorizontalScroll",
                            "label" : "Allow horizontal scroll",
                            "controlType" : "SWITCH"
                        }, 
                        {
                            "id" : "13.1.7",
                            "propertyName" : "isVisible",
                            "label" : "Visible",
                            "helpText" : "Controls the visibility of the widget",
                            "validationType" : "BOOLEAN",
                            "errorMessage" : "Must be a valid boolean value",
                            "controlType" : "SWITCH",
                            "isJSConvertible" : true
                        }
                    ]
                }
            ],
            "MODAL_WIDGET" : [ 
                {
                    "sectionName" : "General",
                    "id" : "18.1",
                    "children" : [ 
                        {
                            "id" : "18.1.1",
                            "propertyName" : "canOutsideClickClose",
                            "label" : "Quick Dismiss",
                            "helpText" : "Allows dismissing the modal when user taps outside",
                            "validationType" : "BOOLEAN",
                            "errorMessage" : "Must be a valid boolean value",
                            "controlType" : "SWITCH"
                        }, 
                        {
                            "id" : "18.1.2",
                            "propertyName" : "size",
                            "label" : "Modal Type",
                            "controlType" : "DROP_DOWN",
                            "options" : [ 
                                {
                                    "label" : "Form Modal",
                                    "value" : "MODAL_LARGE"
                                }, 
                                {
                                    "label" : "Alert Modal",
                                    "value" : "MODAL_SMALL"
                                }
                            ]
                        }, 
                        {
                            "id" : "18.1.3",
                            "propertyName" : "shouldScrollContents",
                            "label" : "Scroll Contents",
                            "validationType" : "BOOLEAN",
                            "errorMessage" : "Must be a valid boolean value",
                            "controlType" : "SWITCH"
                        }
                    ]
                }
            ],
            "INPUT_WIDGET" : [ 
                {
                    "id" : "4.1",
                    "sectionName" : "General",
                    "children" : [ 
                        {
                            "id" : "4.1.2",
                            "helpText" : "Changes the type of data captured in the input",
                            "propertyName" : "inputType",
                            "label" : "Data Type",
                            "controlType" : "DROP_DOWN",
                            "options" : [ 
                                {
                                    "label" : "Text",
                                    "value" : "TEXT"
                                }, 
                                {
                                    "label" : "Number",
                                    "value" : "NUMBER"
                                }, 
                                {
                                    "label" : "Password",
                                    "value" : "PASSWORD"
                                }, 
                                {
                                    "label" : "Phone Number",
                                    "value" : "PHONE_NUMBER"
                                }, 
                                {
                                    "label" : "Email",
                                    "value" : "EMAIL"
                                }
                            ]
                        }, 
                        {
                            "id" : "4.1.3",
                            "helpText" : "Sets a placeholder text for the input",
                            "propertyName" : "placeholderText",
                            "label" : "Placeholder",
                            "validationType" : "TEXT",
                            "errorMessage" : "Must be a valid string",
                            "controlType" : "INPUT_TEXT",
                            "placeholderText" : "Enter placeholder text"
                        }, 
                        {
                            "id" : "4.1.4",
                            "helpText" : "Sets the default text of the widget. The text is updated if the default text changes",
                            "propertyName" : "defaultText",
                            "label" : "Default Input",
                            "validationType" : "TEXT",
                            "errorMessage" : "Must be a valid string",
                            "controlType" : "INPUT_TEXT",
                            "placeholderText" : "Enter default text"
                        }, 
                        {
                            "id" : "4.1.5",
                            "helpText" : "Adds a validation to the input which displays an error on failure",
                            "propertyName" : "regex",
                            "label" : "Regex",
                            "validationType" : "REGEX",
                            "errorMessage" : "Must be a valid regex string",
                            "controlType" : "INPUT_TEXT",
                            "placeholderText" : "^\\w+@[a-zA-Z_]+?\\.[a-zA-Z]{2,3}$",
                            "inputType" : "TEXT"
                        }, 
                        {
                            "id" : "4.1.6",
                            "helpText" : "Displays the error message if the regex validation fails",
                            "propertyName" : "errorMessage",
                            "label" : "Error Message",
                            "controlType" : "INPUT_TEXT",
                            "validationType" : "TEXT",
                            "errorMessage" : "Must be a valid string",
                            "placeholderText" : "Enter error message",
                            "inputType" : "TEXT"
                        }, 
                        {
                            "id" : "4.1.7",
                            "propertyName" : "isRequired",
                            "label" : "Required",
                            "validationType" : "BOOLEAN",
                            "errorMessage" : "Must be a valid boolean value",
                            "helpText" : "Disables a form submit button when this widget is empty",
                            "controlType" : "SWITCH",
                            "isJSConvertible" : true
                        }, 
                        {
                            "id" : "4.1.8",
                            "helpText" : "Controls the visibility of the widget",
                            "propertyName" : "isVisible",
                            "label" : "Visible",
                            "validationType" : "BOOLEAN",
                            "errorMessage" : "Must be a valid boolean value",
                            "controlType" : "SWITCH",
                            "isJSConvertible" : true
                        }, 
                        {
                            "id" : "4.1.9",
                            "helpText" : "Disables input to this widget",
                            "propertyName" : "isDisabled",
                            "label" : "Disabled",
                            "validationType" : "BOOLEAN",
                            "errorMessage" : "Must be a valid boolean value",
                            "controlType" : "SWITCH",
                            "isJSConvertible" : true
                        }
                    ]
                }, 
                {
                    "id" : "4.2.1",
                    "sectionName" : "Actions",
                    "children" : [ 
                        {
                            "id" : "5.11.2",
                            "helpText" : "Triggers an action when the text is changed",
                            "propertyName" : "onTextChanged",
                            "label" : "onTextChanged",
                            "controlType" : "ACTION_SELECTOR",
                            "isJSConvertible" : true
                        }
                    ]
                }
            ],
            "DROP_DOWN_WIDGET" : [ 
                {
                    "id" : "8.1",
                    "sectionName" : "General",
                    "children" : [ 
                        {
                            "id" : "8.1.2",
                            "helpText" : "Allows users to select either a single option or multiple options",
                            "propertyName" : "selectionType",
                            "label" : "Selection Type",
                            "controlType" : "DROP_DOWN",
                            "options" : [ 
                                {
                                    "label" : "Single Select",
                                    "value" : "SINGLE_SELECT"
                                }, 
                                {
                                    "label" : "Multi Select",
                                    "value" : "MULTI_SELECT"
                                }
                            ]
                        }, 
                        {
                            "id" : "8.1.3",
                            "helpText" : "Allows users to select either a single option or multiple options. Values must be unique",
                            "propertyName" : "options",
                            "label" : "Options",
                            "validationType" : "KEY_VAL",
                            "errorMessage" : "Requires an array of objects with label and value fields",
                            "controlType" : "INPUT_TEXT",
                            "placeholderText" : "Enter [{label: \"label1\", value: \"value2\"}]"
                        }, 
                        {
                            "id" : "8.1.4",
                            "helpText" : "Selects the option with value by default",
                            "propertyName" : "defaultOptionValue",
                            "label" : "Default Option",
                            "validationType" : "TEXT",
                            "errorMessage" : "Must be a valid string",
                            "controlType" : "INPUT_TEXT",
                            "placeholderText" : "Enter option value"
                        }, 
                        {
                            "id" : "8.1.5",
                            "propertyName" : "isRequired",
                            "label" : "Required",
                            "validationType" : "BOOLEAN",
                            "errorMessage" : "Must be a valid boolean value",
                            "helpText" : "Disables a form submit button when this widget is empty",
                            "controlType" : "SWITCH",
                            "isJSConvertible" : true
                        }, 
                        {
                            "id" : "8.1.6",
                            "helpText" : "Controls the visibility of the widget",
                            "propertyName" : "isVisible",
                            "validationType" : "BOOLEAN",
                            "errorMessage" : "Must be a valid boolean value",
                            "label" : "Visible",
                            "controlType" : "SWITCH",
                            "isJSConvertible" : true
                        }
                    ]
                }, 
                {
                    "id" : "8.2",
                    "sectionName" : "Actions",
                    "children" : [ 
                        {
                            "id" : "8.2.1",
                            "helpText" : "Triggers an action when a user selects an option",
                            "propertyName" : "onOptionChange",
                            "label" : "onOptionChange",
                            "controlType" : "ACTION_SELECTOR",
                            "isJSConvertible" : true
                        }
                    ]
                }
            ],
            "FORM_BUTTON_WIDGET" : [ 
                {
                    "id" : "15.1",
                    "sectionName" : "General",
                    "children" : [ 
                        {
                            "id" : "15.1.1",
                            "propertyName" : "text",
                            "label" : "Label",
                            "validationType" : "TEXT",
                            "errorMessage" : "Must be a valid string",
                            "helpText" : "Sets the label of the button",
                            "controlType" : "INPUT_TEXT",
                            "placeholderText" : "Enter label text"
                        }, 
                        {
                            "id" : "15.1.2",
                            "propertyName" : "buttonStyle",
                            "label" : "Button Style",
                            "helpText" : "Changes the style of the button",
                            "controlType" : "DROP_DOWN",
                            "options" : [ 
                                {
                                    "label" : "Primary Button",
                                    "value" : "PRIMARY_BUTTON"
                                }, 
                                {
                                    "label" : "Secondary Button",
                                    "value" : "SECONDARY_BUTTON"
                                }, 
                                {
                                    "label" : "Danger Button",
                                    "value" : "DANGER_BUTTON"
                                }
                            ]
                        }, 
                        {
                            "id" : "15.1.3",
                            "helpText" : "Disables the button when the parent form has a required widget that is not filled",
                            "propertyName" : "disabledWhenInvalid",
                            "label" : "Disabled Invalid Forms",
                            "validationType" : "BOOLEAN",
                            "errorMessage" : "Must be a valid boolean value",
                            "controlType" : "SWITCH"
                        }, 
                        {
                            "id" : "15.1.4",
                            "helpText" : "Resets the fields within the parent form when the click action succeeds",
                            "propertyName" : "resetFormOnClick",
                            "label" : "Reset Form on Success",
                            "validationType" : "BOOLEAN",
                            "errorMessage" : "Must be a valid boolean value",
                            "controlType" : "SWITCH",
                            "isJSConvertible" : true
                        }, 
                        {
                            "id" : "15.1.5",
                            "propertyName" : "isVisible",
                            "label" : "Visible",
                            "helpText" : "Controls the visibility of the widget",
                            "controlType" : "SWITCH",
                            "validationType" : "BOOLEAN",
                            "errorMessage" : "Must be a valid boolean value",
                            "isJSConvertible" : true
                        }
                    ]
                }, 
                {
                    "id" : "15.2",
                    "sectionName" : "Actions",
                    "children" : [ 
                        {
                            "id" : "15.2.1",
                            "helpText" : "Triggers an action when the button is clicked",
                            "propertyName" : "onClick",
                            "label" : "onClick",
                            "controlType" : "ACTION_SELECTOR",
                            "isJSConvertible" : true
                        }
                    ]
                }
            ],
            "MAP_WIDGET" : [ 
                {
                    "sectionName" : "General",
                    "id" : "25.1",
                    "children" : [ 
                        {
                            "id" : "25.1.1",
                            "propertyName" : "mapCenter",
                            "label" : "Initial location",
                            "isJSConvertible" : true,
                            "controlType" : "LOCATION_SEARCH"
                        }, 
                        {
                            "id" : "25.1.4",
                            "propertyName" : "defaultMarkers",
                            "label" : "Default markers",
                            "controlType" : "INPUT_TEXT",
                            "inputType" : "ARRAY",
                            "helpText" : "Sets the default markers on the map",
                            "validationType" : "MARKER_ARRAY",
                            "errorMessage" : "Must be an array of lat, long",
                            "placeholderText" : "Enter [{ \"lat\": \"val1\", \"long\": \"val2\" }]"
                        }, 
                        {
                            "id" : "25.1.2",
                            "propertyName" : "enableSearch",
                            "label" : "Enable search location",
                            "helpText" : "Enables locaton search",
                            "validationType" : "BOOLEAN",
                            "errorMessage" : "Must be a valid boolean value",
                            "controlType" : "SWITCH"
                        }, 
                        {
                            "id" : "25.1.3",
                            "propertyName" : "enablePickLocation",
                            "label" : "Enable pick location",
                            "helpText" : "Allows a user to pick their location",
                            "validationType" : "BOOLEAN",
                            "errorMessage" : "Must be a valid boolean value",
                            "controlType" : "SWITCH"
                        }, 
                        {
                            "id" : "25.1.5",
                            "propertyName" : "enableCreateMarker",
                            "label" : "Create new marker",
                            "helpText" : "Allows users to mark locations on the map",
                            "validationType" : "BOOLEAN",
                            "errorMessage" : "Must be a valid boolean value",
                            "controlType" : "SWITCH"
                        }, 
                        {
                            "id" : "25.1.6",
                            "propertyName" : "zoomLevel",
                            "label" : "Zoom Level",
                            "controlType" : "STEP",
                            "helpText" : "Changes the default zoom of the map",
                            "stepType" : "ZOOM_PERCENTAGE"
                        }, 
                        {
                            "id" : "25.1.7",
                            "propertyName" : "isVisible",
                            "label" : "Visible",
                            "helpText" : "Controls the visibility of the widget",
                            "controlType" : "SWITCH",
                            "validationType" : "BOOLEAN",
                            "errorMessage" : "Must be a valid boolean value",
                            "isJSConvertible" : true
                        }
                    ]
                }, 
                {
                    "id" : "27",
                    "sectionName" : "Actions",
                    "children" : [ 
                        {
                            "id" : "27.1",
                            "propertyName" : "onMarkerClick",
                            "label" : "onMarkerClick",
                            "controlType" : "ACTION_SELECTOR",
                            "isJSConvertible" : true
                        }, 
                        {
                            "id" : "27.2",
                            "propertyName" : "onCreateMarker",
                            "label" : "onCreateMarker",
                            "controlType" : "ACTION_SELECTOR",
                            "isJSConvertible" : true
                        }
                    ]
                }
            ],
            "BUTTON_WIDGET" : [ 
                {
                    "id" : "1.1",
                    "sectionName" : "General",
                    "children" : [ 
                        {
                            "id" : "1.1.1",
                            "propertyName" : "text",
                            "label" : "Label",
                            "helpText" : "Sets the label of the button",
                            "controlType" : "INPUT_TEXT",
                            "validationType" : "TEXT",
                            "errorMessage" : "Must be a valid string",
                            "placeholderText" : "Enter label text"
                        }, 
                        {
                            "id" : "1.1.2",
                            "propertyName" : "buttonStyle",
                            "label" : "Button Style",
                            "controlType" : "DROP_DOWN",
                            "helpText" : "Changes the style of the button",
                            "options" : [ 
                                {
                                    "label" : "Primary Button",
                                    "value" : "PRIMARY_BUTTON"
                                }, 
                                {
                                    "label" : "Secondary Button",
                                    "value" : "SECONDARY_BUTTON"
                                }, 
                                {
                                    "label" : "Danger Button",
                                    "value" : "DANGER_BUTTON"
                                }
                            ]
                        }, 
                        {
                            "id" : "1.1.3",
                            "propertyName" : "isDisabled",
                            "label" : "Disabled",
                            "controlType" : "SWITCH",
                            "helpText" : "Disables clicks to this widget",
                            "validationType" : "BOOLEAN",
                            "errorMessage" : "Must be a valid boolean value",
                            "isJSConvertible" : true
                        }, 
                        {
                            "id" : "1.1.4",
                            "propertyName" : "isVisible",
                            "label" : "Visible",
                            "helpText" : "Controls the visibility of the widget",
                            "controlType" : "SWITCH",
                            "validationType" : "BOOLEAN",
                            "errorMessage" : "Must be a valid boolean value",
                            "isJSConvertible" : true
                        }
                    ]
                }, 
                {
                    "id" : "1.2.1",
                    "sectionName" : "Actions",
                    "children" : [ 
                        {
                            "id" : "2.1",
                            "helpText" : "Triggers an action when the button is clicked",
                            "propertyName" : "onClick",
                            "label" : "onClick",
                            "controlType" : "ACTION_SELECTOR",
                            "isJSConvertible" : true
                        }
                    ]
                }
            ],
            "RICH_TEXT_EDITOR_WIDGET" : [ 
                {
                    "id" : "12.1",
                    "sectionName" : "General",
                    "children" : [ 
                        {
                            "id" : "12.1.1",
                            "propertyName" : "defaultText",
                            "helpText" : "Sets the default text of the widget. The text is updated if the default text changes",
                            "label" : "Default text",
                            "controlType" : "INPUT_TEXT",
                            "validationType" : "TEXT",
                            "errorMessage" : "Must be a valid string",
                            "placeholderText" : "Enter HTML"
                        }, 
                        {
                            "id" : "12.1.2",
                            "propertyName" : "isVisible",
                            "label" : "Visible",
                            "helpText" : "Controls the visibility of the widget",
                            "controlType" : "SWITCH",
                            "validationType" : "BOOLEAN",
                            "errorMessage" : "Must be a valid boolean value",
                            "isJSConvertible" : true
                        }, 
                        {
                            "id" : "12.1.3",
                            "propertyName" : "isDisabled",
                            "label" : "Disable",
                            "helpText" : "Disables input to this widget",
                            "controlType" : "SWITCH",
                            "validationType" : "BOOLEAN",
                            "errorMessage" : "Must be a valid boolean value",
                            "isJSConvertible" : true
                        }
                    ]
                }, 
                {
                    "id" : "12.2",
                    "sectionName" : "Actions",
                    "children" : [ 
                        {
                            "id" : "12.2.1",
                            "helpText" : "Triggers an action when the text is changed",
                            "propertyName" : "onTextChange",
                            "label" : "onTextChange",
                            "controlType" : "ACTION_SELECTOR",
                            "isJSConvertible" : true
                        }
                    ]
                }
            ],
            "FILE_PICKER_WIDGET" : [ 
                {
                    "id" : "11.1",
                    "sectionName" : "General",
                    "children" : [ 
                        {
                            "id" : "11.1.1",
                            "propertyName" : "label",
                            "label" : "Label",
                            "controlType" : "INPUT_TEXT",
                            "helpText" : "Sets the label of the button",
                            "placeholderText" : "Enter label text",
                            "validationType" : "TEXT",
                            "errorMessage" : "Must be a valid string",
                            "inputType" : "TEXT"
                        }, 
                        {
                            "id" : "11.1.2",
                            "propertyName" : "maxNumFiles",
                            "label" : "Max No. files",
                            "helpText" : "Sets the maximum number of files that can be uploaded at once",
                            "controlType" : "INPUT_TEXT",
                            "placeholderText" : "Enter no. of files",
                            "validationType" : "POS_INT",
                            "errorMessage" : "Must be a valid number",
                            "inputType" : "INTEGER"
                        }, 
                        {
                            "id" : "11.1.3",
                            "propertyName" : "maxFileSize",
                            "helpText" : "Sets the maximum size of each file that can be uploaded",
                            "label" : "Max file size",
                            "controlType" : "INPUT_TEXT",
                            "validationType" : "POS_REAL",
                            "errorMessage" : "Must be a valid number",
                            "placeholderText" : "File size in mb",
                            "inputType" : "INTEGER"
                        }, 
                        {
                            "id" : "11.1.4",
                            "propertyName" : "allowedFileTypes",
                            "helpText" : "Restricts the type of files which can be uploaded",
                            "label" : "Allowed File Types",
                            "controlType" : "MULTI_SELECT",
                            "placeholderText" : "Select file types",
                            "options" : [ 
                                {
                                    "label" : "Any File",
                                    "value" : "*"
                                }, 
                                {
                                    "label" : "Images",
                                    "value" : "image/*"
                                }, 
                                {
                                    "label" : "Videos",
                                    "value" : "video/*"
                                }, 
                                {
                                    "label" : "Audio",
                                    "value" : "audio/*"
                                }, 
                                {
                                    "label" : "Text",
                                    "value" : "text/*"
                                }, 
                                {
                                    "label" : "MS Word",
                                    "value" : ".doc"
                                }, 
                                {
                                    "label" : "JPEG",
                                    "value" : "image/jpeg"
                                }, 
                                {
                                    "label" : "PNG",
                                    "value" : ".png"
                                }
                            ],
                            "isJSConvertible" : true
                        }, 
                        {
                            "id" : "11.1.5",
                            "propertyName" : "isRequired",
                            "label" : "Required",
                            "controlType" : "SWITCH",
                            "helpText" : "Disables a form submit button when this widget is empty",
                            "validationType" : "BOOLEAN",
                            "errorMessage" : "Must be a valid boolean value",
                            "isJSConvertible" : true
                        }, 
                        {
                            "id" : "11.1.6",
                            "propertyName" : "isVisible",
                            "label" : "Visible",
                            "helpText" : "Controls the visibility of the widget",
                            "controlType" : "SWITCH",
                            "validationType" : "BOOLEAN",
                            "errorMessage" : "Must be a valid boolean value",
                            "isJSConvertible" : true
                        }, 
                        {
                            "id" : "11.1.7",
                            "propertyName" : "uploadedFileUrls",
                            "helpText" : "Stores the url of the uploaded file so that it can be referenced in an action later",
                            "label" : "Uploaded File URLs",
                            "controlType" : "INPUT_TEXT",
                            "placeholderText" : "Enter [ \"url1\", \"url2\" ]",
                            "validationType" : "STR_ARR",
                            "errorMessage" : "Must be a valid array of URLs",
                            "inputType" : "TEXT"
                        }
                    ]
                }, 
                {
                    "id" : "11.2",
                    "sectionName" : "Actions",
                    "children" : [ 
                        {
                            "id" : "11.2.1",
                            "helpText" : "Triggers an action when the user selects a file. Upload files to a CDN here and store their urls in uploadedFileUrls",
                            "propertyName" : "onFilesSelected",
                            "label" : "onFilesSelected",
                            "controlType" : "ACTION_SELECTOR",
                            "isJSConvertible" : true
                        }
                    ]
                }
            ],
            "CHECKBOX_WIDGET" : [ 
                {
                    "id" : "9.1",
                    "sectionName" : "General",
                    "children" : [ 
                        {
                            "id" : "9.1.1",
                            "propertyName" : "label",
                            "label" : "Label",
                            "controlType" : "INPUT_TEXT",
                            "helpText" : "Displays a label next to the widget",
                            "validationType" : "TEXT",
                            "errorMessage" : "Must be a valid string",
                            "placeholderText" : "Enter label text"
                        }, 
                        {
                            "id" : "9.1.2",
                            "propertyName" : "defaultCheckedState",
                            "label" : "Default Selected",
                            "helpText" : "Checks / un-checks the checkbox by default. Changes to the default selection update the widget state",
                            "controlType" : "SWITCH",
                            "validationType" : "BOOLEAN",
                            "errorMessage" : "Must be a valid boolean value",
                            "isJSConvertible" : true
                        }, 
                        {
                            "id" : "9.1.3",
                            "propertyName" : "isRequired",
                            "label" : "Required",
                            "helpText" : "Disables a form submit button when this widget is empty",
                            "controlType" : "SWITCH",
                            "validationType" : "BOOLEAN",
                            "errorMessage" : "Must be a valid boolean value",
                            "isJSConvertible" : true
                        }, 
                        {
                            "id" : "9.1.4",
                            "propertyName" : "isDisabled",
                            "label" : "Disabled",
                            "controlType" : "SWITCH",
                            "helpText" : "Disables input to this widget",
                            "validationType" : "BOOLEAN",
                            "errorMessage" : "Must be a valid boolean value",
                            "isJSConvertible" : true
                        }, 
                        {
                            "id" : "9.1.5",
                            "propertyName" : "isVisible",
                            "label" : "Visible",
                            "helpText" : "Controls the visibility of the widget",
                            "controlType" : "SWITCH",
                            "validationType" : "BOOLEAN",
                            "errorMessage" : "Must be a valid boolean value",
                            "isJSConvertible" : true
                        }
                    ]
                }, 
                {
                    "id" : "9.2",
                    "sectionName" : "Actions",
                    "children" : [ 
                        {
                            "id" : "9.2.1",
                            "helpText" : "Triggers an action when the check state is changed",
                            "propertyName" : "onCheckChange",
                            "label" : "onCheckChange",
                            "controlType" : "ACTION_SELECTOR",
                            "isJSConvertible" : true
                        }
                    ]
                }
            ],
            "FORM_WIDGET" : [ 
                {
                    "id" : "14.1",
                    "sectionName" : "General",
                    "children" : [ 
                        {
                            "id" : "14.1.1",
                            "propertyName" : "backgroundColor",
                            "label" : "Background Color",
                            "helpText" : "Use a html color name, HEX, RGB or RGBA value",
                            "placeholderText" : "#FFFFFF / Gray / rgb(255, 99, 71)",
                            "validationType" : "HTML_COLOR",
                            "errorMessage" : "Invalid HTML color name, HEX, RGB or RGBA value",
                            "controlType" : "INPUT_TEXT"
                        }, 
                        {
                            "id" : "14.1.2",
                            "helpText" : "Controls the visibility of the widget",
                            "propertyName" : "isVisible",
                            "label" : "Visible",
                            "controlType" : "SWITCH",
                            "validationType" : "BOOLEAN",
                            "errorMessage" : "Must be a valid boolean value",
                            "isJSConvertible" : true
                        }, 
                        {
                            "id" : "14.1.3",
                            "propertyName" : "shouldScrollContents",
                            "label" : "Scroll Contents",
                            "validationType" : "BOOLEAN",
                            "errorMessage" : "Must be a valid boolean value",
                            "controlType" : "SWITCH"
                        }
                    ]
                }
            ],
            "TEXT_WIDGET" : [ 
                {
                    "id" : "2.1",
                    "sectionName" : "General",
                    "children" : [ 
                        {
                            "id" : "2.1.1",
                            "propertyName" : "text",
                            "helpText" : "Sets the text of the widget",
                            "label" : "Text",
                            "controlType" : "INPUT_TEXT",
                            "validationType" : "TEXT",
                            "errorMessage" : "Must be a valid string",
                            "placeholderText" : "Enter text",
                            "expected" : {
                                "message" : "Text to be displayed",
                                "type" : "string"
                            }
                        }, 
                        {
                            "id" : "2.1.3",
                            "propertyName" : "textAlign",
                            "helpText" : "Sets the alignments of the text",
                            "label" : "Text Align",
                            "controlType" : "DROP_DOWN",
                            "options" : [ 
                                {
                                    "label" : "Left",
                                    "value" : "LEFT"
                                }, 
                                {
                                    "label" : "Center",
                                    "value" : "CENTER"
                                }, 
                                {
                                    "label" : "Right",
                                    "value" : "RIGHT"
                                }
                            ]
                        }, 
                        {
                            "id" : "2.1.2",
                            "propertyName" : "textStyle",
                            "helpText" : "Sets the font and style of the text",
                            "label" : "Text Style",
                            "controlType" : "DROP_DOWN",
                            "options" : [ 
                                {
                                    "label" : "Heading",
                                    "value" : "HEADING"
                                }, 
                                {
                                    "label" : "Label",
                                    "value" : "LABEL"
                                }, 
                                {
                                    "label" : "Body",
                                    "value" : "BODY"
                                }
                            ]
                        }, 
                        {
                            "id" : "2.1.3",
                            "propertyName" : "shouldScroll",
                            "label" : "Enable Scroll",
                            "helpText" : "Allows scrolling text instead of truncation",
                            "validationType" : "BOOLEAN",
                            "errorMessage" : "Must be a valid boolean value",
                            "controlType" : "SWITCH"
                        }, 
                        {
                            "id" : "2.1.4",
                            "propertyName" : "isVisible",
                            "helpText" : "Controls the visibility of the widget",
                            "label" : "Visible",
                            "controlType" : "SWITCH",
                            "validationType" : "BOOLEAN",
                            "errorMessage" : "Must be a valid boolean value",
                            "isJSConvertible" : true
                        }
                    ]
                }
            ]
        },
        "name" : "propertyPane",
        "updatedAt" : ISODate("2020-06-02T12:29:11.874Z"),
        "deleted" : false,
        "_class" : "com.appsmith.server.domains.Config"
    })
]

printjson(res)

if (error) {
  print('Error occurred while inserting the records')
}
EOF
