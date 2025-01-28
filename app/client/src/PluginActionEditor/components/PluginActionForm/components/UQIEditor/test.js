export const test = [
  {
    controlType: "SECTION_V2",
    identifier: "SELECTOR",
    children: [
      {
        controlType: "DOUBLE_COLUMN_ZONE",
        identifier: "SELECTOR-Z1",
        children: [
          {
            label: "Command in groups",
            description:
              "Choose method you would like to use to query the database",
            configProperty: "actionConfiguration.formData.command.data",
            controlType: "DROP_DOWN",
            initialValue: "FIND",
            options: [
              {
                label: "Find document(s)",
                value: "FIND",
                type: "testgp1",
              },
              {
                label: "Insert document(s)",
                value: "INSERT",
                type: "testgp1",
              },
              {
                label: "Update document(s)",
                value: "UPDATE",
                type: "testgp2",
              },
              {
                label: "Delete document(s)",
                value: "DELETE",
                type: "testgp2",
              },
              {
                label: "Count",
                value: "COUNT",
                type: "testgp2",
              },
              {
                label: "Distinct",
                value: "DISTINCT",
                type: "testgp3",
              },
              {
                label: "Aggregate",
                value: "AGGREGATE",
                type: "testgp3",
              },
              {
                label: "Raw",
                value: "RAW",
                type: "testgp3",
              },
            ],
            optionGroupConfig: {
              testgp1: {
                label: "test group 1",
                type: "testgp1",
              },
              testgp2: {
                label: "test group 2",
                type: "testgp2",
              },
              testgp3: {
                label: "test group 3",
                type: "testgp3",
              },
            },
          },
        ],
      },
    ],
  },
  {
    controlType: "SECTION",
    _comment: "This section holds all the templates",
    children: [
      {
        controlType: "SECTION_V2",
        identifier: "AGGREGATE",
        conditionals: {
          show: "{{actionConfiguration.formData.command.data === 'AGGREGATE'}}",
        },
        children: [
          {
            controlType: "DOUBLE_COLUMN_ZONE",
            identifier: "AGGREGATE-Z1",
            children: [
              {
                label: "Collection",
                configProperty: "actionConfiguration.formData.collection.data",
                controlType: "DROP_DOWN",
                evaluationSubstitutionType: "TEMPLATE",
                propertyName: "get_collections",
                fetchOptionsConditionally: true,
                alternateViewTypes: ["json"],
                conditionals: {
                  fetchDynamicValues: {
                    condition: "{{true}}",
                    config: {
                      params: {
                        requestType: "_GET_STRUCTURE",
                        displayType: "DROP_DOWN",
                      },
                    },
                  },
                },
              },
            ],
          },
          {
            controlType: "SINGLE_COLUMN_ZONE",
            identifier: "AGGREGATE-Z2",
            children: [
              {
                label: "Array of pipelines",
                configProperty:
                  "actionConfiguration.formData.aggregate.arrayPipelines.data",
                controlType: "QUERY_DYNAMIC_TEXT",
                inputType: "JSON",
                evaluationSubstitutionType: "TEMPLATE",
                placeholderText:
                  '[{ $project: { tags: 1 } }, { $unwind: "$tags" }, { $group: { _id: "$tags", count: { $sum : 1 } } }  ]',
              },
            ],
          },
          {
            controlType: "DOUBLE_COLUMN_ZONE",
            identifier: "AGGREGATE-Z3",
            children: [
              {
                label: "Limit",
                configProperty:
                  "actionConfiguration.formData.aggregate.limit.data",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                evaluationSubstitutionType: "TEMPLATE",
                initialValue: "10",
              },
            ],
          },
        ],
      },
      {
        controlType: "SECTION_V2",
        identifier: "COUNT",
        conditionals: {
          show: "{{actionConfiguration.formData.command.data === 'COUNT'}}",
        },
        children: [
          {
            controlType: "DOUBLE_COLUMN_ZONE",
            identifier: "COUNT-Z1",
            children: [
              {
                label: "Collection",
                configProperty: "actionConfiguration.formData.collection.data",
                controlType: "DROP_DOWN",
                evaluationSubstitutionType: "TEMPLATE",
                propertyName: "get_collections",
                fetchOptionsConditionally: true,
                alternateViewTypes: ["json"],
                conditionals: {
                  fetchDynamicValues: {
                    condition: "{{true}}",
                    config: {
                      params: {
                        requestType: "_GET_STRUCTURE",
                        displayType: "DROP_DOWN",
                      },
                    },
                  },
                },
              },
            ],
          },
          {
            controlType: "SINGLE_COLUMN_ZONE",
            identifier: "COUNT-Z2",
            children: [
              {
                label: "Query",
                configProperty: "actionConfiguration.formData.count.query.data",
                controlType: "QUERY_DYNAMIC_TEXT",
                inputType: "JSON",
                evaluationSubstitutionType: "TEMPLATE",
                placeholderText: "{rating : {$gte : 9}}",
              },
            ],
          },
        ],
      },
      {
        controlType: "SECTION_V2",
        identifier: "DELETE",
        conditionals: {
          show: "{{actionConfiguration.formData.command.data === 'DELETE'}}",
        },
        children: [
          {
            controlType: "DOUBLE_COLUMN_ZONE",
            identifier: "DELETE-Z1",
            children: [
              {
                label: "Collection",
                configProperty: "actionConfiguration.formData.collection.data",
                controlType: "DROP_DOWN",
                evaluationSubstitutionType: "TEMPLATE",
                propertyName: "get_collections",
                fetchOptionsConditionally: true,
                alternateViewTypes: ["json"],
                conditionals: {
                  fetchDynamicValues: {
                    condition: "{{true}}",
                    config: {
                      params: {
                        requestType: "_GET_STRUCTURE",
                        displayType: "DROP_DOWN",
                      },
                    },
                  },
                },
              },
            ],
          },
          {
            controlType: "SINGLE_COLUMN_ZONE",
            identifier: "DELETE-Z2",
            children: [
              {
                label: "Query",
                configProperty:
                  "actionConfiguration.formData.delete.query.data",
                controlType: "QUERY_DYNAMIC_TEXT",
                inputType: "JSON",
                evaluationSubstitutionType: "TEMPLATE",
                placeholderText: "{rating : {$gte : 9}}",
              },
            ],
          },
          {
            controlType: "DOUBLE_COLUMN_ZONE",
            identifier: "DELETE-Z3",
            children: [
              {
                label: "Limit",
                configProperty:
                  "actionConfiguration.formData.delete.limit.data",
                controlType: "DROP_DOWN",
                "-subtitle": "Allowed values: SINGLE, ALL",
                "-tooltipText": "Allowed values: SINGLE, ALL",
                "-alternateViewTypes": ["json"],
                initialValue: "SINGLE",
                options: [
                  {
                    label: "Single document",
                    value: "SINGLE",
                  },
                  {
                    label: "All matching documents",
                    value: "ALL",
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        controlType: "SECTION_V2",
        identifier: "DISTINCT",
        conditionals: {
          show: "{{actionConfiguration.formData.command.data === 'DISTINCT'}}",
        },
        children: [
          {
            controlType: "DOUBLE_COLUMN_ZONE",
            identifier: "DISTINCT-Z1",
            children: [
              {
                label: "Collection",
                configProperty: "actionConfiguration.formData.collection.data",
                controlType: "DROP_DOWN",
                evaluationSubstitutionType: "TEMPLATE",
                propertyName: "get_collections",
                fetchOptionsConditionally: true,
                alternateViewTypes: ["json"],
                conditionals: {
                  fetchDynamicValues: {
                    condition: "{{true}}",
                    config: {
                      params: {
                        requestType: "_GET_STRUCTURE",
                        displayType: "DROP_DOWN",
                      },
                    },
                  },
                },
              },
            ],
          },
          {
            controlType: "SINGLE_COLUMN_ZONE",
            identifier: "DISTINCT-Z2",
            children: [
              {
                label: "Query",
                configProperty:
                  "actionConfiguration.formData.distinct.query.data",
                controlType: "QUERY_DYNAMIC_TEXT",
                inputType: "JSON",
                evaluationSubstitutionType: "TEMPLATE",
                placeholderText: "{rating : {$gte : 9}}",
              },
            ],
          },
          {
            controlType: "DOUBLE_COLUMN_ZONE",
            identifier: "DISTINCT-Z3",
            children: [
              {
                label: "Key",
                configProperty:
                  "actionConfiguration.formData.distinct.key.data",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                evaluationSubstitutionType: "TEMPLATE",
                placeholderText: "name",
              },
            ],
          },
        ],
      },
      {
        controlType: "SECTION_V2",
        identifier: "FIND",
        conditionals: {
          show: "{{actionConfiguration.formData.command.data === 'FIND'}}",
        },
        children: [
          {
            controlType: "DOUBLE_COLUMN_ZONE",
            identifier: "FIND-Z1",
            children: [
              {
                label: "Collection",
                configProperty: "actionConfiguration.formData.collection.data",
                controlType: "DROP_DOWN",
                evaluationSubstitutionType: "TEMPLATE",
                propertyName: "get_collections",
                fetchOptionsConditionally: true,
                alternateViewTypes: ["json"],
                conditionals: {
                  fetchDynamicValues: {
                    condition: "{{true}}",
                    config: {
                      params: {
                        requestType: "_GET_STRUCTURE",
                        displayType: "DROP_DOWN",
                      },
                    },
                  },
                },
              },
            ],
          },
          {
            controlType: "SINGLE_COLUMN_ZONE",
            identifier: "FIND-Z2",
            children: [
              {
                label: "Query",
                configProperty: "actionConfiguration.formData.find.query.data",
                controlType: "QUERY_DYNAMIC_TEXT",
                evaluationSubstitutionType: "TEMPLATE",
                placeholderText: "{rating : {$gte : 9}}",
              },
            ],
          },
          {
            controlType: "DOUBLE_COLUMN_ZONE",
            identifier: "FIND-Z3",
            children: [
              {
                label: "Sort",
                configProperty: "actionConfiguration.formData.find.sort.data",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                inputType: "JSON",
                evaluationSubstitutionType: "TEMPLATE",
                placeholderText: "{name : 1}",
              },
              {
                label: "Projection",
                configProperty:
                  "actionConfiguration.formData.find.projection.data",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                inputType: "JSON",
                evaluationSubstitutionType: "TEMPLATE",
                placeholderText: "{name : 1}",
              },
            ],
          },
          {
            controlType: "DOUBLE_COLUMN_ZONE",
            identifier: "FIND-Z4",
            children: [
              {
                label: "Limit",
                configProperty: "actionConfiguration.formData.find.limit.data",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                evaluationSubstitutionType: "TEMPLATE",
                placeholderText: "10",
              },
              {
                label: "Skip",
                configProperty: "actionConfiguration.formData.find.skip.data",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                evaluationSubstitutionType: "TEMPLATE",
                placeholderText: "0",
              },
            ],
          },
        ],
      },
      {
        controlType: "SECTION_V2",
        identifier: "INSERT",
        conditionals: {
          show: "{{actionConfiguration.formData.command.data === 'INSERT'}}",
        },
        children: [
          {
            controlType: "DOUBLE_COLUMN_ZONE",
            identifier: "INSERT-Z1",
            children: [
              {
                label: "Collection",
                configProperty: "actionConfiguration.formData.collection.data",
                controlType: "DROP_DOWN",
                evaluationSubstitutionType: "TEMPLATE",
                propertyName: "get_collections",
                fetchOptionsConditionally: true,
                alternateViewTypes: ["json"],
                conditionals: {
                  fetchDynamicValues: {
                    condition: "{{true}}",
                    config: {
                      params: {
                        requestType: "_GET_STRUCTURE",
                        displayType: "DROP_DOWN",
                      },
                    },
                  },
                },
              },
            ],
          },
          {
            controlType: "SINGLE_COLUMN_ZONE",
            identifier: "INSERT-Z2",
            children: [
              {
                label: "Documents",
                configProperty:
                  "actionConfiguration.formData.insert.documents.data",
                controlType: "QUERY_DYNAMIC_TEXT",
                inputType: "JSON",
                evaluationSubstitutionType: "TEMPLATE",
                placeholderText: '[ { _id: 1, user: "abc123", status: "A" } ]',
              },
            ],
          },
        ],
      },
      {
        controlType: "SECTION_V2",
        identifier: "UPDATE",
        conditionals: {
          show: "{{actionConfiguration.formData.command.data === 'UPDATE'}}",
        },
        children: [
          {
            controlType: "DOUBLE_COLUMN_ZONE",
            identifier: "UPDATE-Z1",
            children: [
              {
                label: "Collection",
                configProperty: "actionConfiguration.formData.collection.data",
                controlType: "DROP_DOWN",
                evaluationSubstitutionType: "TEMPLATE",
                propertyName: "get_collections",
                fetchOptionsConditionally: true,
                alternateViewTypes: ["json"],
                conditionals: {
                  fetchDynamicValues: {
                    condition: "{{true}}",
                    config: {
                      params: {
                        requestType: "_GET_STRUCTURE",
                        displayType: "DROP_DOWN",
                      },
                    },
                  },
                },
              },
            ],
          },
          {
            controlType: "SINGLE_COLUMN_ZONE",
            identifier: "UPDATE-Z2",
            children: [
              {
                label: "Query",
                configProperty:
                  "actionConfiguration.formData.updateMany.query.data",
                controlType: "QUERY_DYNAMIC_TEXT",
                inputType: "JSON",
                evaluationSubstitutionType: "TEMPLATE",
                placeholderText: "{rating : {$gte : 9}}",
              },
            ],
          },
          {
            controlType: "SINGLE_COLUMN_ZONE",
            identifier: "UPDATE-Z3",
            children: [
              {
                label: "Update",
                configProperty:
                  "actionConfiguration.formData.updateMany.update.data",
                controlType: "QUERY_DYNAMIC_TEXT",
                inputType: "JSON",
                evaluationSubstitutionType: "TEMPLATE",
                placeholderText: "{ $inc: { score: 1 } }",
              },
            ],
          },
          {
            controlType: "DOUBLE_COLUMN_ZONE",
            identifier: "UPDATE-Z4",
            children: [
              {
                label: "Limit",
                configProperty:
                  "actionConfiguration.formData.updateMany.limit.data",
                controlType: "DROP_DOWN",
                "-subtitle": "Allowed values: SINGLE, ALL",
                "-tooltipText": "Allowed values: SINGLE, ALL",
                "-alternateViewTypes": ["json"],
                initialValue: "SINGLE",
                options: [
                  {
                    label: "Single document",
                    value: "SINGLE",
                  },
                  {
                    label: "All matching documents",
                    value: "ALL",
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        controlType: "SECTION_V2",
        identifier: "RAW",
        conditionals: {
          show: "{{actionConfiguration.formData.command.data === 'RAW'}}",
        },
        children: [
          {
            controlType: "SINGLE_COLUMN_ZONE",
            identifier: "RAW-Z1",
            children: [
              {
                label: "",
                propertyName: "rawWithSmartSubstitute",
                configProperty: "actionConfiguration.formData.body.data",
                controlType: "QUERY_DYNAMIC_TEXT",
                evaluationSubstitutionType: "SMART_SUBSTITUTE",
                conditionals: {
                  show: "{{actionConfiguration.formData.command.data === 'RAW' && actionConfiguration.formData.smartSubstitution.data === true}}",
                },
              },
              {
                label: "",
                configProperty: "actionConfiguration.formData.body.data",
                propertyName: "rawWithTemplateSubstitute",
                controlType: "QUERY_DYNAMIC_TEXT",
                evaluationSubstitutionType: "TEMPLATE",
                conditionals: {
                  show: "{{actionConfiguration.formData.command.data === 'RAW' && actionConfiguration.formData.smartSubstitution.data === false}}",
                },
              },
            ],
          },
        ],
      },
    ],
  },
];
