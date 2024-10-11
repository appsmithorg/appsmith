import styled from "styled-components";
import TreeStructure from "components/utils/TreeStructure";
import { Text, Icon, Button, Tooltip } from "@appsmith/ads";
import React, { useCallback, useEffect } from "react";
import { ActionCreatorContext } from "../..";
import { AppsmithFunction } from "../../constants";
import type { TActionBlock, VariantType } from "../../types";
import { chainableFns } from "../../utils";
import ActionCard from "./ActionCard";
import ActionSelector from "./ActionSelector";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { getActionTypeLabel } from "../ActionBlockTree/utils";
import classNames from "classnames";
import type { AdditionalDynamicDataTree } from "utils/autocomplete/customTreeTypeDefCreator";
import { klonaLiteWithTelemetry } from "utils/helpers";

const CallbackBlockContainer = styled.div<{
  isSelected: boolean;
  isExpanded: boolean;
}>`
  border: 1px solid var(--ads-v2-color-border);
  border-bottom-color: ${(props) =>
    props.isSelected
      ? "var(--ads-v2-color-border-emphasis)"
      : "var(--ads-v2-color-border)"};
  border-radius: ${(props) =>
    props.isExpanded
      ? "var(--ads-v2-border-radius) var(--ads-v2-border-radius) 0px 0px"
      : "var(--ads-v2-border-radius)"};
`;

const CallbackButton = styled.button`
  border: 1px solid var(--ads-v2-color-border);
  border-top: none;
  border-radius: 0px 0px var(--ads-v2-border-radius) var(--ads-v2-border-radius);
  background: var(--ads-v2-color-bg-subtle);
`;

const EMPTY_ACTION_BLOCK: TActionBlock = {
  code: "",
  actionType: AppsmithFunction.none,
  success: { blocks: [] },
  error: { blocks: [] },
};

