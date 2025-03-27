import React, { type FunctionComponent } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Modal } from "@appsmith/wds";
import { ModalHeader, ModalFooter, ModalContent } from "@appsmith/wds";
import { SimpleModal } from "./SimpleModal";
import { ModalExamples } from "./ModalExamples";
import { CustomModal as CustomModalExample } from "./CustomModal";

/**
 * A modal is a floating element that displays information that requires immediate attention, appearing over the page content and blocking interactions with the page until it is dismissed.
 *
 * Modal developed on basis of Popover headless component. Additional information about functionality of Modal component can be found in the [Popover story](/docs/design-system-headless-popover--docs).
 */
const meta: Meta<typeof Modal> = {
  component: Modal,
  title: "WDS/Widgets/Modal",
  subcomponents: {
    ModalHeader: ModalHeader as FunctionComponent<unknown>,
    ModalFooter: ModalFooter as FunctionComponent<unknown>,
    ModalContent: ModalContent as FunctionComponent<unknown>,
  },
  render: () => <SimpleModal />,
};

export default meta;
type Story = StoryObj<typeof Modal>;

export const Main: Story = {};

export const ModalExample: Story = {
  render: () => <ModalExamples />,
};

export const CustomModal: Story = {
  render: () => <CustomModalExample />,
};
