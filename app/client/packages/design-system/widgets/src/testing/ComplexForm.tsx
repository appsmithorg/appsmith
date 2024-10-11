import { useRef, useState } from "react";
import * as React from "react";
import {
  Button,
  Text,
  ToggleGroup,
  Checkbox,
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
  Radio,
  ListBoxItem,
  Tooltip,
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

        <ToggleGroup label="Repeat order">
          {[
            {
              value: "Once a week",
              label: "Once a week",
            },
            {
              value: "Twice a week",
              label: "Twice a week",
            },
          ].map(({ label, value }) => (
            <Switch key={value} value={value}>
              {label}
            </Switch>
          ))}
        </ToggleGroup>

        <ToggleGroup label="Dishes">
          {[
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
          ].map(({ label, value }) => (
            <Checkbox key={value} value={value}>
              {label}
            </Checkbox>
          ))}
        </ToggleGroup>

        <RadioGroup label="Portion size">
          {[
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
          ].map(({ label, value }) => (
            <Radio key={value} value={value}>
              {label}
            </Radio>
          ))}
        </RadioGroup>

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
          <ComboBox>
            {[
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
            ].map(({ id, label }) => (
              <ListBoxItem key={id} textValue={label}>
                {label}
              </ListBoxItem>
            ))}
          </ComboBox>
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
        <Tooltip tooltip="Tooltip">
          <Button variant="outlined">Cancel</Button>
        </Tooltip>

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
