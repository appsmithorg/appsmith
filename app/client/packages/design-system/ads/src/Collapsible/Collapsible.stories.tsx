import React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleHeader,
} from "./Collapsible";
import { Text } from "../Text";
import { useArgs } from "@storybook/client-api";
import { ARROW_POSITIONS } from "./Collapsible.types";

export default {
  title: "ADS/Collapsible",
  decorators: [
    (Story) => <div style={{ width: "95%", maxWidth: "500px" }}>{Story()}</div>,
  ],
  component: Collapsible,
  parameters: {
    docs: {
      description: {
        component:
          "Collapsibles can expand when clicked on. They allow you to hide content that is not immediately relevant to the user.",
      },
    },
  },
  subcomponents: {
    CollapsibleContent,
    CollapsibleHeader,
  },
} as ComponentMeta<typeof Collapsible>;

// eslint-disable-next-line react/function-component-definition
const CollapsibleTemplate: ComponentStory<typeof Collapsible> = (args) => {
  const [{ arrowPosition, className, isOpen }, updateArgs] = useArgs();
  const changeOpenState = (state: boolean) => updateArgs({ isOpen: state });

  return (
    <Collapsible
      className={className}
      isOpen={isOpen}
      onOpenChange={changeOpenState}
    >
      <CollapsibleHeader arrowPosition={arrowPosition}>
        <Text>Collapsible Header</Text>
      </CollapsibleHeader>
      <CollapsibleContent>
        <Text kind="body-m">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
          tincidunt, nisl eget aliquam tincidunt, nunc nisl aliquam nisl, et
          aliquam nisl nisl sit amet nisl. Sed tincidunt, nisl eget aliquam
          tincidunt, nunc nisl aliquam nisl, et aliquam nisl nisl sit amet nisl.
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
          tincidunt, nisl eget aliquam tincidunt, nunc nisl aliquam nisl, et
          aliquam nisl nisl sit amet nisl. Sed tincidunt, nisl eget aliquam
          tincidunt, nunc nisl aliquam nisl, et aliquam nisl nisl sit amet nisl.
        </Text>
      </CollapsibleContent>
    </Collapsible>
  );
};

export const CollapsibleStory = CollapsibleTemplate.bind({});
CollapsibleStory.storyName = "Collapsible";
CollapsibleStory.args = {
  isOpen: false,
  arrowPosition: ARROW_POSITIONS.START,
};
CollapsibleStory.argTypes = {
  children: {
    description: "Both header and content of the collapsible will go here.",
    table: {
      type: {
        summary: "React.ReactNode",
      },
      defaultValue: {
        summary: "undefined",
      },
    },
  },
  isOpen: {
    control: {
      type: "boolean",
    },
    description: "The open state of the collapsible.",
    table: {
      type: {
        summary: "boolean",
      },
      defaultValue: {
        summary: "false",
      },
    },
  },
  onOpenChange: {
    action: "onOpenChange",
    description: "Callback for when the collapsible is opened or closed.",
    table: {
      type: {
        summary: "(isOpen: boolean) => void",
      },
      defaultValue: {
        summary: "undefined",
      },
    },
  },
  className: {
    description: "(try not to) pass addition classes here.",
    table: {
      type: {
        summary: "string",
      },
    },
  },
  arrowPosition: {
    control: "radio",
    options: ["start", "end"],
    defaultValue: "start",
    description: "Position of the arrow icons.",
    table: {
      type: {
        summary: `"start" | "end"`,
      },
      defaultValue: {
        summary: "start",
      },
    },
  },
};

// eslint-disable-next-line react/function-component-definition
const CollapsibleHeaderTemplate: ComponentStory<typeof CollapsibleHeader> = (
  args,
) => {
  const [{ arrowPosition, className, isOpen }, updateArgs] = useArgs();
  const changeOpenState = (state: boolean) => updateArgs({ isOpen: state });

  return (
    <Collapsible isOpen={isOpen} onOpenChange={changeOpenState}>
      <CollapsibleHeader arrowPosition={arrowPosition} className={className}>
        {args.children}
      </CollapsibleHeader>
    </Collapsible>
  );
};

export const CollapsibleHeaderStory = CollapsibleHeaderTemplate.bind({});
CollapsibleHeaderStory.storyName = "Header";
CollapsibleHeaderStory.args = {
  children: <Text>Collapsible Header</Text>,
  isOpen: false,
  arrowPosition: ARROW_POSITIONS.START,
};
CollapsibleHeaderStory.argTypes = {
  children: {
    description: `Any React Node that will go in the header.
    Clicking on this will toggle the collapsible.`,
    table: {
      type: {
        summary: "React.ReactNode",
      },
      defaultValue: {
        summary: "undefined",
      },
    },
  },
  className: {
    description: "(try not to) pass addition classes here.",
    table: {
      type: {
        summary: "string",
      },
    },
  },
  arrowPosition: {
    control: "radio",
    options: ["start", "end"],
    defaultValue: "start",
    description: "Position of the arrow icons.",
    table: {
      type: {
        summary: `"start" | "end"`,
      },
      defaultValue: {
        summary: "start",
      },
    },
  },
};

// eslint-disable-next-line react/function-component-definition
const CollapsibleContentTemplate: ComponentStory<typeof CollapsibleContent> = (
  args,
) => {
  const [{ className, isOpen }, updateArgs] = useArgs();
  const changeOpenState = (state: boolean) => updateArgs({ isOpen: state });

  return (
    <Collapsible isOpen={isOpen} onOpenChange={changeOpenState}>
      <CollapsibleContent className={className}>
        {args.children}
      </CollapsibleContent>
    </Collapsible>
  );
};

export const CollapsibleContentStory = CollapsibleContentTemplate.bind({});
CollapsibleContentStory.storyName = "Content";
CollapsibleContentStory.args = {
  isOpen: true,
  children: (
    <Text kind="body-m">
      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed tincidunt,
      nisl eget aliquam tincidunt, nunc nisl aliquam nisl, et aliquam nisl nisl
      sit amet nisl. Sed tincidunt, nisl eget aliquam tincidunt, nunc nisl
      aliquam nisl, et aliquam nisl nisl sit amet nisl. Lorem ipsum dolor sit
      amet, consectetur adipiscing elit. Sed tincidunt, nisl eget aliquam
      tincidunt, nunc nisl aliquam nisl, et aliquam nisl nisl sit amet nisl. Sed
      tincidunt, nisl eget aliquam tincidunt, nunc nisl aliquam nisl, et aliquam
      nisl nisl sit amet nisl.
    </Text>
  ),
};
CollapsibleContentStory.argTypes = {
  children: {
    description: "Content to be displayed when the component is expanded.",
    table: {
      type: {
        summary: "React.ReactNode",
      },
      defaultValue: {
        summary: "undefined",
      },
    },
  },
  className: {
    description: "(try not to) pass addition classes here.",
    table: {
      type: {
        summary: "string",
      },
    },
  },
};
