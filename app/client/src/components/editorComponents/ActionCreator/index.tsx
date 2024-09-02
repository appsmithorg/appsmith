import React, { useCallback, useEffect, useRef, useState } from "react";
import { getActionBlocks, getCallExpressions } from "@shared/ast";
import type { ActionCreatorProps, ActionTree } from "./types";
import {
  getCodeFromMoustache,
  getSelectedFieldFromValue,
  isEmptyBlock,
} from "./utils";
import { diff } from "deep-diff";
import Action from "./viewComponents/Action";
import { useSelector } from "react-redux";
import { selectEvaluationVersion } from "ee/selectors/applicationSelectors";
import { generateReactKey } from "../../../utils/generators";
import { useApisQueriesAndJsActionOptions } from "./helpers";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { getActionTypeLabel } from "./viewComponents/ActionBlockTree/utils";
import { AppsmithFunction } from "./constants";

export const ActionCreatorContext = React.createContext<{
  label: string;
  selectBlock: (id: string) => void;
  selectedBlockId?: string;
}>({
  label: "",
  selectBlock: () => {
    return;
  },
  selectedBlockId: "",
});

const ActionCreator = React.forwardRef(
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (props: ActionCreatorProps, ref: any) => {
    const [actions, setActions] = useState<Record<string, string>>(() => {
      const blocks = getActionBlocks(
        getCodeFromMoustache(props.value),
        window.evaluationVersion,
      );

      const res = blocks.reduce(
        (acc: Record<string, string>, value: string) => ({
          ...acc,
          [generateReactKey()]: value,
        }),
        {},
      );

      return res;
    });

    const updatedIdRef = useRef<string>("");
    const previousBlocks = useRef<string[]>([]);
    const evaluationVersion = useSelector(selectEvaluationVersion);

    const actionOptions = useApisQueriesAndJsActionOptions(() => null);

    useEffect(() => {
      setActions((prev) => {
        const newActions: Record<string, string> = {};
        const newBlocks: string[] = getActionBlocks(
          getCodeFromMoustache(props.value),
          evaluationVersion,
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
          } else if (childUpdate.current && updatedIdRef?.current) {
            // Child updates come with the id of the block that was updated
            newActions[updatedIdRef.current] = block;
            prevIdValuePairs = prevIdValuePairs.filter(
              ([id]) => id !== updatedIdRef.current,
            );
            updatedIdRef.current = "";
            childUpdate.current = false;
          } else {
            // If the block is not present in the previous blocks, it's a new block
            // We need to check if the block is a result of an edit
            // If it is, we need to retain the id of the previous block
            // This is to ensure that the undo/redo stack is not broken
            const differences = diff(previousBlocks.current, newBlocks);
            if (differences?.length === 1 && differences[0].kind === "E") {
              const edit = differences[0];
              //@ts-expect-error fix later
              const prevBlock = edit.lhs as string;
              const prevIdValuePair = prevIdValuePairs.find(
                ([, value]) => value === prevBlock,
              );
              if (prevIdValuePair) {
                newActions[prevIdValuePair[0]] = block;
                prevIdValuePairs = prevIdValuePairs.filter(
                  ([id]) => id !== prevIdValuePair[0],
                );
                return;
              }
            }
            newActions[generateReactKey()] = block;
          }
        });
        previousBlocks.current = [...newBlocks];
        updatedIdRef.current = "";
        childUpdate.current = false;
        return newActions;
      });
    }, [props.value]);

    const save = useCallback(
      (newActions) => {
        props.onValueChange(
          Object.values(newActions).length > 0
            ? `{{${Object.values(newActions).filter(Boolean).join("\n")}}}`
            : "",
          false,
        );
      },
      [props.onValueChange],
    );

    /** This variable will be set for all changes that happen from the Action blocks
     * It will be unset for all the changes that happen from the parent components (Undo/Redo)
     */
    const childUpdate = React.useRef(false);

    const handleActionChange = (id: string) => (value: string) => {
      const newValueWithoutMoustache = getCodeFromMoustache(value);
      const newActions = { ...actions };
      updatedIdRef.current = id;
      childUpdate.current = true;
      if (newValueWithoutMoustache) {
        newActions[id] = newValueWithoutMoustache;
        const prevValue = actions[id];
        const option = getSelectedFieldFromValue(
          newValueWithoutMoustache,
          actionOptions,
        );

        const actionType = (option?.type ||
          option?.value) as ActionTree["actionType"];

        // If the previous value was empty, we're adding a new action
        if (prevValue === "") {
          AnalyticsUtil.logEvent("ACTION_ADDED", {
            actionType: getActionTypeLabel(actionType),
            code: newValueWithoutMoustache,
            callback: null,
            widgetName: props.widgetName,
            propertyName: props.propertyName,
            widgetType: props.widgetType,
          });
        } else {
          const prevRootCallExpression = getCallExpressions(
            actions[id],
            evaluationVersion,
          )[0];
          const newRootCallExpression = getCallExpressions(
            newValueWithoutMoustache,
            evaluationVersion,
          )[0];

          // We don't want the modified event to be triggered when the success/failure
          // callbacks are modified/added/removed
          // So, we check if the root call expression is the same
          if (prevRootCallExpression?.code !== newRootCallExpression?.code) {
            AnalyticsUtil.logEvent("ACTION_MODIFIED", {
              actionType: getActionTypeLabel(actionType),
              code: newValueWithoutMoustache,
              callback: null,
              widgetName: props.widgetName,
              propertyName: props.propertyName,
              widgetType: props.widgetType,
            });
          }
        }
      } else {
        const option = getSelectedFieldFromValue(newActions[id], actionOptions);
        const actionType = (option?.type ||
          option?.value ||
          // when No action card is deleted, the value is empty string, hence option is undefined
          // in that case, we set the actionType to none
          AppsmithFunction.none) as ActionTree["actionType"];
        AnalyticsUtil.logEvent("ACTION_DELETED", {
          actionType: getActionTypeLabel(actionType),
          code: newActions[id],
          callback: null,
          widgetName: props.widgetName,
          propertyName: props.propertyName,
          widgetType: props.widgetType,
        });
        delete newActions[id];
        !actions[id] && setActions(newActions);
      }
      save(newActions);
    };

    // We need a unique id for each action when it's mapped
    // We can't use index for obvious reasons
    // We can't use the action value itself because it's not unique and changes on action change
    const [selectedBlockId, selectBlock] = useState<string | undefined>(
      undefined,
    );

    const id = useRef<string>("");

    useEffect(() => {
      if (!id.current) return;
      const children = ref.current?.children || [];
      const lastChildElement = children[children.length - 1];
      lastChildElement?.scrollIntoView({ block: "nearest" });
      selectBlock(id.current);
      id.current = "";
    }, [actions]);

    useEffect(() => {
      if (props.additionalControlData?.showEmptyBlock) {
        addBlock();
        props.additionalControlData?.setShowEmptyBlock(false);
      }
    }, [props.additionalControlData]);

    const addBlock = useCallback(() => {
      const hasAnEmptyBlock = Object.entries(actions).find(([, action]) =>
        isEmptyBlock(action),
      );

      if (hasAnEmptyBlock) {
        selectBlock(hasAnEmptyBlock[0]);
        const children = ref.current?.children || [];
        const lastChildElement = children[children.length - 1];
        lastChildElement?.scrollIntoView({
          block: "nearest",
        });
        return;
      }
      const newActions = { ...actions };
      id.current = generateReactKey();
      newActions[id.current] = "";
      setActions(newActions);
    }, [actions, save]);

    const contextValue = React.useMemo(
      () => ({ label: props.action, selectedBlockId, selectBlock }),
      [selectedBlockId, props.action, selectBlock],
    );

    return (
      <ActionCreatorContext.Provider value={contextValue}>
        <div className="flex flex-col gap-[2px]" ref={ref}>
          {Object.entries(actions).map(([id, value], index) => (
            <Action
              additionalAutoComplete={props.additionalAutoComplete}
              code={value}
              dataTreePath={props.dataTreePath}
              id={id}
              index={index}
              key={id}
              onChange={handleActionChange(id)}
              propertyName={props.propertyName}
              widgetName={props.widgetName}
              widgetType={props.widgetType}
            />
          ))}
        </div>
      </ActionCreatorContext.Provider>
    );
  },
);

ActionCreator.displayName = "ActionCreator";

export default ActionCreator;
