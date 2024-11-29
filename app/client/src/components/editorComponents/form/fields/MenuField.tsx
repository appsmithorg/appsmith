import {
  Button,
  Menu,
  MenuContent,
  MenuGroupName,
  MenuTrigger,
  Text,
  MenuGroup,
  MenuItem,
  Flex,
  Icon,
} from "@appsmith/ads";
import { getAssetUrl } from "ee/utils/airgapHelpers";
import React from "react";
import { type WrappedFieldProps, type BaseFieldProps, Field } from "redux-form";

interface iOption {
  value: string;
  label: string;
  icon?: string;
  image?: string;
  onSelect?: (value: string) => void;
}

interface iMenuFieldProps {
  options: iOption[];
  children: React.ReactNode;
  className?: string;
  groupName?: string;
}

const MenuFieldRender = (props: iMenuFieldProps & WrappedFieldProps) => {
  const { children, groupName, input, options } = props;

  const handleMenuSelect = (option: iOption) => {
    if (option.onSelect) {
      option.onSelect(option.value); // Trigger custom onSelect
    } else {
      input.onChange(option.value); // Default behavior
    }
  };

  return (
    <Menu>
      <MenuTrigger>
        <Button endIcon={"arrow-down-s-line"} kind="tertiary" size="sm">
          {children}
        </Button>
      </MenuTrigger>
      <MenuContent align="start" loop width="235px">
        {groupName && (
          <MenuGroupName asChild>
            <Text kind="body-s">{groupName}</Text>
          </MenuGroupName>
        )}
        <MenuGroup>
          {options.map((option) => (
            <MenuItem
              key={option.value}
              onSelect={() => handleMenuSelect(option)}
            >
              <Flex alignItems={"center"} gap="spaces-2">
                {option.image && (
                  <img
                    alt="Datasource"
                    className="plugin-image h-[12px] w-[12px]"
                    src={getAssetUrl(option.image)}
                  />
                )}
                {option.icon && <Icon name={option.icon} size="md" />}
                {option.label}
              </Flex>
            </MenuItem>
          ))}
        </MenuGroup>
      </MenuContent>
    </Menu>
  );
};

const MenuField = (
  props: BaseFieldProps & iMenuFieldProps & { formName: string },
) => (
  <Field className={props.className} component={MenuFieldRender} {...props} />
);

export default MenuField;
