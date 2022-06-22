import { OnButtonClickProps } from "components/propertyControls/ButtonControl";
import { set } from "lodash";
import { EVALUATION_PATH } from "utils/DynamicBindingUtils";

import schemaTestData from "../schemaTestData";
import { onGenerateFormClick } from "./propertyConfig";
import generatePanelPropertyConfig from "./propertyConfig/generatePanelPropertyConfig";

describe(".generatePanelPropertyConfig", () => {
  it("ACTION_SELECTOR control field should not have customJSControl and have additionalAutoComplete", (done) => {
    const panelConfig = generatePanelPropertyConfig(1);

    panelConfig?.children.forEach((section) => {
      if ("sectionName" in section) {
        section.children?.forEach((property) => {
          if ("propertyName" in property) {
            // If property is an event/action
            if (property.controlType === "ACTION_SELECTOR") {
              if (property.customJSControl) {
                done.fail(
                  `${section.sectionName} - ${property.propertyName} should not define "customJSControl" property`,
                );
              }

              if (!property.additionalAutoComplete) {
                done.fail(
                  `${section.sectionName} - ${property.propertyName} should define "additionalAutoComplete" property. Use getAutocompleteProperties`,
                );
              }
            }
          }
        });
      }
    });

    done();
  });
});

describe(".onGenerateFormClick", () => {
  it("calls batchUpdateProperties with new schema when prevSchema is not provided", () => {
    const mockBatchUpdateProperties = jest.fn();
    const widgetProperties = {
      autoGenerateForm: false,
      widgetName: "JSONForm1",
      childStylesheet: schemaTestData.fieldThemeStylesheets,
    };

    set(
      widgetProperties,
      `${EVALUATION_PATH}.evaluatedValues.sourceData`,
      schemaTestData.initialDataset.dataSource,
    );

    const params = ({
      batchUpdateProperties: mockBatchUpdateProperties,
      props: {
        widgetProperties,
      },
    } as unknown) as OnButtonClickProps;

    onGenerateFormClick(params);

    const expectedDynamicPropertyPathList = [
      { key: "schema.__root_schema__.children.dob.defaultValue" },
      { key: "schema.__root_schema__.children.boolean.defaultValue" },
    ];

    expect(mockBatchUpdateProperties.mock.calls.length).toBe(1);
    const response = mockBatchUpdateProperties.mock.calls[0][0];
    expect(response.fieldLimitExceeded).toEqual(false);
    expect(response.dynamicPropertyPathList).toEqual(
      expectedDynamicPropertyPathList,
    );
    expect(response.schema).toEqual(schemaTestData.initialDataset.schemaOutput);
  });

  it("calls batchUpdateProperties with retained existing dynamicBindingPropertyPathList", () => {
    const existingDynamicBindingPropertyPathList = [
      { key: "dummy.path1" },
      { key: "dummy.path2" },
    ];

    const mockBatchUpdateProperties = jest.fn();
    const widgetProperties = {
      autoGenerateForm: false,
      widgetName: "JSONForm1",
      childStylesheet: schemaTestData.fieldThemeStylesheets,
      dynamicPropertyPathList: existingDynamicBindingPropertyPathList,
    };

    set(
      widgetProperties,
      `${EVALUATION_PATH}.evaluatedValues.sourceData`,
      schemaTestData.initialDataset.dataSource,
    );

    const params = ({
      batchUpdateProperties: mockBatchUpdateProperties,
      props: {
        widgetProperties,
      },
    } as unknown) as OnButtonClickProps;

    onGenerateFormClick(params);

    const expectedDynamicPropertyPathList = [
      ...existingDynamicBindingPropertyPathList,
      { key: "schema.__root_schema__.children.dob.defaultValue" },
      { key: "schema.__root_schema__.children.boolean.defaultValue" },
    ];

    expect(mockBatchUpdateProperties.mock.calls.length).toBe(1);
    const response = mockBatchUpdateProperties.mock.calls[0][0];
    expect(response.fieldLimitExceeded).toEqual(false);
    expect(response.dynamicPropertyPathList).toEqual(
      expectedDynamicPropertyPathList,
    );
    expect(response.schema).toEqual(schemaTestData.initialDataset.schemaOutput);
  });

  it("calls batchUpdateProperties with updated schema when new key added to existing data source", () => {
    const existingDynamicBindingPropertyPathList = [
      { key: "dummy.path1" },
      { key: "dummy.path2" },
    ];

    const mockBatchUpdateProperties = jest.fn();
    const widgetProperties = {
      autoGenerateForm: false,
      widgetName: "JSONForm1",
      childStylesheet: schemaTestData.fieldThemeStylesheets,
      dynamicPropertyPathList: existingDynamicBindingPropertyPathList,
      schema: schemaTestData.initialDataset.schemaOutput,
    };

    set(
      widgetProperties,
      `${EVALUATION_PATH}.evaluatedValues.sourceData`,
      schemaTestData.withRemovedAddedKeyToInitialDataset.dataSource,
    );

    const params = ({
      batchUpdateProperties: mockBatchUpdateProperties,
      props: {
        widgetProperties,
      },
    } as unknown) as OnButtonClickProps;

    onGenerateFormClick(params);

    const expectedDynamicPropertyPathList = [
      ...existingDynamicBindingPropertyPathList,
      { key: "schema.__root_schema__.children.dob.defaultValue" },
    ];

    expect(mockBatchUpdateProperties.mock.calls.length).toBe(1);
    const response = mockBatchUpdateProperties.mock.calls[0][0];
    expect(response.fieldLimitExceeded).toEqual(false);
    expect(response.dynamicPropertyPathList).toEqual(
      expectedDynamicPropertyPathList,
    );
    expect(response.schema).toEqual(
      schemaTestData.withRemovedAddedKeyToInitialDataset.schemaOutput,
    );
  });
});
