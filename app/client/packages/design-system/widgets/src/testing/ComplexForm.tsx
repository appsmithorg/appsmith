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
  IconButton,
  TextArea,
} from "@design-system/widgets";
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import EmotionHappyLineIcon from "remixicon-react/EmotionHappyLineIcon";
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import EmotionUnhappyLineIcon from "remixicon-react/EmotionUnhappyLineIcon";

export const ComplexForm = () => {
  return (
    <Flex direction="column" gap="spacing-7">
      <Text variant="heading">Your order</Text>

      <Text>Choose your favorite dishes and place an order.</Text>

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
      </Flex>

      <Flex direction="column" gap="spacing-4">
        <Text variant="caption">Feedback is important to us</Text>
        <Flex gap="spacing-1">
          <IconButton icon={EmotionHappyLineIcon} variant="ghost" />
          <IconButton icon={EmotionUnhappyLineIcon} variant="ghost" />
        </Flex>
        <TextArea label="Your comment" />
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
