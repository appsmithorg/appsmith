import React from "react";
import { render, screen, waitFor, fireEvent } from "test/testUtils";
import DropDownControl from "./DropDownControl";
import { reduxForm } from "redux-form";
import "@testing-library/jest-dom";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import type { SelectOptionProps } from "@appsmith/ads";

const mockStore = configureStore([]);

const initialValues = {
  actionConfiguration: { testPath: ["option1", "option2"] },
};

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TestForm(props: any) {
  return <div>{props.children}</div>;
}

const ReduxFormDecorator = reduxForm({ form: "TestForm", initialValues })(
  TestForm,
);

const mockOptions = [
  { label: "Option 1", value: "option1", children: "Option 1" },
  { label: "Option 2", value: "option2", children: "Option 2" },
  { label: "Option 3", value: "option3", children: "Option 3" },
];

const mockAction = {
  type: "API_ACTION",
  name: "Test API Action",
  datasource: { id: "datasource1", name: "Datasource 1" },
  actionConfiguration: {
    body: "",
    headers: [],
    testPath: ["option1", "option2"],
  },
};

const dropDownProps = {
  options: mockOptions,
  placeholderText: "Select Columns",
  isMultiSelect: true,
  configProperty: "actionConfiguration.testPath",
  controlType: "PROJECTION",
  propertyValue: "",
  label: "Columns",
  id: "column",
  formName: "",
  isValid: true,
  formValues: mockAction,
  isLoading: false,
  maxTagCount: 3,
};

describe("DropDownControl", () => {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let store: any;

  beforeEach(() => {
    store = mockStore({
      form: { TestForm: { values: initialValues } },
      appState: {},
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should renders dropdownControl and options properly", async () => {
    render(
      <Provider store={store}>
        <ReduxFormDecorator>
          <DropDownControl {...dropDownProps} />
        </ReduxFormDecorator>
      </Provider>,
    );

    const dropdownSelect = await waitFor(async () =>
      screen.findByTestId("t--dropdown-actionConfiguration.testPath"),
    );

    expect(dropdownSelect).toBeInTheDocument();

    const options = screen.getAllByText(/Optio.../);
    const optionCount = options.length;

    expect(optionCount).toBe(2);
  });

  it("should clear all selected options", async () => {
    render(
      <Provider store={store}>
        <ReduxFormDecorator>
          <DropDownControl {...dropDownProps} />
        </ReduxFormDecorator>
      </Provider>,
    );

    const clearAllButton = document.querySelector(".rc-select-clear");

    expect(clearAllButton).toBeInTheDocument();

    fireEvent.click(clearAllButton!);

    await waitFor(() => {
      const options = screen.queryAllByText(/Option.../);

      expect(options.length).toBe(0);
    });
  });

  it("should handle single select mode correctly", async () => {
    const singleSelectProps = {
      ...dropDownProps,
      isMultiSelect: false,
      configProperty: "actionConfiguration.singlePath",
      inputIcon: undefined,
      showArrow: undefined,
    };

    render(
      <Provider store={store}>
        <ReduxFormDecorator>
          <DropDownControl {...singleSelectProps} />
        </ReduxFormDecorator>
      </Provider>,
    );

    // Wait for component to be fully rendered
    const dropdownSelect = await screen.findByTestId(
      "t--dropdown-actionConfiguration.singlePath",
    );

    // Open dropdown
    fireEvent.mouseDown(dropdownSelect.querySelector(".rc-select-selector")!);

    // Wait for dropdown to be visible
    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeVisible();
    });

    // Select Option 1
    const option = screen.getByRole("option", { name: "Option 1" });

    fireEvent.click(option);

    // Wait for selection to be applied and verify
    await waitFor(() => {
      // Check if the selection is displayed
      const selectedItem = screen.getByText("Option 1", {
        selector: ".rc-select-selection-item",
      });

      expect(selectedItem).toBeInTheDocument();
    });

    // Check if the option is marked as selected
    const selectedOption = screen.getByRole("option", { name: "Option 1" });

    expect(selectedOption).toHaveClass("rc-select-item-option-selected");

    // Check that other options are not selected
    const options = screen.getAllByRole("option");
    const selectedCount = options.filter((opt: SelectOptionProps) =>
      opt.classList.contains("rc-select-item-option-selected"),
    ).length;

    expect(selectedCount).toBe(1);
  });

  it("should handle multi-select mode correctly", async () => {
    render(
      <Provider store={store}>
        <ReduxFormDecorator>
          <DropDownControl {...dropDownProps} />
        </ReduxFormDecorator>
      </Provider>,
    );

    const dropdownSelect = await screen.findByTestId(
      "t--dropdown-actionConfiguration.testPath",
    );

    // Open dropdown
    fireEvent.mouseDown(dropdownSelect.querySelector(".rc-select-selector")!);

    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeVisible();
    });

    // Verify initial selections (Option 1 and Option 2 are selected from initialValues)
    const initialSelectedOptions = screen
      .getAllByRole("option")
      .filter((opt) => opt.getAttribute("aria-selected") === "true");

    expect(initialSelectedOptions).toHaveLength(2);
  });

  it("should show placeholder if no option is selected", async () => {
    const updatedProps = { ...dropDownProps, options: [] };

    render(
      <Provider store={store}>
        <ReduxFormDecorator>
          <DropDownControl {...updatedProps} />
        </ReduxFormDecorator>
      </Provider>,
    );

    expect(screen.getByText("Select Columns")).toBeInTheDocument();
  });
});

