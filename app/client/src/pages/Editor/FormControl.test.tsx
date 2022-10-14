import React from "react";
import { render, screen } from "test/testUtils";
import FormControl from "./FormControl";
import { reduxForm } from "redux-form";
import { mockCodemirrorRender } from "test/__mocks__/CodeMirrorEditorMock";
import { PluginType } from "entities/Action";
import { waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import { DatasourceComponentTypes, UIComponentTypes } from "api/PluginApi";

function TestForm(props: any) {
  return <div>{props.children}</div>;
}

const ReduxFormDecorator = reduxForm({
  form: "TestForm",
  initialValues: { name: "TestAction", datasource: { pluginId: "123" } },
})(TestForm);

describe("DynamicTextFieldControl", () => {
  beforeEach(() => {
    mockCodemirrorRender();
  });
  it("renders template menu correctly", () => {
    const config = {
      actionName: "TestAction",
      configProperty: "actionConfiguration.body",
      controlType: "DYNAMIC_TEXT_FIELD_CONTROL",
      evaluationSubstitutionType: EvaluationSubstitutionType.TEMPLATE,
      formName: "TestForm",
      id: "test",
      isValid: true,
      label: "TestAction body",
      onPropertyChange: jest.fn(),
      pluginId: "123",
      responseType: "TABLE",
    };
    render(
      <ReduxFormDecorator>
        <FormControl config={config} formName={"TestForm"} />
      </ReduxFormDecorator>,
      {
        url: "/?showTemplate=true",
        initialState: {
          entities: {
            // @ts-expect-error: Types are not available
            plugins: {
              list: [
                {
                  id: "123",
                  name: "testPlugin",
                  type: PluginType.DB,
                  packageName: "DB",
                  templates: {
                    CREATE: "test plugin template",
                  },
                  uiComponent: UIComponentTypes.DbEditorForm,
                  datasourceComponent: DatasourceComponentTypes.AutoForm,
                },
              ],
            },
          },
        },
      },
    );
    const createTemplateButton = screen.getByText("Create");
    userEvent.click(createTemplateButton);

    waitFor(async () => {
      await expect(screen.findByText("Create")).toBeNull();

      // Test each word separately because they are in different spans
      expect(screen.getByText("test")).toBeDefined();
      expect(screen.getByText("plugin")).toBeDefined();
      expect(screen.getByText("template")).toBeDefined();
    });
  });
});
