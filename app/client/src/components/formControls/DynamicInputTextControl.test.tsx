import React from "react";
import { render, screen } from "test/testUtils";
import DynamicInputTextControl from "./DynamicInputTextControl";
import { reduxForm } from "redux-form";
import { mockCodemirrorRender } from "test/__mocks__/CodeMirrorEditorMock";
import userEvent from "@testing-library/user-event";
import { waitFor } from "@testing-library/dom";

const TestForm = (props: any) => <div>{props.children}</div>;

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
          controlType="DYNAMIC_INPUT_TEXT_CONTROL"
          actionName="Test action"
          formName="TestForm"
          label="Action"
          configProperty="actionConfiguration.testPath"
          onPropertyChange={jest.fn()}
          id={"test"}
          isValid={true}
          dataType={"TABLE"}
          placeholderText="Test placeholder"
        />
      </ReduxFormDecorator>,
      {},
    );

    const input = screen.getAllByText("My test value")[0];
    userEvent.type(input, "New text");
    waitFor(async () => {
      await expect(screen.getAllByText("New text")).toHaveLength(2);
      await expect(screen.findByText("My test value")).toBeNull();
    });
  });
});
