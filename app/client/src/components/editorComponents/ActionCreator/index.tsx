import React, { useCallback, useEffect, useState } from "react";
import { getActionBlocks } from "@shared/ast";
import { ActionCreatorProps } from "./types";
import { Action } from "./viewComponents/Action";
import { getCodeFromMoustache } from "./utils";

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
    const prevValRef = React.useRef(props.value);
    const [actions, setActions] = useState<Record<string, string>>(() => {
      const blocks = getActionBlocks(
        getCodeFromMoustache(props.value),
        window.evaluationVersion,
      );

      const res = blocks.reduce(
        (acc: Record<string, string>, value) => ({
          ...acc,
          [uuidv4()]: value,
        }),
        {},
      );

      return res;
    });

    useEffect(() => {
      if (
        getCodeFromMoustache(prevValRef.current) + ";" !==
        getCodeFromMoustache(props.value)
      ) {
        prevValRef.current = props.value;
        return;
      }

      setActions((prev) => {
        const newActions = { ...prev };
        newActions[uuidv4()] = "";

        return newActions;
      });

      prevValRef.current = props.value;
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
        setActions((prev) => {
          const newActions = { ...prev };
          if (value) {
            newActions[id] = getCodeFromMoustache(value);
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
