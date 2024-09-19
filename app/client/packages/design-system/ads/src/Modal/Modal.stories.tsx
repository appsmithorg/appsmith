import React, { useState } from "react";
import { useArgs } from "@storybook/preview-api";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalTrigger,
} from "./Modal";
import { Button } from "../Button";
import { Text } from "../Text";
import type { ModalHeaderProps } from "./Modal.types";
import type { StoryObj } from "@storybook/react";
import type { DialogProps } from "@radix-ui/react-dialog";

export default {
  title: "ADS/Components/Modal",
  component: Modal,
  argTypes: {
    open: {
      control: {
        type: "boolean",
      },
      description:
        "Open state of the modal. Make sure onClose is passed in ModalHeader.",
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
      description: "Callback for when the modal is opened or closed",
      table: {
        type: {
          summary: "(open: boolean) => void",
        },
        defaultValue: {
          summary: "undefined",
        },
      },
    },
    children: {
      description: "Content of the modal",
      table: {
        type: {
          summary: "React.ReactNode",
        },
        defaultValue: {
          summary: "undefined",
        },
      },
    },
  },
};

// eslint-disable-next-line react/function-component-definition
const ModalHeaderTemplate = (args: ModalHeaderProps) => {
  const [{}, updateArgs] = useArgs();
  const changeOpenState = (state: boolean) => updateArgs({ open: state });

  return (
    <Modal onOpenChange={changeOpenState}>
      <ModalTrigger>
        <Button>Open Modal</Button>
      </ModalTrigger>
      <ModalContent>
        <ModalHeader isCloseButtonVisible={false}>{args.children}</ModalHeader>
      </ModalContent>
    </Modal>
  );
};

export const ModalHeaderStory = ModalHeaderTemplate.bind({}) as StoryObj;
ModalHeaderStory.storyName = "Header";
ModalHeaderStory.args = {
  children: "Modal Header",
};

// eslint-disable-next-line react/function-component-definition
const ModalBodyTemplate = (args: { children: React.ReactNode }) => {
  const [{}, updateArgs] = useArgs();
  const changeOpenState = (state: boolean) => updateArgs({ open: state });

  return (
    <Modal onOpenChange={changeOpenState}>
      <ModalTrigger>
        <Button>Open Modal</Button>
      </ModalTrigger>
      <ModalContent>
        <ModalBody>
          <Text kind="body-m">{args.children}</Text>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export const ModalBodyStory = ModalBodyTemplate.bind({}) as StoryObj;
ModalBodyStory.storyName = "Body";
ModalBodyStory.args = {
  children:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed tincidunt, nisl eget aliquam tincidunt, nunc nisl aliquam nisl, et aliquam nisl nisl eget nisl.",
};

// eslint-disable-next-line react/function-component-definition
const ModalFooterTemplate = () => {
  const [{}, updateArgs] = useArgs();
  const changeOpenState = (state: boolean) => updateArgs({ open: state });

  return (
    <Modal onOpenChange={changeOpenState}>
      <ModalTrigger>
        <Button>Open Modal</Button>
      </ModalTrigger>
      <ModalContent>
        <ModalFooter>
          <Button kind="secondary" size="md">
            Cancel
          </Button>
          <Button kind="primary" size="md">
            Save
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export const ModalFooterStory = ModalFooterTemplate.bind({}) as StoryObj;
ModalFooterStory.storyName = "Footer";
ModalFooterStory.args = {};

// eslint-disable-next-line react/function-component-definition
const ModalWithFooterTemplate = (args: DialogProps) => {
  const [{}, updateArgs] = useArgs();
  const changeOpenState = (state: boolean) => updateArgs({ open: state });

  return (
    <Modal {...args} onOpenChange={changeOpenState}>
      <ModalTrigger>
        <Button>Open Modal</Button>
      </ModalTrigger>
      <ModalContent>
        <ModalHeader>Modal Header</ModalHeader>
        <ModalBody>
          <Text kind="body-m">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
            tincidunt, nisl eget aliquam tincidunt, nunc nisl aliquam nisl, et
            aliquam nisl nisl sit amet nisl. Sed tincidunt, nisl eget aliquam
            tincidunt, nunc nisl aliquam nisl, et aliquam nisl nisl sit amet
            nisl. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
            tincidunt, nisl eget aliquam tincidunt, nunc nisl aliquam nisl, et
            aliquam nisl nisl sit amet nisl. Sed tincidunt, nisl eget aliquam
            tincidunt, nunc nisl aliquam nisl, et aliquam nisl nisl sit amet
            nisl.
          </Text>
        </ModalBody>
        <ModalFooter>
          <Button kind="secondary" size="md">
            Cancel
          </Button>
          <Button kind="primary" size="md">
            Save
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export const ModalStory = ModalWithFooterTemplate.bind({}) as StoryObj;
ModalStory.storyName = "With Footer";
ModalStory.args = {};

// eslint-disable-next-line react/function-component-definition
const ModalWithoutFooter = (args: DialogProps) => {
  const [{}, updateArgs] = useArgs();
  const changeOpenState = (state: boolean) => {
    updateArgs({ open: state });
  };

  return (
    <Modal {...args} onOpenChange={changeOpenState}>
      <ModalTrigger>
        <Button>Open Modal</Button>
      </ModalTrigger>
      <ModalContent>
        <ModalHeader>Modal Header</ModalHeader>
        <ModalBody>
          <Text kind="body-m">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
            tincidunt, nisl eget aliquam tincidunt, nunc nisl aliquam nisl, et
            aliquam nisl nisl sit amet nisl. Sed tincidunt, nisl eget aliquam
            tincidunt, nunc nisl aliquam nisl, et aliquam nisl nisl sit amet
            nisl.
          </Text>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export const ModalStoryTwo = ModalWithoutFooter.bind({}) as StoryObj;
ModalStoryTwo.storyName = "Without Footer";
ModalStoryTwo.args = {};

export function OpenModalProgrammatically() {
  const [isModalOpen, setModalOpen] = useState(false);
  const handleOnChange = () => {
    setModalOpen(!isModalOpen);
  };

  return (
    <>
      <Button kind="secondary" onClick={handleOnChange} size="md">
        I am a button that is not in ModalTrigger. Click me
      </Button>
      <Modal onOpenChange={setModalOpen} open={isModalOpen}>
        <ModalContent>
          <ModalBody>Here is a thing</ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
