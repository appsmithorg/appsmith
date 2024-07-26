import React, { useState } from "react";
import { Select, Option } from "./Select";
import { Icon } from "../Icon";
import { Checkbox } from "../Checkbox";
import type { SelectProps } from "./Select.types";
import type { StoryObj } from "@storybook/react";

export default {
  title: "ADS/Components/Select",
  component: Select,
  decorators: [
    (Story: () => React.ReactNode) => (
      <div style={{ width: "100%", maxWidth: "250px", margin: "0 auto" }}>
        {Story()}
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component: `Select component is used for forms and input fields where users are required to choose from a limited set of options.<br /><br />
        **Known Issues** <br />
        <ul>
          <li>When **virtual** flag is true (default is true), last item in the list is not shown completely.</li>
        </ul>
        `,
      },
    },
  },
};

// eslint-disable-next-line react/function-component-definition
const SelectTemplate = ({ ...args }) => {
  return (
    <Select {...args}>
      <Option value="value 1">Option 1</Option>
      <Option value="value 2">Option 2</Option>
      <Option value="value 3">Option 3</Option>
      <Option value="value 4">Option 4</Option>
      <Option value="value 5">Option 5</Option>
    </Select>
  );
};

const ArgTypes = {
  id: {
    control: {
      type: "text",
    },
    description: "html id to set on the component wrapper",
    table: {
      type: {
        summary: "string",
      },
      defaultValue: {
        summary: "undefined",
      },
    },
  },
  className: {
    control: {
      type: "text",
    },
    description: "className to set on the component wrapper",
    table: {
      type: {
        summary: "string",
      },
      defaultValue: {
        summary: "undefined",
      },
    },
  },
  size: {
    control: {
      type: "select",
      options: ["sm", "md"],
    },
    description: "Size of the select",
    table: {
      type: {
        summary: "string",
      },
      defaultValue: {
        summary: "md",
      },
    },
  },
  dropdownMatchSelectWidth: {
    control: {
      type: "boolean",
    },
    description: "Whether dropdown's width matches select's or not",
    table: {
      type: {
        summary: "boolean",
      },
      defaultValue: {
        summary: "true",
      },
    },
  },
  dropdownClassName: {
    control: {
      type: "text",
    },
    description: "className to set on the dropdown wrapper",
    table: {
      type: {
        summary: "string",
      },
      defaultValue: {
        summary: "undefined",
      },
    },
  },
  dropdownAlign: {
    control: {
      type: "object",
    },
    description: "Dropdown menu position align config",
    table: {
      type: {
        summary: "object",
      },
      defaultValue: {
        summary: "undefined",
      },
    },
  },
  notFoundContent: {
    control: {
      type: "text",
    },
    description: "Content to display when search fetches no matching results.",
    table: {
      type: {
        summary: "ReactNode",
      },
      defaultValue: {
        summary: "undefined",
      },
    },
  },
  open: {
    control: {
      type: "boolean",
    },
    description: "Control dropdown open state",
    table: {
      type: {
        summary: "boolean",
      },
      defaultValue: {
        summary: "undefined",
      },
    },
  },
  defaultOpen: {
    control: {
      type: "boolean",
    },
    description: "Initial dropdown open state",
    table: {
      type: {
        summary: "boolean",
      },
      defaultValue: {
        summary: "false",
      },
    },
  },
  placeholder: {
    control: {
      type: "text",
    },
    description: "Placeholder of select",
    table: {
      type: {
        summary: "string",
      },
      defaultValue: {
        summary: "Please select",
      },
    },
  },
  showSearch: {
    control: {
      type: "boolean",
    },
    description: "Whether to show search input.",
    table: {
      type: {
        summary: "boolean",
      },
      defaultValue: {
        summary: "false",
      },
    },
  },
  allowClear: {
    control: {
      type: "boolean",
    },
    description: "Show clear button",
    table: {
      type: {
        summary: "boolean",
      },
      defaultValue: {
        summary: "false",
      },
    },
  },
  maxTagTextLength: {
    control: {
      type: "number",
    },
    description:
      "Max tag text length to show. Only works if content is text and isMultiSelect is true.",
    table: {
      type: {
        summary: "number",
      },
      defaultValue: {
        summary: "5",
      },
    },
  },
  maxTagCount: {
    control: {
      type: "number",
    },
    description: "Max tag count to show. Only works in isMultiSelect mode.",
    table: {
      type: {
        summary: "number",
      },
      defaultValue: {
        summary: "2",
      },
    },
  },
  maxTagPlaceholder: {
    control: {
      type: "text",
    },
    description: "Max tag placeholder. Only works in isMultiSelect mode.",
    table: {
      type: {
        summary: "ReactNode/function(omittedValues)",
      },
      defaultValue: {
        summary:
          "(omittedValues: any[]) => { return `+${omittedValues.length}`;};",
      },
    },
  },
  isMultiSelect: {
    control: {
      type: "boolean",
    },
    description: "Support multiple selections.",
    table: {
      type: {
        summary: "boolean",
      },
      defaultValue: {
        summary: "false",
      },
    },
  },
  isDisabled: {
    control: {
      type: "boolean",
    },
    description: "Whether select is disabled",
    table: {
      type: {
        summary: "boolean",
      },
      defaultValue: {
        summary: "false",
      },
    },
  },
  isLoading: {
    control: {
      type: "boolean",
    },
    description: "Whether select is loading",
    table: {
      type: {
        summary: "boolean",
      },
      defaultValue: {
        summary: "false",
      },
    },
  },
  filterOption: {
    control: {
      type: "boolean",
    },
    description:
      "Whether to filter options by input value. By default the filter is the optionFilterProp value.",
    table: {
      type: {
        summary: "boolean",
      },
      defaultValue: {
        summary: "true/Function(inputValue:string, option:Option)",
      },
    },
  },
  optionFilterProp: {
    control: {
      type: "text",
    },
    description:
      "which prop value of option will be used for filter if filterOption is true",
    table: {
      type: {
        summary: "string",
      },
      defaultValue: {
        summary: "value",
      },
    },
  },
  filterSort: {
    control: {
      type: "text",
    },
    description:
      "Sort function for search options sorting, see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort compareFunction.",
    table: {
      type: {
        summary: "Function(optionA:Option, optionB: Option)",
      },
      defaultValue: {
        summary: "undefined",
      },
    },
  },
  optionLabelProp: {
    control: {
      type: "text",
    },
    description: "which prop value of option will render as content of select",
    table: {
      type: {
        summary: "String: 'value'/'children'",
      },
      defaultValue: {
        summary: "children",
      },
    },
  },
  defaultValue: {
    control: {
      type: "text",
    },
    description: "Initial selected option",
    table: {
      type: {
        summary: "string | string[]",
      },
      defaultValue: {
        summary: "undefined",
      },
    },
  },
  // TODO: It seems like there is no difference between `label` and `value`; document it or change it accordingly
  value: {
    control: {
      type: "text",
    },
    description: "Current selected option",
    table: {
      type: {
        summary:
          "String | String[] | {key:String, label:React.Node} | {key:String, label:React.Node}[]",
      },
      defaultValue: {
        summary: "undefined",
      },
    },
  },
  onSearch: {
    control: {
      type: "text",
    },
    description: "Called when input changed.",
    table: {
      type: {
        summary: "(value: string) => void",
      },
      defaultValue: {
        summary: "undefined",
      },
    },
  },
  onBlur: {
    control: {
      type: "text",
    },
    description: "Called when blur",
    table: {
      type: {
        summary: "(event) => void",
      },
      defaultValue: {
        summary: "undefined",
      },
    },
  },
  onFocus: {
    control: {
      type: "text",
    },
    description: "Called when focus",
    table: {
      type: {
        summary: "(event) => void",
      },
      defaultValue: {
        summary: "undefined",
      },
    },
  },
  onPopupScroll: {
    control: {
      type: "text",
    },
    description: "Called when popup scroll",
    table: {
      type: {
        summary: "(event) => void",
      },
      defaultValue: {
        summary: "undefined",
      },
    },
  },
  onSelect: {
    control: {
      type: "text",
    },
    description:
      "Called when a option is selected. Param is option's value and option instance",
    table: {
      type: {
        summary: "(value, option:Option) => void",
      },
      defaultValue: {
        summary: "undefined",
      },
    },
  },
  onDeselect: {
    control: {
      type: "text",
    },
    description:
      "Called when a option is deselected. Param is option's value. Only called for multiple or tags",
    table: {
      type: {
        summary: "(value, option:Option) => void",
      },
      defaultValue: {
        summary: "undefined",
      },
    },
  },
  onInputKeyDown: {
    control: {
      type: "text",
    },
    description: "Called when input key down",
    table: {
      type: {
        summary: "(e) => void",
      },
      defaultValue: {
        summary: "undefined",
      },
    },
  },
  onClear: {
    control: {
      type: "text",
    },
    description: "Called when clear selected",
    table: {
      type: {
        summary: "() => void",
      },
      defaultValue: {
        summary: "undefined",
      },
    },
  },
  onChange: {
    control: {
      type: "text",
    },
    description:
      "Called when a option is selected/deselected. Param is selected option's value or value array for multiple or tags",
    table: {
      type: {
        summary: "(value, option:Option) => void",
      },
      defaultValue: {
        summary: "undefined",
      },
    },
  },
  defaultActiveFirstOption: {
    control: {
      type: "boolean",
    },
    description: "Whether to show first option as active",
    table: {
      type: {
        summary: "boolean",
      },
      defaultValue: {
        summary: "true",
      },
    },
  },
  autoFocus: {
    control: {
      type: "boolean",
    },
    description: "Focus the select input element when component mounted",
    table: {
      type: {
        summary: "boolean",
      },
      defaultValue: {
        summary: "false",
      },
    },
  },
  autoClearSearchValue: {
    control: {
      type: "boolean",
    },
    description:
      "Auto clear search input value when multiple select is selected/deselected",
    table: {
      type: {
        summary: "boolean",
      },
      defaultValue: {
        summary: "true",
      },
    },
  },
  virtual: {
    control: {
      type: "boolean",
    },
    description:
      "Use virtual scroll to render options. This enables better performance if the list is too long.",
    table: {
      type: {
        summary: "boolean",
      },
      defaultValue: {
        summary: "true",
      },
    },
  },
  isValid: {
    control: {
      type: "boolean",
    },
    description:
      "Whether the input should display its valid or invalid visual styling.",
    table: {
      type: {
        summary: "valid | invalid",
      },
      defaultValue: {
        summary: "undefined",
      },
    },
  },
  listHeight: {
    control: {
      type: "number",
    },
    description: "Height of the list",
    table: {
      type: {
        summary: "number",
      },
      defaultValue: {
        summary: "250",
      },
    },
  },
};

