/* eslint-disable @typescript-eslint/no-empty-function */
import React, { useState } from "react";
import clsx from "clsx";
import { ActionTree, SelectedActionBlock } from "../../types";
import { getActionInfo } from "./utils";
import { ActionBlock } from "../ActionBlock";
import { Icon } from "design-system";
import TreeStructure from "components/utils/TreeStructure";
import { AppsmithFunction } from "../../constants";

type Props = {
  actionTree: ActionTree;
  selected?: boolean;
  selectedCallbackBlock?: SelectedActionBlock | null;
  onClick: () => void;
  handleAddSuccessBlock?: () => void;
  handleAddFailureBlock?: () => void;
  handleBlockSelection?: (selectedBlock: SelectedActionBlock) => void;
};

type CallbackBlock = {
  label: "On success" | "On failure";
  handleAddBlock: () => void;
  callbacks: ActionTree[];
  blockType: SelectedActionBlock["type"];
  handleSelection: (block: SelectedActionBlock) => void;
};

export const ActionBlockTree: React.FC<Props> = ({
  actionTree,
  onClick,
  selected = false,
  handleAddSuccessBlock = () => {},
  handleAddFailureBlock = () => {},
  handleBlockSelection = () => {},
  selectedCallbackBlock,
}) => {
  const [showCallbacks, setShowCallbacks] = useState(true);
  const { actionType, code, errorCallbacks, successCallbacks } = actionTree;
  const { action, actionTypeLabel, Icon: MainActionIcon } = getActionInfo(
    code,
    actionType,
  );

  const callBacksLength = successCallbacks.length + errorCallbacks.length;

  const areCallbacksApplicable = [
    AppsmithFunction.runAPI,
    AppsmithFunction.integration,
  ].includes(actionType as any);

  const callbackBlocks: CallbackBlock[] = [
    {
      label: "On success",
      handleAddBlock: handleAddSuccessBlock,
      callbacks: successCallbacks,
      blockType: "success",
      handleSelection: handleBlockSelection,
    },
    {
      label: "On failure",
      handleAddBlock: handleAddFailureBlock,
      callbacks: errorCallbacks,
      blockType: "failure",
      handleSelection: handleBlockSelection,
    },
  ];

  return (
    <div className="flex flex-col">
      <div
        className={clsx(
          "flex flex-col",
          selected && "border-[1px] border-gray-200",
        )}
      >
        {
          <ActionBlock
            action={action}
            actionTypeLabel={actionTypeLabel}
            icon={MainActionIcon}
            onClick={onClick}
            selected={selected && !selectedCallbackBlock}
          />
        }
        {areCallbacksApplicable && selected ? (
          <button
            className="flex justify-between bg-gray-50 px-2 py-1"
            onClick={() => setShowCallbacks((prev) => !prev)}
          >
            <span className="text-gray-800 underline underline-offset-2 decoration-dashed decoration-gray-300">
              Callbacks
            </span>
            <div className="flex gap-1">
              <span className="text-gray-800">
                {callBacksLength > 0 ? callBacksLength : "No"} actions
              </span>
              <Icon
                fillColor="var(--ads-color-gray-700)"
                name={showCallbacks ? "expand-less" : "expand-more"}
                size="extraLarge"
              />
            </div>
          </button>
        ) : null}
      </div>
      {showCallbacks && selected && areCallbacksApplicable ? (
        <TreeStructure>
          <ul className="tree flex flex-col gap-2">
            {callbackBlocks.map(
              ({
                blockType,
                callbacks,
                handleAddBlock,
                handleSelection,
                label,
              }) => (
                <li key={label}>
                  <div className="flex flex-col border-[1px] border-gray-200 hover:border-gray-500">
                    <button
                      className={clsx(
                        "flex justify-between bg-gray-50 px-2 py-1 hover:bg-gray-200",
                        successCallbacks.length > 0 &&
                          "border-b-[1px] border-gray-200",
                      )}
                      onClick={handleAddBlock}
                    >
                      <span className="text-gray-800 underline underline-offset-2 decoration-dashed decoration-gray-300">
                        {label}
                      </span>
                      <Icon
                        fillColor="var(--ads-color-gray-700)"
                        name="plus"
                        size="extraLarge"
                      />
                    </button>
                    {callbacks.map(({ actionType, code }, index) => {
                      const { action, actionTypeLabel, Icon } = getActionInfo(
                        code,
                        actionType,
                      );
                      return (
                        <ActionBlock
                          action={action}
                          actionTypeLabel={actionTypeLabel}
                          borderLess={index === callbacks.length - 1}
                          icon={Icon}
                          key={code + index}
                          onClick={() =>
                            handleSelection({ type: blockType, index })
                          }
                          selected={
                            selectedCallbackBlock?.type === blockType &&
                            selectedCallbackBlock?.index === index
                          }
                        />
                      );
                    })}
                  </div>
                </li>
              ),
            )}
          </ul>
        </TreeStructure>
      ) : null}
    </div>
  );
};
