import React from "react";
import { Input } from "./Input";
import type { InputProps } from "./Input.types";
import type { StoryObj } from "@storybook/react";

export default {
  title: "ADS/Components/Input",
  component: Input,
  argTypes: {
    renderAs: {
      control: {
        type: "radio",
        options: ["input", "textarea"],
      },
      description: "Attribute to change the rendering component",
      table: {
        type: {
          summary: "input | textarea",
        },
        defaultValue: {
          summary: "input",
        },
      },
    },
    className: {
      control: {
        type: "text",
      },
      description: "(try not to) pass addition classes here",
      table: {
        type: {
          summary: "string",
        },
        defaultValue: {
          summary: "",
        },
      },
    },
    labelPosition: {
      control: {
        type: "radio",
        options: ["top", "left"],
      },
      description: "Position of the label",
      table: {
        type: {
          summary: "top | left",
        },
        defaultValue: {
          summary: "top",
        },
      },
    },
    startIcon: {
      control: {
        type: "text",
      },
      description: "Start icon",
    },
    endIcon: {
      control: {
        type: "text",
      },
      description: "End icon",
    },
    UNSAFE_width: {
      control: {
        type: "text",
      },
      description:
        "UNSAFE width of the input. Try not to use this and use size instead.",
    },
    UNSAFE_height: {
      control: {
        type: "text",
      },
      description:
        "UNSAFE height of the input. Try not to use this and use size instead.",
    },
    size: {
      control: {
        type: "radio",
        options: ["sm", "md"],
      },
      description: "Size of the input",
      table: {
        type: {
          summary: "sm | md",
        },
        defaultValue: {
          summary: "sm",
        },
      },
    },
    label: {
      control: {
        type: "text",
      },
      description: "Label of the input.",
    },
    placeholder: {
      control: {
        type: "text",
      },
      description: "Placeholder of the input.",
    },
    errorMessage: {
      control: {
        type: "text",
      },
      description:
        "Error message of the input. Based on this, the input will show error state.",
    },
    description: {
      control: {
        type: "text",
      },
      description: "Description of the input.",
    },
    isRequired: {
      control: {
        type: "boolean",
      },
      description: "Whether the input is required or not.",
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
      description: "Whether the input is disabled or not.",
      table: {
        type: {
          summary: "boolean",
        },
        defaultValue: {
          summary: "false",
        },
      },
    },
    isReadOnly: {
      control: {
        type: "boolean",
      },
      description: "Whether the input is read only or not.",
      table: {
        type: {
          summary: "boolean",
        },
        defaultValue: {
          summary: "false",
        },
      },
    },
    onChange: {
      control: {
        type: "text",
      },
      description: "onChange trigger of the input.",
    },
  },
  parameters: { controls: { sort: "requiredFirst" } },
  decorators: [
    (Story: () => React.ReactNode) => (
      <div style={{ width: "100%", maxWidth: "250px", margin: "0 auto" }}>
        {Story()}
      </div>
    ),
  ],
};

// eslint-disable-next-line react/function-component-definition
const Template = (args: InputProps) => {
  return <Input {...args} />;
};

export const InputStory = Template.bind({}) as StoryObj;
InputStory.storyName = "Input";
InputStory.args = {
  label: "Label",
  placeholder: "Placeholder",
  description: "Description",
  startIcon: "arrow-left-s-line",
  endIcon: "arrow-right-s-line",
  size: "md",
};

export const InputTextareaStory = Template.bind({}) as StoryObj;
InputTextareaStory.args = {
  ...InputStory.args,
  renderAs: "textarea",
};