const consoleStyle = "color: #ff7818; font-weight: bold;";

export const SelectStory = SelectTemplate.bind({}) as StoryObj;
SelectStory.storyName = "Select";
SelectStory.argTypes = ArgTypes;
SelectStory.args = {
  optionLabelProp: "value",
  autoClearSearchValue: false,
  onSearch: (v: unknown) => {
    // eslint-disable-next-line no-console
    console.info("%conSearch", consoleStyle);
    // eslint-disable-next-line no-console
    console.log("value -", v);
  },
  onBlur: (e: unknown) => {
    // eslint-disable-next-line no-console
    console.info("%conBlur", consoleStyle);
    // eslint-disable-next-line no-console
    console.log("event -", e);
  },
  onFocus: (e: unknown) => {
    // eslint-disable-next-line no-console
    console.info("%conFocus", consoleStyle);
    // eslint-disable-next-line no-console
    console.log("event -", e);
  },
  onDropdownVisibleChange: (v: unknown) => {
    // eslint-disable-next-line no-console
    console.info("%conDropdownVisibleChange", consoleStyle);
    // eslint-disable-next-line no-console
    console.log("value -", v);
  },
  onInputKeyDown: (e: unknown) => {
    // eslint-disable-next-line no-console
    console.info("%conInputKeyDown", consoleStyle);
    // eslint-disable-next-line no-console
    console.log("event -", e);
  },
  onChange: (v: unknown) => {
    // eslint-disable-next-line no-console
    console.info("%conChange", consoleStyle);
    // eslint-disable-next-line no-console
    console.log("value -", v);
  },
  onSelect: (v: unknown, option: unknown) => {
    // eslint-disable-next-line no-console
    console.info("%conSelect", consoleStyle);
    // eslint-disable-next-line no-console
    console.log("value = ", v);
    // eslint-disable-next-line no-console
    console.log("option = ", option);
  },
  onDeselect: (v: unknown, option: unknown) => {
    // eslint-disable-next-line no-console
    console.info("%conDeselect", consoleStyle);
    // eslint-disable-next-line no-console
    console.log("value = ", v);
    // eslint-disable-next-line no-console
    console.log("option = ", option);
  },
  onClear: () => {
    // eslint-disable-next-line no-console
    console.info("%conClear", consoleStyle);
  },
  onPopupScroll: (e: unknown) => {
    // eslint-disable-next-line no-console
    console.info("%conPopupScroll", consoleStyle);
    // eslint-disable-next-line no-console
    console.log("event -", e);
  },
};

