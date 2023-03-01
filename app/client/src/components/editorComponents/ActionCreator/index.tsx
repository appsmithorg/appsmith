import React, { useCallback, useEffect, useState } from "react";
import { getActionBlocks, getFunctionName } from "@shared/ast";
import { ActionCreatorProps } from "./types";
import { Action } from "./viewComponents/Action";
import { getCodeFromMoustache } from "./utils";
import { Toaster, Variant } from "design-system-old";
import store from "store";
import { undoAction } from "actions/pageActions";

function uuidv4() {
  return String(1e7 + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c: any) =>
    (
      c ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
    ).toString(16),
  );
}

const ActionCreator = React.forwardRef(
  (props: ActionCreatorProps, ref: any) => {
    const [actions, setActions] = useState<Record<string, string>>(() => {
      const blocks = getActionBlocks(
        getCodeFromMoustache(props.value),
        window.evaluationVersion,
      );

      const res = blocks.reduce(
        (acc: Record<string, string>, value: string) => ({
          ...acc,
          [uuidv4()]: value,
        }),
        {},
      );

      return res;
    });

    useEffect(() => {
      setActions((prev) => {
        const newActions: Record<string, string> = {};
        const newBlocks: string[] = getActionBlocks(
          getCodeFromMoustache(props.value),
          self.evaluationVersion,
        );

        let prevIdValuePairs = Object.entries(prev);

        // We make sure that code blocks from previous render retain the same id
        // We are sure that the order of the blocks will be the same
        newBlocks.forEach((block) => {
          const prevIdValuePair = prevIdValuePairs.find(
            ([, value]) => value === block,
          );

          if (prevIdValuePair) {
            newActions[prevIdValuePair[0]] = block;

            // Filter out the id value pair so that it's not used again
            prevIdValuePairs = prevIdValuePairs.filter(
              ([id]) => id !== prevIdValuePair[0],
            );
          } else {
            newActions[uuidv4()] = block;
          }
        });

        return newActions;
      });
    }, [props.value]);

    useEffect(() => {
      props.onValueChange(
        `{{${Object.values(actions)
          .filter(Boolean)
          .join("\n")}}}`,
        false,
      );
    }, [actions]);

    const handleActionChange = useCallback(
      (id: string) => (value: string) => {
        const newValueWithoutMoustache = getCodeFromMoustache(value);
        setActions((prev) => {
          const newActions = { ...prev };
          if (value) {
            const newFunction = getFunctionName(
              newValueWithoutMoustache,
              self.evaluationVersion,
            );
            const oldFunction = getFunctionName(
              prev[id],
              self.evaluationVersion,
            );
            if (newFunction !== oldFunction) {
              Toaster.show({
                text: `${oldFunction} was deleted`,
                variant: Variant.success,
                dispatchableAction: {
                  dispatch: store.dispatch,
                  ...undoAction(),
                },
              });
            }
            newActions[id] = newValueWithoutMoustache;
          } else {
            delete newActions[id];
          }

          return newActions;
        });
      },
      [actions],
    );

    // We need a unique id for each action when it's mapped
    // We can't use index for obvious reasons
    // We can't use the action value itself because it's not unique and changes on action change

    return (
      <div className="flex flex-col gap-[2px] mb-2" ref={ref}>
        {Object.entries(actions).map(([id, value]) => (
          <Action
            action={props.action}
            additionalAutoComplete={props.additionalAutoComplete}
            key={id}
            onValueChange={handleActionChange(id)}
            value={value}
          />
        ))}
      </div>
    );
  },
);

ActionCreator.displayName = "ActionCreator";

export default ActionCreator;
