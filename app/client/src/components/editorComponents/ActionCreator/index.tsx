import React, { useCallback, useMemo, useState } from "react";
import { getActionBlocks } from "@shared/ast";
import { ActionCreatorProps } from "./types";
import { getDynamicBindings } from "../../../utils/DynamicBindingUtils";
import { Action } from "./viewComponents/Action";

export function isEmptyBlock(block: string) {
  return [";", "undefined;"].includes(block);
}

const ActionCreator = React.forwardRef(
  (props: ActionCreatorProps, ref: any) => {
    const [selectedBlock, setSelectedBlock] = useState<null | number>(null);

    const actions: string[] = useMemo(() => {
      const blocks = getActionBlocks(
        getDynamicBindings(props.value).jsSnippets[0],
        window.evaluationVersion,
      );

      const lastBlock = blocks[blocks.length - 1];
      if (isEmptyBlock(lastBlock)) {
        setSelectedBlock(blocks.length - 1);
      }

      return blocks;
    }, [props.value]);

    const handleActionChange = useCallback(
      (index: number) => (value: string, isUpdatedViaKeyboard: boolean) => {
        props.onValueChange(
          `{{${actions.slice(0, index).join("") +
            getDynamicBindings(value).jsSnippets[0] +
            actions.slice(index + 1).join("")}}}`,
          isUpdatedViaKeyboard,
        );
      },
      [actions, props.onValueChange],
    );

    const handleBlockSelect = useCallback((index) => {
      setSelectedBlock(index);
      props.onValueChange(
        `{{${actions.filter((a) => !isEmptyBlock(a)).join("")}}}`,
        false,
      );
    }, []);

    const handleClose = useCallback(() => {
      setSelectedBlock(null);
      props.onValueChange(
        `{{${actions.filter((a) => !isEmptyBlock(a)).join("")}}}`,
        false,
      );
    }, [actions]);

    return (
      <div className="flex flex-col gap-[2px] mb-2" ref={ref}>
        {actions.map((value, index) => (
          <Action
            action={props.action}
            additionalAutoComplete={props.additionalAutoComplete}
            handleClose={handleClose}
            isOpen={selectedBlock === index}
            key={index}
            onClick={() => handleBlockSelect(index)}
            onValueChange={handleActionChange(index)}
            value={value}
          />
        ))}
      </div>
    );
  },
);

ActionCreator.displayName = "ActionCreator";

export default ActionCreator;