describe("DropDownControl grouping tests", () => {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let store: any;

  beforeEach(() => {
    store = mockStore({
      form: {
        GroupingTestForm: { values: { actionConfiguration: { testPath: [] } } },
      },
    });
  });

  it("should render grouped options correctly", async () => {
    const mockOptionGroupConfig = {
      group1: { label: "Group 1", children: [] },
      group2: { label: "Group 2", children: [] },
    };

    const mockOptions = [
      {
        label: "Option 1",
        value: "1",
        optionGroupType: "group1",
        children: [],
      },
      {
        label: "Option 2",
        value: "2",
        children: [],
        // No group - should go to Others
      },
      {
        label: "Option 3",
        value: "3",
        optionGroupType: "group2",
        children: [],
      },
    ];

    const props = {
      ...dropDownProps,
      options: mockOptions,
      optionGroupConfig: mockOptionGroupConfig,
    };

    render(
      <Provider store={store}>
        <ReduxFormDecorator>
          <DropDownControl {...props} />
        </ReduxFormDecorator>
      </Provider>,
    );

    // 1. Grab the dropdown container
    const dropdownSelect = await waitFor(async () =>
      screen.findByTestId("t--dropdown-actionConfiguration.testPath"),
    );

    // Open dropdown
    fireEvent.mouseDown(dropdownSelect.querySelector(".rc-select-selector")!);

    // Verify group headers are present
    await waitFor(() => {
      expect(screen.getByText("Group 1")).toBeInTheDocument();
    });
    expect(screen.getByText("Group 2")).toBeInTheDocument();
    expect(screen.getByText("Others")).toBeInTheDocument();

    // Verify options are in correct groups
    const group1Option = screen.getByText("Option 1");
    const group2Option = screen.getByText("Option 3");
    const othersOption = screen.getByText("Option 2");

    expect(group1Option).toBeInTheDocument();
    expect(group2Option).toBeInTheDocument();
    expect(othersOption).toBeInTheDocument();
  });

  it("should append group identifiers to values when appendGroupIdentfierToValue is true", async () => {
    const mockOptionGroupConfig = {
      group1: { label: "Group 1", children: [] },
      group2: { label: "Group 2", children: [] },
    };

    const mockOptions = [
      {
        label: "Option 1",
        value: "1",
        optionGroupType: "group1",
        children: [],
      },
      {
        label: "Option 2",
        value: "2",
        children: [],
      },
      {
        label: "Option 3",
        value: "3",
        optionGroupType: "group2",
        children: [],
      },
    ];

    const props = {
      ...dropDownProps,
      options: mockOptions,
      optionGroupConfig: mockOptionGroupConfig,
      appendGroupIdentfierToValue: true,
      isMultiSelect: false,
    };

    render(
      <Provider store={store}>
        <ReduxFormDecorator>
          <DropDownControl {...props} />
        </ReduxFormDecorator>
      </Provider>,
    );

    // Open dropdown
    const dropdownSelect = await waitFor(async () =>
      screen.findByTestId("t--dropdown-actionConfiguration.testPath"),
    );

    fireEvent.mouseDown(dropdownSelect.querySelector(".rc-select-selector")!);

    // Select Option 1 (from group1)
    const option1 = screen.getByText("Option 1");

    fireEvent.click(option1);

    // Verify the stored value includes the group identifier
    await waitFor(() => {
      const formState = store.getState().form.TestForm.values;

      expect(formState.actionConfiguration.testPath).toBe("group1:1");
    });

    // Select Option 2 (from others group)
    fireEvent.mouseDown(dropdownSelect.querySelector(".rc-select-selector")!);

    const option2 = screen.getByText("Option 2");

    fireEvent.click(option2);

    // Verify the stored value includes the 'others' group identifier
    await waitFor(() => {
      const formState = store.getState().form.TestForm.values;

      expect(formState.actionConfiguration.testPath).toBe("others:2");
    });
  });

  it("should handle multi-select with group identifiers correctly", async () => {
    const mockOptionGroupConfig = {
      group1: { label: "Group 1", children: [] },
      group2: { label: "Group 2", children: [] },
    };

    const mockOptions = [
      {
        label: "Option 1",
        value: "1",
        optionGroupType: "group1",
        children: [],
      },
      {
        label: "Option 2",
        value: "2",
        children: [],
      },
      {
        label: "Option 3",
        value: "3",
        optionGroupType: "group2",
        children: [],
      },
    ];

    const props = {
      ...dropDownProps,
      options: mockOptions,
      optionGroupConfig: mockOptionGroupConfig,
      appendGroupIdentfierToValue: true,
      isMultiSelect: true,
    };

    render(
      <Provider store={store}>
        <ReduxFormDecorator>
          <DropDownControl {...props} />
        </ReduxFormDecorator>
      </Provider>,
    );

    // Open dropdown
    const dropdownSelect = await waitFor(async () =>
      screen.findByTestId("t--dropdown-actionConfiguration.testPath"),
    );

    fireEvent.mouseDown(dropdownSelect.querySelector(".rc-select-selector")!);

    // Select multiple options
    const option1 = screen.getByText("Option 1");
    const option2 = screen.getByText("Option 2");

    fireEvent.click(option1);
    fireEvent.click(option2);

    // Verify the stored values include group identifiers
    await waitFor(() => {
      const formState = store.getState().form.TestForm.values;

      expect(formState.actionConfiguration.testPath).toEqual([
        "group1:1",
        "others:2",
      ]);
    });

    // Test removal of an option
    const selectedOption1 = screen.getByText("Option 1");

    fireEvent.click(selectedOption1);

    // Verify the option was removed correctly
    await waitFor(() => {
      const formState = store.getState().form.TestForm.values;

      expect(formState.actionConfiguration.testPath).toEqual(["others:2"]);
    });
  });

  it("should handle edge cases with appendGroupIdentfierToValue", async () => {
    const mockOptionGroupConfig = {
      group1: { label: "Group 1", children: [] },
    };

    const mockOptions = [
      {
        label: "Option with colon",
        value: "value:with:colon",
        optionGroupType: "group1",
        children: [],
      },
      {
        label: "Option without group",
        value: "no_group_value",
        children: [],
      },
    ];

    const props = {
      ...dropDownProps,
      options: mockOptions,
      optionGroupConfig: mockOptionGroupConfig,
      appendGroupIdentfierToValue: true,
      isMultiSelect: true,
    };

    render(
      <Provider store={store}>
        <ReduxFormDecorator>
          <DropDownControl {...props} />
        </ReduxFormDecorator>
      </Provider>,
    );

    // Open dropdown
    const dropdownSelect = await waitFor(async () =>
      screen.findByTestId("t--dropdown-actionConfiguration.testPath"),
    );

    fireEvent.mouseDown(dropdownSelect.querySelector(".rc-select-selector")!);

    // Select both options
    const option1 = screen.getByText("Option with colon");
    const option2 = screen.getByText("Option without group");

    fireEvent.click(option1);
    fireEvent.click(option2);

    // Verify the stored values handle special cases correctly
    await waitFor(() => {
      const formState = store.getState().form.TestForm.values;

      expect(formState.actionConfiguration.testPath).toEqual([
        "group1:value:with:colon",
        "others:no_group_value",
      ]);
    });
  });
});

