import React from "react";
import { render, screen } from "test/testUtils";
import DynamicTextFieldControl from "./DynamicTextFieldControl";
import { reduxForm } from "redux-form";
import { mockCodemirrorRender } from "test/__mocks__/CodeMirrorEditorMock";
import { PluginType } from "entities/Action";
import { waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";

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
    render(
      <ReduxFormDecorator>
        <DynamicTextFieldControl
          actionName="TestAction"
          configProperty="actionConfiguration.body"
          controlType="DYNAMIC_TEXT_FIELD_CONTROL"
          createTemplate={jest.fn()}
          evaluationSubstitutionType={EvaluationSubstitutionType.TEMPLATE}
          formName="TestForm"
          id={"test"}
          isValid
          label={"TestAction body"}
          onPropertyChange={jest.fn()}
          pluginId="123"
          responseType={"TABLE"}
        />
      </ReduxFormDecorator>,
      {
        url: "/?showTemplate=true",
        initialState: {
          entities: {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
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
                  uiComponent: "DbEditorForm",
                  datasourceComponent: "AutoForm",
                },
              ],
            },
          },
        },
      },
    );
    const createTemplateButton = screen.getByText("Create");
    userEvent.click(createTemplateButton);
    expect(screen.getByText("test plugin template")).toBeDefined();
    waitFor(async () => {
      await expect(screen.findByText("Create")).toBeNull();
    });
  });
});
