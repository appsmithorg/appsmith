import React, { useCallback, useMemo } from "react";
import { getActionBlocks, getFunctionName } from "@shared/ast";
import { ActionCreatorProps } from "./types";
import { getDynamicBindings } from "../../../utils/DynamicBindingUtils";
import { Action } from "./viewComponents/Action";

const ActionCreator = React.forwardRef(
  (props: ActionCreatorProps, ref: any) => {
    const actions: string[] = useMemo(() => {
      const blocks = getActionBlocks(
        getDynamicBindings(props.value).jsSnippets[0],
        window.evaluationVersion,
      );

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

    return (
      <div className="flex flex-col gap-[2px] mb-2" ref={ref}>
        {actions.map((value, index) => (
          <Action
            action={props.action}
            additionalAutoComplete={props.additionalAutoComplete}
            key={index + getFunctionName(value, self.evaluationVersion)}
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
