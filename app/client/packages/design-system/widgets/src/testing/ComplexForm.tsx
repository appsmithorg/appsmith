import { useRef, useState } from "react";
import * as React from "react";
import {
  Button,
  Text,
  ToggleGroup,
  Checkbox,
  TooltipRoot,
  TooltipTrigger,
  TooltipContent,
  ToolbarButtons,
  Flex,
  Switch,
  RadioGroup,
  IconButton,
  TextArea,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalContent,
  TextInput,
  ComboBox,
} from "@appsmith/wds";
// This component is used only for testing purpose and is not used in the prod

export const ComplexForm = () => {
  const fakeSubmit = async () => {
    return new Promise<void>((resolve) =>
      setTimeout(() => {
        alert("Your order is on the way...");
        resolve();
      }, 500),
    );
  };

  const [isModalOpen, setModalOpen] = useState(false);
  const submitRef = useRef(null);

  return (
    <Flex
      direction="column"
      gap="spacing-6"
      style={{
        background: "var(--color-bg-elevation-1)",
        borderColor: "var(--color-bd-elevation-1)",
        borderRadius: "var(--border-radius-elevation-1)",
        borderStyle: "solid",
        borderWidth: 1,
        padding: "var(--outer-spacing-6)",
      }}
    >
      <Flex direction="column" gap="spacing-3">
        <Text size="heading">Your order</Text>
        <Text>Choose your favorite dishes and place an order.</Text>
      </Flex>

      <Flex direction="column" gap="spacing-5">
        <ToolbarButtons
          items={[
            { id: 1, label: "Fast food" },
            { id: 2, label: "Salads" },
            { id: 3, label: "Salads" },
            { id: 4, label: "Sauces" },
          ]}
        />

        <ToggleGroup
          items={[
            {
              value: "value-1",
              label: "Once a week",
            },
            { isSelected: true, value: "value-2", label: "Twice a week" },
          ]}
          label="Repeat order"
        >
          {({ isSelected, label, value }) => (
            <Switch isSelected={isSelected} key={value} value={value}>
              {label}
            </Switch>
          )}
        </ToggleGroup>

        <ToggleGroup
          items={[
            {
              value: "Hamburger",
              label: "Hamburger",
            },
            {
              value: "French fries",
              label: "French fries",
            },
            {
              value: "Coca-Cola",
              label: "Coca-Cola",
            },
          ]}
          label="Dishes"
        >
          {({ isSelected, label, value }) => (
            <Checkbox isSelected={isSelected} key={value} value={value}>
              {label}
            </Checkbox>
          )}
        </ToggleGroup>

        <RadioGroup
          items={[
            {
              value: "s",
              label: "S",
            },
            {
              value: "m",
              label: "M",
            },
            {
              value: "l",
              label: "L",
            },
            {
              value: "xl",
              label: "XL",
            },
          ]}
          label="Portion size"
        />

        <Flex direction="column" gap="spacing-3">
          <Flex direction="column" gap="spacing-2">
            <Text isBold>Feedback is important to us</Text>
            <Flex>
              <IconButton icon="star" variant="ghost" />
              <IconButton icon="star" variant="ghost" />
            </Flex>
          </Flex>
          <TextArea label="Your comment" />
        </Flex>
        <Flex gap="spacing-2">
          <TextInput />
          <ComboBox
            items={[
              {
                id: "s",
                label: "S",
              },
              {
                id: "m",
                label: "M",
              },
              {
                id: "l",
                label: "L",
              },
              {
                id: "xl",
                label: "XL",
              },
            ]}
          />
          <Button>Ok</Button>
        </Flex>
        <Flex gap="spacing-2">
          <TextInput size="small" />
          <ComboBox
            items={[
              {
                id: "s",
                label: "S",
              },
              {
                id: "m",
                label: "M",
              },
              {
                id: "l",
                label: "L",
              },
              {
                id: "xl",
                label: "XL",
              },
            ]}
            size="small"
          />
          <Button size="small">Ok</Button>
        </Flex>
      </Flex>

      <Flex gap="spacing-2">
        <TooltipRoot>
          <TooltipTrigger>
            <Button variant="outlined">Cancel</Button>
          </TooltipTrigger>
          <TooltipContent>
            If you cancel, you will lose your order
          </TooltipContent>
        </TooltipRoot>
        <Button onPress={() => setModalOpen(!isModalOpen)} ref={submitRef}>
          Ok
        </Button>
        <Modal
          dataAttributes={{ "data-size": "small" }}
          initialFocus={2}
          isOpen={isModalOpen}
          setOpen={setModalOpen}
          triggerRef={submitRef}
        >
          <ModalContent>
            <ModalHeader title="Confirmation" />
            <ModalBody>
              <Text>
                <ul>
                  <li>Hamburger — XL</li>
                  <li>French fries — L</li>
                  <li>Coca-Cola — S</li>
                </ul>
              </Text>
            </ModalBody>
            <ModalFooter onSubmit={fakeSubmit} submitText="Confirm" />
          </ModalContent>
        </Modal>
      </Flex>
    </Flex>
  );
};
