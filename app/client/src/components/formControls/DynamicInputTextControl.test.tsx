import React from "react";
import { render, screen } from "test/testUtils";
import DynamicInputTextControl from "./DynamicInputTextControl";
import { reduxForm } from "redux-form";
import { mockCodemirrorRender } from "test/__mocks__/CodeMirrorEditorMock";
import userEvent from "@testing-library/user-event";
import { waitFor } from "@testing-library/dom";

function TestForm(props: any) {
  return <div>{props.children}</div>;
}

const ReduxFormDecorator = reduxForm({
  form: "TestForm",
  initialValues: { actionConfiguration: { testPath: "My test value" } },
})(TestForm);

describe("DynamicInputTextControl", () => {
  beforeEach(() => {
    mockCodemirrorRender();
  });
  it("renders correctly", () => {
    render(
      <ReduxFormDecorator>
        <DynamicInputTextControl
          actionName="Test action"
          configProperty="actionConfiguration.testPath"
          controlType="DYNAMIC_INPUT_TEXT_CONTROL"
          dataType={"TABLE"}
          formName="TestForm"
          id={"test"}
          isValid
          label="Action"
          onPropertyChange={jest.fn()}
          placeholderText="Test placeholder"
        />
      </ReduxFormDecorator>,
      {},
    );

    waitFor(async () => {
      const input = screen.getAllByText("My test value")[0];
      userEvent.type(input, "New text");
      await expect(screen.getAllByText("New text")).toHaveLength(2);
      await expect(screen.findByText("My test value")).toBeNull();
    });
  });
});