export const SelectSearchStory = SelectTemplate.bind({}) as StoryObj;
SelectSearchStory.args = {
  ...SelectStory.args,
  showSearch: true,
};

export const SelectDisabledStory = SelectTemplate.bind({}) as StoryObj;
SelectDisabledStory.args = {
  ...SelectStory.args,
  isDisabled: true,
};

export const SelectLoadingStory = SelectTemplate.bind({}) as StoryObj;
SelectLoadingStory.args = {
  ...SelectStory.args,
  isLoading: true,
};

export const SelectInvalidStory = SelectTemplate.bind({}) as StoryObj;
SelectInvalidStory.args = {
  ...SelectStory.args,
  isValid: false,
};

export const SelectMultiselectStory = SelectTemplate.bind({}) as StoryObj;
SelectMultiselectStory.args = {
  ...SelectStory.args,
  isMultiSelect: true,
};

// eslint-disable-next-line react/function-component-definition
const OptionTemplate = ({
  children,
  ...args
}: {
  children: React.ReactNode;
}) => {
  return (
    <Select defaultValue="option 2" open size="md">
      <Option {...args} value="Test">
        {children ?? (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Icon name="arrow-left-line" size="md" />
            Option 1
          </div>
        )}
      </Option>
    </Select>
  );
};

