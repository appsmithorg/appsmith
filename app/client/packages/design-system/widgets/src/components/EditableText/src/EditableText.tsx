import {
  TooltipContent,
  TooltipRoot,
  TooltipTrigger,
} from "@design-system/headless";
import type { ForwardedRef } from "react";
import React, { forwardRef } from "react";
import { Button, Menu, MenuTrigger } from "../../../index";
import { Flex } from "../../Flex";
import styles from "./styles.module.css";
import type { EditableTextProps } from "./types";

const _EditableText = (
  props: EditableTextProps,
  ref: ForwardedRef<HTMLDivElement>,
) => {
  const { children, contentEditable = false, onBlur } = props;
  return (
    <TooltipRoot offset={20} open={contentEditable} placement="top">
      <TooltipTrigger>
        <div
          className={styles.editableText}
          contentEditable={contentEditable}
          onBlur={onBlur}
          ref={ref}
        >
          {children}
        </div>
      </TooltipTrigger>
      <TooltipContent className={styles.floatingPanel} hasArrow={false}>
        <Flex gap="spacing-4">
          <MenuTrigger>
            <Button
              icon="chevron-down"
              iconPosition="end"
              size="small"
              variant="outlined"
            >
              Font size
            </Button>
            <Menu
              items={[
                {
                  id: 1,
                  label: "Body",
                },
                {
                  id: 2,
                  label: "Subtitle",
                },
                {
                  id: 3,
                  label: "Title",
                },
                {
                  id: 4,
                  label: "Heading",
                },
              ]}
            />
          </MenuTrigger>
          <Flex gap="spacing-2">
            <Button icon="align-left" size="small" variant="outlined" />
            <Button icon="align-center" size="small" variant="outlined" />
            <Button icon="align-right" size="small" variant="outlined" />
          </Flex>
          <Flex gap="spacing-2">
            <Button icon="bold" size="small" variant="outlined" />
            <Button icon="italic" size="small" variant="outlined" />
          </Flex>
        </Flex>
      </TooltipContent>
    </TooltipRoot>
  );
};

export const EditableText = forwardRef(_EditableText);
