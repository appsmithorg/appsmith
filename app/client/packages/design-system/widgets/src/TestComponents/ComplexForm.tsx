import React from "react";
import {
  Button,
  Text,
  CheckboxGroup,
  Checkbox,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "../";

export const ComplexForm = () => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--spacing-5)",
      }}
    >
      <Text variant="heading">Your order</Text>

      <Text>Choose your favorite dishes and place an order</Text>

      <CheckboxGroup isEmphasized label="Dishes">
        <Checkbox value="Hamburger">Hamburger</Checkbox>
        <Checkbox value="French fries">French fries</Checkbox>
        <Checkbox value="Coca-Cola">Coca-Cola</Checkbox>
      </CheckboxGroup>

      <div
        style={{
          display: "flex",
          gap: "var(--spacing-2)",
        }}
      >
        <Tooltip>
          <TooltipTrigger>
            <Button variant="outlined">Cancel</Button>
          </TooltipTrigger>
          <TooltipContent>
            If you cancel, you will lose your order
          </TooltipContent>
        </Tooltip>
        <Button>Ok</Button>
      </div>
    </div>
  );
};