export const OptionStory = OptionTemplate.bind({}) as StoryObj;
OptionStory.storyName = "Option";
OptionStory.argTypes = {
  className: {
    control: {
      type: "string",
    },
    description: "Custom class name",
    table: {
      type: {
        summary: "string",
      },
      defaultValue: {
        summary: "undefined",
      },
    },
  },
  disabled: {
    control: {
      type: "boolean",
    },
    description: "Disable the option",
    table: {
      type: {
        summary: "boolean",
      },
      defaultValue: {
        summary: "false",
      },
    },
  },
  value: {
    control: {
      type: "text",
    },
    description: "Value of the option",
    table: {
      type: {
        summary: "string",
      },
      defaultValue: {
        summary: "undefined",
      },
    },
  },
  size: {
    table: {
      disable: true,
    },
  },
  key: {
    control: {
      type: "text",
    },
    description: "Key of the option",
    table: {
      type: {
        summary: "string",
      },
      defaultValue: {
        summary: "undefined",
      },
    },
  },
  children: {
    control: {
      type: "text",
    },
    description: "Content of the option",
    table: {
      type: {
        summary: "React.Node",
      },
      defaultValue: {
        summary: "undefined",
      },
    },
  },
  isMultiSelect: {
    table: {
      disable: true,
    },
  },
};

