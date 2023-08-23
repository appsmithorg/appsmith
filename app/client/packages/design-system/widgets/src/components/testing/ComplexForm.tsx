import * as React from "react";
import {
  Button,
  Text,
  CheckboxGroup,
  Checkbox,
  TooltipRoot,
  TooltipTrigger,
  TooltipContent,
  ButtonGroup,
  Flex,
  SwitchGroup,
  Switch,
  RadioGroup,
  Radio,
} from "@design-system/widgets";

export const ComplexForm = () => {
  return (
    <Flex direction="column" gap="spacing-7">
      <Text variant="heading">Your order</Text>

      <Text>Choose your favorite dishes and place an order</Text>

      <Flex direction="column" gap="spacing-6">
        <ButtonGroup>
          <Button>Fast food</Button>
          <Button>Salads</Button>
          <Button>Drinks</Button>
          <Button>Sauces</Button>
        </ButtonGroup>

        <SwitchGroup label="Repeat order">
          <Switch value="value-1">Once a week</Switch>
          <Switch isSelected value="value-2">
            Twice a week
          </Switch>
        </SwitchGroup>

        <CheckboxGroup isEmphasized label="Dishes">
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
      </Flex>

      <Flex gap="spacing-3">
        <TooltipRoot>
          <TooltipTrigger>
            <Button variant="outlined">Cancel</Button>
          </TooltipTrigger>
          <TooltipContent>
            If you cancel, you will lose your order
          </TooltipContent>
        </TooltipRoot>
        <Button>Ok</Button>
      </Flex>
    </Flex>
  );
};
