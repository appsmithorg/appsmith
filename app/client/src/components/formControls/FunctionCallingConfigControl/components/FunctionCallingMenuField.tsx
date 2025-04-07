import React, { useCallback, useMemo } from "react";
import {
  Button,
  Menu,
  MenuContent,
  MenuTrigger,
  Text,
  MenuGroup,
  MenuItem,
  Flex,
  Icon,
  MenuSub,
  MenuSubTrigger,
  MenuSubContent,
} from "@appsmith/ads";
import { Field, type WrappedFieldProps, type BaseFieldProps } from "redux-form";
import type {
  FunctionCallingEntityType,
  FunctionCallingEntityTypeOption,
} from "../types";
import { useSelector } from "react-redux";
import { selectEntityOptions } from "./selectors";

interface FunctionCallingMenuFieldProps {
  children?: React.ReactNode;
  placeholder?: string;
  className?: string;
  name: string;
  disabled?: boolean;
  onValueChange?: (
    value: string,
    entityType: FunctionCallingEntityType,
  ) => void;
  autoFocus?: boolean;
}

interface FieldRenderProps
  extends WrappedFieldProps,
    FunctionCallingMenuFieldProps {}

interface SelectedValueInfo {
  label: string;
  icon?: string | React.ReactNode;
}

const getSelectedValueInfo = (
  input: WrappedFieldProps["input"],
  options: ReturnType<typeof selectEntityOptions>,
): SelectedValueInfo => {
  // First check in Query options
  const queryOption = options.Query.find(
    (option) => option.value === input.value,
  );

  if (queryOption) {
    return {
      label: queryOption.label,
      icon: queryOption.icon,
    };
  }

  // Then check in JS Functions
  for (const collection of options.JSCollections) {
    const jsFunction = collection.functions.find(
      (func) => func.value === input.value,
    );

    if (jsFunction) {
      return {
        label: `${collection.name}.${jsFunction.label}`,
        icon: collection.icon,
      };
    }
  }

  return {
    label: "Select a function",
  };
};

const FunctionCallingMenuFieldRender = (props: FieldRenderProps) => {
  const { autoFocus, children, disabled, input, onValueChange } = props;
  const options = useSelector(selectEntityOptions);

  // Get existing entity IDs from the agentFunctions, excluding the currently selected value
  const existingEntityIds = useMemo(() => {
    const agentFunctionIds = new Set(Object.keys(options.agentFunctions));

    // Exclude the currently selected value
    if (input.value) {
      agentFunctionIds.delete(input.value);
    }

    return agentFunctionIds;
  }, [options.agentFunctions, input.value]);

  // Filter query items to exclude existing entities
  const filteredQueryItems = useMemo(() => {
    return options.Query.filter((item) => !existingEntityIds.has(item.value));
  }, [options.Query, existingEntityIds]);

  // Filter JS collection items
  const filteredJSCollections = useMemo(() => {
    return options.JSCollections.map((collection) => ({
      ...collection,
      // Filter out functions that are already used
      functions: collection.functions.filter(
        (func) => !existingEntityIds.has(func.value),
      ),
    })).filter((collection) => collection.functions.length > 0);
  }, [options.JSCollections, existingEntityIds]);

  const handleMenuSelect = useCallback(
    (option: FunctionCallingEntityTypeOption) => {
      input.onChange(option.value);

      if (onValueChange && option.optionGroupType) {
        onValueChange(
          option.value,
          option.optionGroupType as FunctionCallingEntityType,
        );
      }
    },
    [input, onValueChange],
  );

  const selectedValueInfo = useMemo(() => {
    return getSelectedValueInfo(input, options);
  }, [input, options]);

  const renderSelectedValue = () => {
    if (children) return children;

    return (
      <Flex alignItems="center" gap="spaces-2">
        {selectedValueInfo.icon &&
          (typeof selectedValueInfo.icon === "string" ? (
            <Icon name={selectedValueInfo.icon} size="md" />
          ) : (
            selectedValueInfo.icon
          ))}
        <Text>{selectedValueInfo.label}</Text>
      </Flex>
    );
  };

  return (
    <Menu>
      <MenuTrigger>
        <Button
          autoFocus={autoFocus}
          className="rc-select-selector"
          disabled={disabled}
          endIcon="arrow-down-s-line"
          kind="secondary"
          size="md"
        >
          {renderSelectedValue()}
        </Button>
      </MenuTrigger>
      <MenuContent align="start" loop width="235px">
        {/* Query options group */}
        {filteredQueryItems.length > 0 && (
          <MenuGroup>
            {filteredQueryItems.map((option) => (
              <MenuItem
                key={option.value}
                onSelect={() => handleMenuSelect(option)}
              >
                <Flex alignItems="center" gap="spaces-2">
                  {option.icon &&
                    (typeof option.icon === "string" ? (
                      <Icon name={option.icon} size="md" />
                    ) : (
                      option.icon
                    ))}
                  {option.label}
                </Flex>
              </MenuItem>
            ))}
          </MenuGroup>
        )}

        {/* JS Collections group with nested functions */}
        {filteredJSCollections.length > 0 && (
          <MenuGroup>
            <MenuGroup>
              {filteredJSCollections.map((collection) => (
                <MenuSub key={collection.id}>
                  <MenuSubTrigger>
                    <Flex alignItems="center" gap="spaces-2">
                      {collection.icon &&
                        (typeof collection.icon === "string" ? (
                          <Icon name={collection.icon} size="md" />
                        ) : (
                          collection.icon
                        ))}
                      {collection.name}
                    </Flex>
                  </MenuSubTrigger>
                  <MenuSubContent>
                    {collection.functions.map((jsFunction) => (
                      <MenuItem
                        key={jsFunction.value}
                        onSelect={() => handleMenuSelect(jsFunction)}
                      >
                        {jsFunction.label}
                      </MenuItem>
                    ))}
                  </MenuSubContent>
                </MenuSub>
              ))}
            </MenuGroup>
          </MenuGroup>
        )}
      </MenuContent>
    </Menu>
  );
};

const FunctionCallingMenuField = (
  props: BaseFieldProps & FunctionCallingMenuFieldProps,
) => <Field component={FunctionCallingMenuFieldRender} {...props} />;

export default FunctionCallingMenuField;
