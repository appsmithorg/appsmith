import React, { useCallback, useEffect, useMemo, useState } from "react";
import { getActionBlocks } from "@shared/ast";
import { ActionCreatorProps } from "./types";
import { getDynamicBindings } from "../../../utils/DynamicBindingUtils";
import { Action } from "./viewComponents/Action";

function getBlocks(value: string) {
  const currentBlocks = getActionBlocks(
    getDynamicBindings(value).jsSnippets[0],
    window.evaluationVersion,
  );

  if (currentBlocks.length === 0) {
    return [""];
  }

  return currentBlocks;
}

const ActionCreator = React.forwardRef(
  (props: ActionCreatorProps, ref: any) => {
    const [selectedBlock, setSelectedBlock] = useState<null | number>(null);
    // const [blocks, setBlocks] = useState<string[]>(getBlocks(props.value));

    // useEffect(() => {
    //   setBlocks(
    //     getBlocks(props.value).map((value) => `{{${value.slice(0, -1)}}}`),
    //   );
    // }, [props.value]);

    console.log(
      "** Action Blocks **",
      props.value,
      getActionBlocks(
        getDynamicBindings(props.value).jsSnippets[0],
        window.evaluationVersion,
      ),
    );

    const actions: string[] = useMemo(() => {
      const blocks = getActionBlocks(
        getDynamicBindings(props.value).jsSnippets[0],
        window.evaluationVersion,
      );

      if (blocks.length === 0) return [""];

      return blocks;
    }, [props.value]);

    const handleActionChange = useCallback(
      (index: number) => (value: string, isUpdatedViaKeyboard: boolean) => {
        props.onValueChange(
          `{{
          ${actions.slice(0, index).join("") +
            getDynamicBindings(value).jsSnippets[0] +
            actions.slice(index + 1).join("")}}}`,
          isUpdatedViaKeyboard,
        );
      },
      [],
    );

    return (
      <div className="flex flex-col gap-[2px]">
        {actions.map((value, index) => (
          <Action
            action={props.action}
            additionalAutoComplete={props.additionalAutoComplete}
            handleClose={() => setSelectedBlock(null)}
            isOpen={selectedBlock === index}
            key={index}
            onClick={() => setSelectedBlock(index)}
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
