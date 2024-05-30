import { useRef, useState } from "react";
import * as React from "react";
import {
  Button,
  Text,
  CheckboxGroup,
  Checkbox,
  TooltipRoot,
  TooltipTrigger,
  TooltipContent,
  ToolbarButtons,
  Flex,
  SwitchGroup,
  Switch,
  RadioGroup,
  Radio,
  IconButton,
  TextArea,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalContent,
} from "@design-system/widgets";
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

        <SwitchGroup label="Repeat order">
          <Switch value="value-1">Once a week</Switch>
          <Switch isSelected value="value-2">
            Twice a week
          </Switch>
        </SwitchGroup>

        <CheckboxGroup label="Dishes">
          <Checkbox value="Hamburger">Hamburger</Checkbox>
          <Checkbox value="French fries">French fries</Checkbox>
          <Checkbox value="Coca-Cola">Coca-Cola</Checkbox>
        </CheckboxGroup>

        <RadioGroup label="Portion size">
          <Radio value="s">S</Radio>
          <Radio value="M">M</Radio>
          <Radio value="L">L</Radio>
          <Radio value="XL">XL</Radio>
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
          initialFocus={2}
          isOpen={isModalOpen}
          setOpen={setModalOpen}
          size="small"
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