// eslint-disable-next-line react/function-component-definition
const Template = (args: SelectProps) => {
  return (
    <Select {...args}>
      <Option value="value 1">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Icon name="arrow-left-line" size="md" />
          Option 1
        </div>
      </Option>
      <Option disabled value="option 2">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Icon name="arrow-left-line" size="md" />
          Option 2
        </div>
      </Option>
      <Option value="option 3">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Icon name="arrow-left-line" size="md" />
          Option 3
        </div>
      </Option>
      <Option value="option 4">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Icon name="arrow-left-line" size="md" />
          Option 4
        </div>
      </Option>
      <Option value="option 5">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Icon name="arrow-left-line" size="md" />
          Option 5
        </div>
      </Option>
      <Option value="option 6">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Icon name="arrow-left-line" size="md" />
          Option 6
        </div>
      </Option>
      <Option value="option 7">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Icon name="arrow-left-line" size="md" />
          Option 7
        </div>
      </Option>
      <Option value="option 8">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Icon name="arrow-left-line" size="md" />
          Option 8
        </div>
      </Option>
      <Option value="option 9">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Icon name="arrow-left-line" size="md" />
          Option 9
        </div>
      </Option>
      <Option value="option 10">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Icon name="arrow-left-line" size="md" />
          Option 10
        </div>
      </Option>
      <Option value="option 11">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Icon name="arrow-left-line" size="md" />
          Option 11
        </div>
      </Option>
      <Option value="option 12">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Icon name="arrow-left-line" size="md" />
          Option 12
        </div>
      </Option>
      <Option value="option 13">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Icon name="arrow-left-line" size="md" />
          Option 13
        </div>
      </Option>
      <Option value="option 14">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Icon name="arrow-left-line" size="md" />
          Option 14
        </div>
      </Option>
      <Option value="option 15">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Icon name="arrow-left-line" size="md" />
          Option 15
        </div>
      </Option>
    </Select>
  );
};

export const ComplexSelectStory = Template.bind({}) as StoryObj;
ComplexSelectStory.storyName = "Select with complex options";
ComplexSelectStory.args = {
  size: "md",
};
ComplexSelectStory.argTypes = ArgTypes;

const options = [
  {
    label: "label 1",
    value: "value 1",
    key: "001",
  },
  {
    label: "A longer label to force a line break",
    value: "value 2",
    key: "002",
  },
  {
    label: "label 3",
    value: "value 3",
    key: "003",
  },
];
export function SelectWithCheckbox() {
  const [selectedOptions, setSelectedOptions] = useState([]);

  return (
    <Select
      isMultiSelect
      onDeselect={(value, unselectedOption) =>
        setSelectedOptions(
          // @ts-expect-error type error
          selectedOptions.filter((opt) => opt.value !== unselectedOption.value),
        )
      }
      onSelect={(value, newSelectedOption) =>
        // @ts-expect-error type error
        setSelectedOptions([...selectedOptions, newSelectedOption])
      }
      optionLabelProp="label"
      value={selectedOptions}
    >
      {options.map((option) => (
        <Option key={option.key}>
          <Checkbox
            isSelected={selectedOptions.find(
              // @ts-expect-error type error
              (selectedOption) => selectedOption.key == option.key,
            )}
          >
            {option.label}
          </Checkbox>
        </Option>
      ))}
    </Select>
  );
}