describe("DropdownControl Single select tests", () => {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let store: any;

  const initialValuesSingleSelect = {
    actionConfiguration: {
      testPath: "option1",
    },
  };

  const mockActionSingleSelect = {
    type: "API_ACTION",
    name: "Test API Action",
    datasource: {
      id: "datasource1",
      name: "Datasource 1",
    },
    actionConfiguration: {
      body: "",
      headers: [],
      testPath: "option1",
    },
  };

  const dropDownPropsSingleSelect = {
    options: mockOptions,
    placeholderText: "Select Columns",
    configProperty: "actionConfiguration.testPath",
    controlType: "PROJECTION",
    propertyValue: "",
    label: "Columns",
    id: "column",
    formName: "",
    isValid: true,
    formValues: mockActionSingleSelect,
    isLoading: false,
    maxTagCount: 3,
    isAllowClear: true,
  };

  beforeEach(() => {
    store = mockStore({
      form: {
        TestForm: {
          values: initialValuesSingleSelect,
        },
      },
      appState: {},
    });
  });
  it("should clear selected option", async () => {
    render(
      <Provider store={store}>
        <ReduxFormDecorator>
          <DropDownControl {...dropDownPropsSingleSelect} />
        </ReduxFormDecorator>
      </Provider>,
    );

    const clearAllButton = document.querySelector(".rc-select-clear");

    expect(clearAllButton).toBeInTheDocument();

    fireEvent.click(clearAllButton!);

    await waitFor(() => {
      const options = screen.queryAllByText(/Option.../);

      expect(options.length).toBe(0);
    });
  });
});
