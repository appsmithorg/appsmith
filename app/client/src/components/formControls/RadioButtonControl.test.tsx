import React from "react";
import RadioButtonControl from "./RadioButtonControl";
import { render, screen } from "test/testUtils";
import { Provider } from "react-redux";
import { reduxForm } from "redux-form";
import configureStore from "redux-mock-store";
import "@testing-library/jest-dom";

const mockStore = configureStore([]);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TestForm(props: any) {
  return <div>{props.children}</div>;
}

const ReduxFormDecorator = reduxForm({
  form: "TestForm",
})(TestForm);

const mockOptions = [
  { label: "Option 1", value: "option1", children: "Option 1" },
  { label: "Option 2", value: "option2", children: "Option 2" },
  { label: "Option 3", value: "option3", children: "Option 3" },
];

let radioButtonProps = {
  options: mockOptions,
  configProperty: "actionConfiguration.testPath",
  controlType: "PROJECTION",
  label: "Columns",
  id: "column",
  formName: "",
  isValid: true,
  initialValue: "option1",
};

describe("RadioButtonControl", () => {
  const mockStoreInstance = mockStore();
  let store: typeof mockStoreInstance;

  beforeEach(() => {
    store = mockStore();
  });
  it("should render RadioButtonControl and options properly", async () => {
    render(
      <Provider store={store}>
        <ReduxFormDecorator>
          <RadioButtonControl {...radioButtonProps} />
        </ReduxFormDecorator>
      </Provider>,
    );
    const radioButton = (await screen.findByTestId(
      "actionConfiguration.testPath",
    ));

    expect(radioButton).toBeInTheDocument();

    const options = screen.getAllByRole("radio");

    expect(options).toHaveLength(3);
  });

  it("should show the default selected option", async () => {
    radioButtonProps = {
      ...radioButtonProps,
    };

    render(
      <Provider store={store}>
        <ReduxFormDecorator>
          <RadioButtonControl {...radioButtonProps} />
        </ReduxFormDecorator>
      </Provider>,
    );
    const radioButton = (await screen.findByTestId(
      "actionConfiguration.testPath",
    ));

    expect(radioButton).toBeInTheDocument();

    const options = screen.getAllByRole("radio");

    expect(options[0]).toBeChecked();
    expect(options[1]).not.toBeChecked();
    expect(options[2]).not.toBeChecked();
  });

  it("should select the option when clicked", async () => {
    radioButtonProps = {
      ...radioButtonProps,
    };

    render(
      <Provider store={store}>
        <ReduxFormDecorator>
          <RadioButtonControl {...radioButtonProps} />
        </ReduxFormDecorator>
      </Provider>,
    );
    const radioButton = (await screen.findByTestId(
      "actionConfiguration.testPath",
    ));

    expect(radioButton).toBeInTheDocument();

    const options = screen.getAllByRole("radio");

    expect(options[0]).toBeChecked();
    expect(options[1]).not.toBeChecked();
    expect(options[2]).not.toBeChecked();

    options[1].click();

    expect(options[0]).not.toBeChecked();
    expect(options[1]).toBeChecked();
    expect(options[2]).not.toBeChecked();
  });
});
