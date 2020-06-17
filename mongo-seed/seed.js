let error = false
print("**** Going to start Mongo seed ****")

let res = [
    db.organization.insert({
        "_id": ObjectId("5da151714a020300041ae8fd"),
        "name": "Test Organization",
        "website": "https://test.example.com",
        "organizationSettings": [],
        "deleted": false,
        "_class": "com.appsmith.server.domains.Organization",
        "plugins": [
            {
                "pluginId": "5c9f512f96c1a50004819786",
                "status": "FREE",
                "deleted": false
            },
            {
                "pluginId": "5ca385dc81b37f0004b4db85",
                "status": "FREE",
                "deleted": false
            }
        ]
    }),

    db.group.insert({
            "_id": ObjectId("5da151714a020300041ae8ff"),
            "name": "org-admin",
            "organizationId": "5da151714a020300041ae8fd",
            "displayName": "Org Admin Group",
            "isDefault": true,
            "permissions": [
                "read:groups",
                "read:organizations",
                "create:users",
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
                "update:plugins"
            ],
            "deleted": false,
            "_class": "com.appsmith.server.domains.Group"
        },
        {
            "_id": ObjectId("5df8c1e0078d501fc3f4491b"),
            "name": "org-admin",
            "organizationId": "default-org",
            "displayName": "Org Admin Group",
            "isDefault": true,
            "permissions": [
                "read:groups",
                "read:organizations",
                "create:users",
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
                "update:plugins"
            ],
            "deleted": false,
            "_class": "com.appsmith.server.domains.Group"
        }),

    db.user.insert({
        "name": "Admin User",
        "email": "admin@localhost.com",
        "source": "FORM",
        "state": "ACTIVATED",
        "isEnabled": true,
        "currentOrganizationId": "5da151714a020300041ae8fd",
        "organizationIds": ["5da151714a020300041ae8fd"],
        "deleted": false,
        "groupIds": [
            "5da151714a020300041ae8ff"
        ],
        "_class": "com.appsmith.server.domains.User",
        "permissions": [
            "create:organizations"
        ],
        "password": "$2y$12$BNf4tM9yTU7KxEvtsCdgbu3Y.Tz0JpEsu8HtLiq/aLIyV.uq/1R1."
    }),

    db.application.insert({
        "_id": ObjectId("5d807e45795dc6000482bc74"),
        "name": "app-name",
        "organizationId": "5da151714a020300041ae8fd",
        "deleted": false,
        "_class": "com.appsmith.server.domains.Application"
    }),

    db.page.insert({
            "_id": ObjectId("5d807e76795dc6000482bc76"),
            "name": "page1",
            "applicationId": "5d807e45795dc6000482bc74",
            "layouts": [{
                "_id": ObjectId("5d807e76795dc6000482bc75"), "dsl": {
                    "backgroundColor": "#ffffff",
                    "rightColumn": {"$numberInt": "1200"},
                    "snapColumns": {"$numberInt": "16"},
                    "widgetId": "0",
                    "topRow": {"$numberInt": "0"},
                    "bottomRow": {"$numberInt": "974"},
                    "snapRows": {"$numberInt": "100"},
                    "parentRowSpace": {"$numberInt": "1"},
                    "type": "CONTAINER_WIDGET",
                    "renderMode": "CANVAS",
                    "parentColumnSpace": {"$numberInt": "1"},
                    "leftColumn": {"$numberInt": "0"},
                    "children": [{
                        "backgroundColor": "#FFFFFF",
                        "widgetName": "Container14",
                        "type": "CONTAINER_WIDGET",
                        "widgetId": "5jp6uwe34j",
                        "isVisible": true,
                        "parentColumnSpace": {"$numberInt": "75"},
                        "parentRowSpace": {"$numberInt": "40"},
                        "renderMode": "CANVAS",
                        "snapColumns": {"$numberInt": "16"},
                        "snapRows": {"$numberInt": "32"},
                        "orientation": "VERTICAL",
                        "children": [],
                        "background": "#FFFFFF",
                        "leftColumn": {"$numberInt": "1"},
                        "topRow": {"$numberInt": "15"},
                        "rightColumn": {"$numberInt": "7"},
                        "bottomRow": {"$numberInt": "19"}
                    }, {
                        "backgroundColor": "#FFFFFF",
                        "widgetName": "Container16",
                        "type": "CONTAINER_WIDGET",
                        "widgetId": "sm0u7embtm",
                        "isVisible": true,
                        "parentColumnSpace": {"$numberInt": "75"},
                        "parentRowSpace": {"$numberInt": "40"},
                        "renderMode": "CANVAS",
                        "leftColumn": {"$numberInt": "4"},
                        "rightColumn": {"$numberInt": "13"},
                        "topRow": {"$numberInt": "2"},
                        "bottomRow": {"$numberInt": "9"},
                        "snapColumns": {"$numberInt": "16"},
                        "snapRows": {"$numberInt": "32"},
                        "orientation": "VERTICAL",
                        "children": [{
                            "text": "Submit",
                            "buttonStyle": "PRIMARY_BUTTON",
                            "widgetName": "Button8",
                            "type": "BUTTON_WIDGET",
                            "widgetId": "54buqngnv3",
                            "isVisible": true,
                            "parentColumnSpace": {"$numberInt": "75"},
                            "parentRowSpace": {"$numberInt": "40"},
                            "renderMode": "CANVAS",
                            "leftColumn": {"$numberInt": "1"},
                            "rightColumn": {"$numberInt": "10"},
                            "topRow": {"$numberInt": "3"},
                            "bottomRow": {"$numberInt": "6"}
                        }, {
                            "text": "Submit",
                            "buttonStyle": "PRIMARY_BUTTON",
                            "widgetName": "Button12",
                            "type": "BUTTON_WIDGET",
                            "widgetId": "ep0rjwvlft",
                            "isVisible": true,
                            "parentColumnSpace": {"$numberInt": "75"},
                            "parentRowSpace": {"$numberInt": "40"},
                            "renderMode": "CANVAS",
                            "leftColumn": {"$numberInt": "11"},
                            "rightColumn": {"$numberInt": "15"},
                            "topRow": {"$numberInt": "2"},
                            "bottomRow": {"$numberInt": "4"},
                            "backgroundColor": "#FFFFFF"
                        }],
                        "background": "#FFFFFF"
                    }, {
                        "text": "Submit",
                        "buttonStyle": "PRIMARY_BUTTON",
                        "widgetName": "Button9",
                        "type": "BUTTON_WIDGET",
                        "widgetId": "yfp2d3i4o1",
                        "isVisible": true,
                        "parentColumnSpace": {"$numberInt": "75"},
                        "parentRowSpace": {"$numberInt": "40"},
                        "renderMode": "CANVAS",
                        "leftColumn": {"$numberInt": "2"},
                        "rightColumn": {"$numberInt": "4"},
                        "topRow": {"$numberInt": "11"},
                        "bottomRow": {"$numberInt": "14"}
                    }, {
                        "text": "Submit",
                        "buttonStyle": "PRIMARY_BUTTON",
                        "widgetName": "Button10",
                        "type": "BUTTON_WIDGET",
                        "widgetId": "skm1zkmqcw",
                        "isVisible": true,
                        "parentColumnSpace": {"$numberInt": "75"},
                        "parentRowSpace": {"$numberInt": "40"},
                        "renderMode": "CANVAS",
                        "leftColumn": {"$numberInt": "5"},
                        "rightColumn": {"$numberInt": "8"},
                        "topRow": {"$numberInt": "11"},
                        "bottomRow": {"$numberInt": "14"}
                    }, {
                        "text": "Submit",
                        "buttonStyle": "PRIMARY_BUTTON",
                        "widgetName": "Button11",
                        "type": "BUTTON_WIDGET",
                        "widgetId": "rrpi7fwhyr",
                        "isVisible": true,
                        "parentColumnSpace": {"$numberInt": "75"},
                        "parentRowSpace": {"$numberInt": "40"},
                        "renderMode": "CANVAS",
                        "leftColumn": {"$numberInt": "9"},
                        "rightColumn": {"$numberInt": "15"},
                        "topRow": {"$numberInt": "10"},
                        "bottomRow": {"$numberInt": "19"}
                    }]
                }, "deleted": false
            }, {
                "_id": ObjectId("5d81c99757a58e569bf1aa4b"),
                "screen": "MOBILE",
                "dsl": {"key1": "value1", "key": "value"},
                "deleted": false
            }, {
                "_id": ObjectId("5d81d97b57a58e575b6ac0da"),
                "screen": "MOBILE",
                "dsl": {"newkey1": "newvalue1", "key": "value"},
                "deleted": false
            }],
            "deleted": false,
            "_class": "com.appsmith.server.domains.Page"
        }
    ),

    db.config.insert({
        "_id": ObjectId("5d8a04195cf8050004db6e30"),
        "config": {
            "BUTTON_WIDGET": [{
                "_id": ObjectId("5d8a04195cf8050004db6de2"),
                "sectionName": "General",
                "children": [{
                    "_id": ObjectId("5d8a04195cf8050004db6de3"),
                    "propertyName": "text",
                    "label": "Button Text",
                    "controlType": "INPUT_TEXT",
                    "placeholderText": "Enter button text here"
                }, {
                    "_id": ObjectId("5d8a04195cf8050004db6de4"),
                    "propertyName": "buttonStyle",
                    "label": "Button Style",
                    "controlType": "DROP_DOWN",
                    "options": [{"label": "Primary Button", "value": "PRIMARY_BUTTON"}, {
                        "label": "Secondary Button",
                        "value": "SECONDARY_BUTTON"
                    }]
                }, {
                    "_id": ObjectId("5d8a04195cf8050004db6de5"),
                    "propertyName": "isDisabled",
                    "label": "Disabled",
                    "controlType": "SWITCH"
                }, {
                    "_id": ObjectId("5d8a04195cf8050004db6de6"),
                    "propertyName": "isVisible",
                    "label": "Visibile",
                    "controlType": "SWITCH"
                }]
            }, {
                "_id": ObjectId("5d8a04195cf8050004db6de7"),
                "sectionName": "Actions",
                "children": [{
                    "_id": ObjectId("5d8a04195cf8050004db6de8"),
                    "propertyName": "onClick",
                    "label": "onClick",
                    "controlType": "ACTION_SELECTOR"
                }]
            }],
            "TEXT_WIDGET": [{
                "_id": ObjectId("5d8a04195cf8050004db6de9"),
                "sectionName": "General",
                "children": [{
                    "_id": ObjectId("5d8a04195cf8050004db6dea"),
                    "propertyName": "text",
                    "label": "Text",
                    "controlType": "INPUT_TEXT",
                    "placeholderText": "Enter your text here"
                }, {
                    "_id": ObjectId("5d8a04195cf8050004db6deb"),
                    "propertyName": "textStyle",
                    "label": "Text Style",
                    "controlType": "DROP_DOWN",
                    "options": [{"label": "Heading", "value": "HEADING"}, {
                        "label": "Label",
                        "value": "LABEL"
                    }, {"label": "Body", "value": "BODY"}, {"label": "Sub text", "value": "SUB_TEXT"}]
                }, {
                    "_id": ObjectId("5d8a04195cf8050004db6dec"),
                    "propertyName": "isVisible",
                    "label": "Visibile",
                    "controlType": "SWITCH"
                }]
            }],
            "IMAGE_WIDGET": [{
                "_id": ObjectId("5d8a04195cf8050004db6ded"),
                "sectionName": "General",
                "children": [{
                    "_id": ObjectId("5d8a04195cf8050004db6dee"),
                    "propertyName": "image",
                    "label": "Image",
                    "controlType": "IMAGE_PICKER"
                }, {
                    "_id": ObjectId("5d8a04195cf8050004db6def"),
                    "propertyName": "defaultImage",
                    "label": "Default Image",
                    "controlType": "IMAGE_PICKER"
                }, {
                    "_id": ObjectId("5d8a04195cf8050004db6df0"),
                    "propertyName": "imageShape",
                    "label": "Shape",
                    "controlType": "SHAPE_PICKER"
                }, {
                    "_id": ObjectId("5d8a04195cf8050004db6df1"),
                    "propertyName": "isVisible",
                    "label": "Visibile",
                    "controlType": "SWITCH"
                }]
            }],
            "INPUT_WIDGET": [{
                "_id": ObjectId("5d8a04195cf8050004db6df2"),
                "sectionName": "General",
                "children": [{
                    "_id": ObjectId("5d8a04195cf8050004db6df3"),
                    "propertyName": "label",
                    "label": "Label",
                    "controlType": "INPUT_TEXT",
                    "placeholderText": "Label the widget",
                    "inputType": "TEXT"
                }, {
                    "_id": ObjectId("5d8a04195cf8050004db6df4"),
                    "propertyName": "inputType",
                    "label": "Data Type",
                    "controlType": "DROP_DOWN",
                    "options": [{"label": "Text", "value": "TEXT"}, {
                        "label": "Number",
                        "value": "NUMBER"
                    }, {"label": "Integer", "value": "INTEGER"}, {
                        "label": "Phone Number",
                        "value": "PHONE_NUMBER"
                    }, {"label": "Email", "value": "EMAIL"}, {
                        "label": "Passwork",
                        "value": "PASSWORD"
                    }, {"label": "Currency", "value": "CURRENCY"}, {"label": "Search", "value": "SEARCH"}]
                }, {
                    "_id": ObjectId("5d8a04195cf8050004db6df5"),
                    "propertyName": "placeholderText",
                    "label": "Placeholder",
                    "controlType": "INPUT_TEXT",
                    "placeholderText": "Enter your text here"
                }, {
                    "_id": ObjectId("5d8a04195cf8050004db6df6"),
                    "propertyName": "maxChars",
                    "label": "Max Chars",
                    "controlType": "INPUT_TEXT",
                    "placeholderText": "Maximum character length",
                    "inputType": "INTEGER"
                }, {
                    "_id": ObjectId("5d8a04195cf8050004db6df7"),
                    "propertyName": "validators",
                    "label": "Validators",
                    "controlType": "VALIDATION_INPUT"
                }, {"_id": ObjectId("5d8a04195cf8050004db6df8")}, {
                    "_id": ObjectId("5d8a04195cf8050004db6df9"),
                    "propertyName": "isVisible",
                    "label": "Visibile",
                    "controlType": "SWITCH"
                }, {
                    "_id": ObjectId("5d8a04195cf8050004db6dfa"),
                    "propertyName": "isDisabled",
                    "label": "Disabled",
                    "controlType": "SWITCH"
                }]
            }],
            "SWITCH_WIDGET": [{
                "_id": ObjectId("5d8a04195cf8050004db6dfb"),
                "sectionName": "General",
                "children": [{
                    "_id": ObjectId("5d8a04195cf8050004db6dfc"),
                    "propertyName": "label",
                    "label": "Label",
                    "controlType": "INPUT_TEXT",
                    "placeholderText": "Label the widget",
                    "inputType": "TEXT"
                }, {
                    "_id": ObjectId("5d8a04195cf8050004db6dfd"),
                    "propertyName": "isOn",
                    "label": "Default State",
                    "controlType": "SWITCH"
                }, {
                    "_id": ObjectId("5d8a04195cf8050004db6dfe"),
                    "propertyName": "isVisible",
                    "label": "Visibile",
                    "controlType": "SWITCH"
                }, {
                    "_id": ObjectId("5d8a04195cf8050004db6dff"),
                    "propertyName": "isDisabled",
                    "label": "Disabled",
                    "controlType": "SWITCH"
                }]
            }],
            "CONTAINER_WIDGET": [{
                "_id": ObjectId("5d8a04195cf8050004db6e00"),
                "sectionName": "General",
                "children": [{
                    "_id": ObjectId("5d8a04195cf8050004db6e01"),
                    "propertyName": "backgroundColor",
                    "label": "Background Color",
                    "controlType": "COLOR_PICKER"
                }, {
                    "_id": ObjectId("5d8a04195cf8050004db6e02"),
                    "propertyName": "isVisible",
                    "label": "Visibile",
                    "controlType": "SWITCH"
                }]
            }],
            "SPINNER_WIDGET": [{
                "_id": ObjectId("5d8a04195cf8050004db6e03"),
                "sectionName": "General",
                "children": [{
                    "_id": ObjectId("5d8a04195cf8050004db6e04"),
                    "propertyName": "isVisible",
                    "label": "Visibile",
                    "controlType": "SWITCH"
                }]
            }],
            "DATE_PICKER_WIDGET": [{
                "_id": ObjectId("5d8a04195cf8050004db6e05"),
                "sectionName": "General",
                "children": [{
                    "_id": ObjectId("5d8a04195cf8050004db6e06"),
                    "propertyName": "datePickerType",
                    "label": "Picker Type",
                    "controlType": "DROP_DOWN",
                    "options": [{"label": "Single Date", "value": "DATE_PICKER"}, {
                        "label": "Date Range",
                        "value": "DATE_RANGE_PICKER"
                    }]
                }, {
                    "_id": ObjectId("5d8a04195cf8050004db6e07"),
                    "propertyName": "label",
                    "label": "Enter Date Label",
                    "controlType": "INPUT_TEXT"
                }, {
                    "_id": ObjectId("5d8a04195cf8050004db6e08"),
                    "propertyName": "defaultDate",
                    "label": "Default Date",
                    "controlType": "DATE_PICKER"
                }, {
                    "_id": ObjectId("5d8a04195cf8050004db6e09"),
                    "propertyName": "defaultTimezone",
                    "label": "Default Timezone",
                    "controlType": "TIMEZONE_PICKER"
                }, {
                    "_id": ObjectId("5d8a04195cf8050004db6e0a"),
                    "propertyName": "enableTime",
                    "label": "Enable Pick Time",
                    "controlType": "SWITCH"
                }, {
                    "_id": ObjectId("5d8a04195cf8050004db6e0b"),
                    "propertyName": "isVisible",
                    "label": "Visibile",
                    "controlType": "SWITCH"
                }, {
                    "_id": ObjectId("5d8a04195cf8050004db6e0c"),
                    "propertyName": "isDisabled",
                    "label": "Disabled",
                    "controlType": "SWITCH"
                }]
            }, {
                "_id": ObjectId("5d8a04195cf8050004db6e0d"),
                "sectionName": "Actions",
                "children": [{
                    "_id": ObjectId("5d8a04195cf8050004db6e0e"),
                    "propertyName": "onDateSelected",
                    "label": "onDateSelected",
                    "controlType": "ACTION_SELECTOR"
                }, {
                    "_id": ObjectId("5d8a04195cf8050004db6e0f"),
                    "propertyName": "onDateRangeSelected",
                    "label": "onDateRangeSelected",
                    "controlType": "ACTION_SELECTOR"
                }]
            }],
            "TABLE_WIDGET": [{
                "_id": ObjectId("5d8a04195cf8050004db6e10"),
                "sectionName": "General",
                "children": [{
                    "_id": ObjectId("5d8a04195cf8050004db6e11"),
                    "propertyName": "label",
                    "label": "Enter Table Label",
                    "controlType": "INPUT_TEXT"
                }, {
                    "_id": ObjectId("5d8a04195cf8050004db6e12"),
                    "propertyName": "tableData",
                    "label": "Enter data array",
                    "controlType": "INPUT_TEXT"
                }, {
                    "_id": ObjectId("5d8a04195cf8050004db6e13"),
                    "propertyName": "nextPageKey",
                    "label": "Next Pagination Key",
                    "controlType": "INPUT_TEXT"
                }, {
                    "_id": ObjectId("5d8a04195cf8050004db6e14"),
                    "propertyName": "prevPageKey",
                    "label": "Previous Pagination Key",
                    "controlType": "INPUT_TEXT"
                }, {
                    "_id": ObjectId("5d8a04195cf8050004db6e15"),
                    "propertyName": "isVisible",
                    "label": "Visibile",
                    "controlType": "SWITCH"
                }]
            }, {
                "_id": ObjectId("5d8a04195cf8050004db6e16"),
                "sectionName": "Actions",
                "children": [{
                    "_id": ObjectId("5d8a04195cf8050004db6e17"),
                    "propertyName": "tableActions",
                    "label": "Record action",
                    "controlType": "RECORD_ACTION_SELECTOR"
                }, {
                    "_id": ObjectId("5d8a04195cf8050004db6e18"),
                    "propertyName": "onRowSelected",
                    "label": "onRowSelected",
                    "controlType": "ACTION_SELECTOR"
                }, {
                    "_id": ObjectId("5d8a04195cf8050004db6e19"),
                    "propertyName": "onPageChange",
                    "label": "onPageChange",
                    "controlType": "ACTION_SELECTOR"
                }]
            }],
            "DROP_DOWN_WIDGET": [{
                "_id": ObjectId("5d8a04195cf8050004db6e1a"),
                "sectionName": "General",
                "children": [{
                    "_id": ObjectId("5d8a04195cf8050004db6e1b"),
                    "propertyName": "type",
                    "label": "Selection Type",
                    "controlType": "DROP_DOWN",
                    "options": [{"label": "Single Select", "value": "SINGLE_SELECT"}, {
                        "label": "Multi Select",
                        "value": "MULTI_SELECT"
                    }]
                }, {
                    "_id": ObjectId("5d8a04195cf8050004db6e1c"),
                    "propertyName": "label",
                    "label": "Label",
                    "controlType": "INPUT_TEXT",
                    "placeholderText": "Enter the label"
                }, {
                    "_id": ObjectId("5d8a04195cf8050004db6e1d"),
                    "propertyName": "placeholderText",
                    "label": "Placeholder",
                    "controlType": "INPUT_TEXT",
                    "placeholderText": "Enter the placeholder"
                }, {
                    "_id": ObjectId("5d8a04195cf8050004db6e1e"),
                    "propertyName": "options",
                    "label": "Options",
                    "controlType": "OPTION_INPUT"
                }, {
                    "_id": ObjectId("5d8a04195cf8050004db6e1f"),
                    "propertyName": "isVisible",
                    "label": "Visibile",
                    "controlType": "SWITCH"
                }]
            }, {
                "_id": ObjectId("5d8a04195cf8050004db6e20"),
                "sectionName": "Actions",
                "children": [{
                    "_id": ObjectId("5d8a04195cf8050004db6e21"),
                    "propertyName": "onOptionSelected",
                    "label": "onOptionSelected",
                    "controlType": "ACTION_SELECTOR"
                }]
            }],
            "CHECKBOX_WIDGET": [{
                "_id": ObjectId("5d8a04195cf8050004db6e22"),
                "sectionName": "General",
                "children": [{
                    "_id": ObjectId("5d8a04195cf8050004db6e23"),
                    "propertyName": "label",
                    "label": "Label",
                    "controlType": "INPUT_TEXT",
                    "placeholderText": "Enter the label"
                }, {
                    "_id": ObjectId("5d8a04195cf8050004db6e24"),
                    "propertyName": "defaultCheckedState",
                    "label": "Default State",
                    "controlType": "SWITCH"
                }, {
                    "_id": ObjectId("5d8a04195cf8050004db6e25"),
                    "propertyName": "isDisabled",
                    "label": "Disabled",
                    "controlType": "SWITCH"
                }, {
                    "_id": ObjectId("5d8a04195cf8050004db6e26"),
                    "propertyName": "isVisible",
                    "label": "Visibile",
                    "controlType": "SWITCH"
                }]
            }, {
                "_id": ObjectId("5d8a04195cf8050004db6e27"),
                "sectionName": "Actions",
                "children": [{
                    "_id": ObjectId("5d8a04195cf8050004db6e28"),
                    "propertyName": "onCheckChange",
                    "label": "onCheckChange",
                    "controlType": "ACTION_SELECTOR"
                }]
            }],
            "RADIO_GROUP_WIDGET": [{
                "_id": ObjectId("5d8a04195cf8050004db6e29"),
                "sectionName": "General",
                "children": [{
                    "_id": ObjectId("5d8a04195cf8050004db6e2a"),
                    "propertyName": "label",
                    "label": "Label",
                    "controlType": "INPUT_TEXT",
                    "placeholderText": "Enter the label"
                }, {
                    "_id": ObjectId("5d8a04195cf8050004db6e2b"),
                    "propertyName": "defaultOptionValue",
                    "label": "Default Selected Value",
                    "controlType": "SWITCH"
                }, {
                    "_id": ObjectId("5d8a04195cf8050004db6e2c"),
                    "propertyName": "options",
                    "label": "Options",
                    "controlType": "OPTION_INPUT"
                }, {
                    "_id": ObjectId("5d8a04195cf8050004db6e2d"),
                    "propertyName": "isVisible",
                    "label": "Visibile",
                    "controlType": "SWITCH"
                }]
            }, {
                "_id": ObjectId("5d8a04195cf8050004db6e2e"),
                "sectionName": "Actions",
                "children": [{
                    "_id": ObjectId("5d8a04195cf8050004db6e2f"),
                    "propertyName": "onOptionSelected",
                    "label": "onOptionSelected",
                    "controlType": "ACTION_SELECTOR"
                }]
            }]
        },
        "configVersion": "5d8a04195cf8050004db6e30",
        "deleted": false,
        "_class": "com.appsmith.server.domains.PropertyPane"
    })

]

printjson(res)

if (error) {
    print('Error occurred while inserting the records')
}