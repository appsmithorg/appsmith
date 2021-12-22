import { cloneDeep } from "lodash";
import { useContext, useEffect } from "react";

import { Schema, SchemaItem } from "../constants";
import FormContext from "../FormContext";

type UseDisableChildrenProps = {
  isDisabled: boolean;
  propertyPath: string;
  schemaItem: SchemaItem;
  skip?: boolean;
};

function traverseAndModifySchemaItem(
  schemaItem: SchemaItem,
  isDisabled: boolean,
) {
  const newSchemaItem = cloneDeep(schemaItem);
  const childKeys = Object.keys(schemaItem.children);
  const newChildren: Schema = {};

  newSchemaItem.isDisabled = isDisabled;

  childKeys.forEach((childKey) => {
    newChildren[childKey] = traverseAndModifySchemaItem(
      schemaItem.children[childKey],
      isDisabled,
    );
  });

  newSchemaItem.children = newChildren;

  return newSchemaItem;
}

function useDisableChildren({
  isDisabled,
  propertyPath,
  schemaItem,
  skip = false,
}: UseDisableChildrenProps) {
  const { updateWidgetProperty } = useContext(FormContext);

  useEffect(() => {
    if (!skip) {
      const newSchema = traverseAndModifySchemaItem(schemaItem, isDisabled);

      updateWidgetProperty(propertyPath, newSchema);
    }
  }, [isDisabled]);
}

export default useDisableChildren;