export default function ActionTree(props: {
  actionBlock: TActionBlock;
  additionalAutoComplete?: AdditionalDynamicDataTree;
  onChange: (actionBlock: TActionBlock) => void;
  className?: string;
  id: string;
  level: number;
  isLastBlock?: boolean;
  variant?: VariantType;
  widgetName: string;
  propertyName: string;
  widgetType: string;
  dataTreePath: string | undefined;
}) {
  const { id } = props;
  const [actionBlock, setActionBlock] = React.useState(props.actionBlock);
  const { error, success } = actionBlock;
  const { blocks: successBlocks } = success;
  const { blocks: errorBlocks } = error;
  const [isOpen, open] = React.useState(false);

  const { selectBlock, selectedBlockId } =
    React.useContext(ActionCreatorContext);

  const [canAddCallback, setCanAddCallback] = React.useState(
    props.actionBlock.actionType !== AppsmithFunction.none,
  );

  const [callbacksExpanded, setCallbacksExpanded] = React.useState(false);

  useEffect(() => {
    setActionBlock(props.actionBlock);

    if (props.actionBlock.actionType === AppsmithFunction.none) {
      setCallbacksExpanded(true);
    }

    setCanAddCallback(props.actionBlock.actionType !== AppsmithFunction.none);
  }, [
    props.actionBlock,
    setCallbacksExpanded,
    setCanAddCallback,
    setActionBlock,
  ]);

  const handleCardSelection = useCallback(() => {
    if (selectedBlockId === id) return;

    selectBlock(id);
    setCallbacksExpanded(true);
  }, [id, selectedBlockId, setCallbacksExpanded, selectBlock]);

  useEffect(() => {
    open(selectedBlockId === id);
  }, [selectedBlockId, id]);

  const handleAddSuccessBlock = useCallback(() => {
    if (!canAddCallback) return;

    const {
      success: { blocks },
    } = actionBlock;
    const lastAction = blocks[blocks.length - 1];

    if (lastAction?.actionType === AppsmithFunction.none) {
      selectBlock(`${id}_success_${blocks.length - 1}`);

      return;
    }

    const newActionBlock = klonaLiteWithTelemetry(
      actionBlock,
      "ActionTree.handleAddSuccessBlock",
    );

    newActionBlock.success.blocks.push({
      ...EMPTY_ACTION_BLOCK,
      type: lastAction?.type || "then",
    });
    setActionBlock(newActionBlock);
    selectBlock(`${id}_success_${blocks.length}`);
  }, [actionBlock, canAddCallback]);

  const handleAddErrorBlock = useCallback(() => {
    if (!canAddCallback) return;

    const {
      error: { blocks },
    } = actionBlock;
    const lastAction = blocks[blocks.length - 1];

    if (lastAction?.actionType === AppsmithFunction.none) {
      selectBlock(`${id}_failure_${blocks.length - 1}`);

      return;
    }

    const newActionBlock = klonaLiteWithTelemetry(
      actionBlock,
      "ActionTree.handleAddErrorBlock",
    );

    newActionBlock.error.blocks.push({
      ...EMPTY_ACTION_BLOCK,
      type: lastAction?.type || "catch",
    });
    setActionBlock(newActionBlock);
    selectBlock(`${id}_failure_${blocks.length}`);
  }, [actionBlock, canAddCallback]);

  const actionsCount =
    successBlocks.filter(
      ({ actionType }) => actionType !== AppsmithFunction.none,
    ).length +
    errorBlocks.filter(({ actionType }) => actionType !== AppsmithFunction.none)
      .length;

  const callbacksCount =
    successBlocks.filter(({ type }) => type === "success").length +
    errorBlocks.filter(({ type }) => type === "failure").length;

  let areCallbacksApplicable =
    actionBlock.actionType === AppsmithFunction.none ||
    (chainableFns.includes(actionBlock.actionType) && props.level < 2);

  if (props.level === 1) {
    areCallbacksApplicable = callbacksCount > 0;
  }

  const callbackBlocks = [
    {
      label: "On success",
      handleAddBlock: handleAddSuccessBlock,
      callbacks: successBlocks,
      blockType: "success",
      tooltipContent:
        "Show a message, chain other actions, or both when the parent action block runs successfully. All nested actions run at the same time.",
    },
    {
      label: "On failure",
      handleAddBlock: handleAddErrorBlock,
      callbacks: errorBlocks,
      blockType: "failure",
      tooltipContent:
        "Show a message, chain actions, or both when the parent action block fails to run. All nested actions run at the same time.",
    },
  ];

  return (
    <div className={props.className}>
      <ActionSelector
        action={actionBlock}
        additionalAutoComplete={props.additionalAutoComplete}
        dataTreePath={props.dataTreePath}
        id={id}
        level={props.level}
        onChange={props.onChange}
        open={isOpen}
      >
        <ActionCard
          actionBlock={actionBlock}
          id={id}
          isLastBlock={props.isLastBlock}
          level={props.level}
          onSelect={handleCardSelection}
          selected={isOpen}
          showCallbacks={areCallbacksApplicable}
          variant={props.variant}
        />
      </ActionSelector>
      {areCallbacksApplicable ? (
        <CallbackButton
          className="callback-collapse flex w-full justify-between px-2 py-1 border-t-transparent t--action-callbacks"
          data-testid={`t--callback-btn-${id}`}
          onClick={() => {
            setCallbacksExpanded((prev) => !prev);
          }}
        >
          <Text kind="action-s">Callbacks</Text>
          <div className="flex items-center gap-1">
            <Text kind="action-s">
              {actionsCount > 0 ? actionsCount : "No"} actions
            </Text>
            <Icon
              name={callbacksExpanded ? "expand-less" : "expand-more"}
              size="md"
            />
          </div>
        </CallbackButton>
      ) : null}
      {callbacksExpanded && areCallbacksApplicable ? (
        <TreeStructure>
          <ul
            className={classNames(
              "tree flex flex-col gap-0",
              !canAddCallback && "opacity-60",
            )}
          >
            {callbackBlocks.map(
              ({
                blockType,
                callbacks,
                handleAddBlock,
                label,
                tooltipContent,
              }) => (
                <li key={label}>
                  <div className="flex flex-col pl-1">
                    <CallbackBlockContainer
                      className="flex flex-row justify-between items-start action-callback-add"
                      isExpanded={callbacks.length > 0}
                      isSelected={selectedBlockId === `${id}_${blockType}_0`}
                    >
                      <Tooltip content={tooltipContent}>
                        <Text className="cursor-help px-2 py-1" kind="action-s">
                          {label}
                        </Text>
                      </Tooltip>
                      <button
                        className={`t--action-add-${blockType}-callback`}
                        onClick={handleAddBlock}
                      >
                        <span className="icon w-7 h-7 flex items-center justify-center">
                          <Button
                            isDisabled={!canAddCallback}
                            isIconButton
                            kind="tertiary"
                            size="sm"
                            startIcon="plus"
                          />
                        </span>
                      </button>
                    </CallbackBlockContainer>
                    {callbacks.map((cActionBlock, index) => (
                      <ActionTree
                        actionBlock={cActionBlock}
                        className="mt-0"
                        dataTreePath={props.dataTreePath}
                        id={`${id}_${blockType}_${index}`}
                        isLastBlock={index === callbacks.length - 1}
                        key={`${id}_${blockType}_${index}`}
                        level={props.level + 1}
                        onChange={(
                          childActionBlock: TActionBlock,
                          del?: boolean,
                        ) => {
                          const newActionBlock = klonaLiteWithTelemetry(
                            actionBlock,
                            "ActionTree.onChange",
                          );

                          const blocks =
                            blockType === "failure"
                              ? newActionBlock.error.blocks
                              : newActionBlock.success.blocks;
                          let isDummyBlockDelete = false;

                          if (del) {
                            isDummyBlockDelete =
                              blocks[index].actionType ===
                              AppsmithFunction.none;

                            const deletedBlock = blocks.splice(index, 1)[0];

                            AnalyticsUtil.logEvent("ACTION_DELETED", {
                              actionType: getActionTypeLabel(
                                deletedBlock.actionType,
                              ),
                              code: deletedBlock.code,
                              callback: blockType,
                              widgetName: props.widgetName,
                              propertyName: props.propertyName,
                              widgetType: props.widgetType,
                            });
                          } else {
                            const prevActionType = blocks[index].actionType;
                            const newActionType = childActionBlock.actionType;
                            const newActionCode = childActionBlock.code;

                            blocks[index].code = childActionBlock.code;
                            blocks[index].actionType =
                              childActionBlock.actionType;

                            const actionTypeLabel =
                              getActionTypeLabel(newActionType);

                            if (prevActionType === AppsmithFunction.none) {
                              AnalyticsUtil.logEvent("ACTION_ADDED", {
                                actionType: actionTypeLabel,
                                code: newActionCode,
                                callback: blockType,
                                widgetName: props.widgetName,
                                propertyName: props.propertyName,
                                widgetType: props.widgetType,
                              });
                            } else {
                              AnalyticsUtil.logEvent("ACTION_MODIFIED", {
                                actionType: actionTypeLabel,
                                code: newActionCode,
                                callback: blockType,
                                widgetName: props.widgetName,
                                propertyName: props.propertyName,
                                widgetType: props.widgetType,
                              });
                            }
                          }

                          if (isDummyBlockDelete) {
                            setActionBlock(newActionBlock);
                          } else {
                            props.onChange(newActionBlock);
                          }
                        }}
                        propertyName={props.propertyName}
                        variant="callbackBlock"
                        widgetName={props.widgetName}
                        widgetType={props.widgetType}
                      />
                    ))}
                  </div>
                </li>
              ),
            )}
          </ul>
        </TreeStructure>
      ) : null}
    </div>
  );
}
