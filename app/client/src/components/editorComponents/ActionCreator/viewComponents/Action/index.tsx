import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Popover2 } from "@blueprintjs/popover2";
import { Button, Category, Icon, TreeDropdownOption } from "design-system-old";
import { SelectorDropdown } from "../SelectorDropdown";
import { FIELD_CONFIG } from "../../Field/FieldConfig";
import FieldGroup from "../../FieldGroup";
import { AppsmithFunction, FieldType } from "../../constants";
import { ActionTree, SelectedActionBlock, SwitchType } from "../../types";
import {
  actionToCode,
  codeToAction,
  getCodeFromMoustache,
  getSelectedFieldFromValue,
  isEmptyBlock,
} from "../../utils";
import { useSelector } from "react-redux";
import { getWidgetOptionsTree } from "sagas/selectors";
import { getPageListAsOptions } from "selectors/entitiesSelector";
import {
  useApisQueriesAndJsActionOptions,
  useModalDropdownList,
} from "../../helpers";
import { TabView } from "../TabView";
import { cloneDeep } from "lodash";
import { ActionBlockTree } from "../ActionBlockTree";

type Props = {
  action: string;
  value: string;
  onValueChange: (newValue: string, isUpdatedViaKeyboard: boolean) => void;
  additionalAutoComplete?: Record<string, Record<string, unknown>>;
};

type CallbackBlocks = Record<
  SelectedActionBlock["type"],
  {
    fields: React.ReactElement;
    block: React.ReactElement;
  }[]
>;

export const Action: React.FC<Props> = ({
  action,
  additionalAutoComplete,
  onValueChange,
  value,
}) => {
  const firstRender = React.useRef(true);
  const isActionInteraction = React.useRef(false);
  const [isOpen, setOpen] = useState(isEmptyBlock(value));
  const [
    selectedCallbackBlock,
    setSelectedCallbackBlock,
  ] = useState<SelectedActionBlock | null>(null);

  const apiAndQueryCallbackTabSwitches: SwitchType[] = [
    {
      id: "onSuccess",
      text: "onSuccess",
      action: () =>
        setActiveTabApiAndQueryCallback(apiAndQueryCallbackTabSwitches[0]),
    },
    {
      id: "onFailure",
      text: "onFailure",
      action: () =>
        setActiveTabApiAndQueryCallback(apiAndQueryCallbackTabSwitches[1]),
    },
  ];

  const [
    activeTabApiAndQueryCallback,
    setActiveTabApiAndQueryCallback,
  ] = useState<SwitchType>(apiAndQueryCallbackTabSwitches[0]);
  const integrationOptions = useApisQueriesAndJsActionOptions(() =>
    setOpen(false),
  );
  const widgetOptionTree: TreeDropdownOption[] = useSelector(
    getWidgetOptionsTree,
  );
  const modalDropdownList = useModalDropdownList();
  const pageDropdownOptions = useSelector(getPageListAsOptions);
  const [actionTree, setActionTree] = useState<ActionTree>(
    codeToAction(value, integrationOptions),
  );

  const selectedOption = getSelectedFieldFromValue(value, integrationOptions);

  const showSuccessAndFailureTabs = useMemo(() => {
    const { actionType } = actionTree;

    return [AppsmithFunction.runAPI, AppsmithFunction.integration].includes(
      actionType as any,
    );
  }, [actionTree.actionType]);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    onValueChange(`{{${actionToCode(actionTree)}}}`, false);
  }, [actionTree]);

  const handleCloseClick = () => {
    setOpen(false);
    setSelectedCallbackBlock(null);

    // Remove all the none actions from the tree
    setActionTree((prev) => {
      const newActionTree = cloneDeep(prev);
      newActionTree.successCallbacks = newActionTree.successCallbacks.filter(
        (cb) => cb.actionType !== AppsmithFunction.none,
      );
      newActionTree.errorCallbacks = newActionTree.errorCallbacks.filter(
        (cb) => cb.actionType !== AppsmithFunction.none,
      );

      return newActionTree;
    });

    // If none action is selected, we just remove the action so we don't show the corresponding block
    if (actionTree.actionType === AppsmithFunction.none) {
      onValueChange("{{}}", false);
    }
  };

  const onCloseByFocusOut = () => {
    // This is to prevent the popover from closing when the user clicks inside the Action blocks
    // Check onClose prop on Popover2 in the render below
    if (!isActionInteraction.current) {
      handleCloseClick();
    }
  };

  const handleMainBlockClick = () => {
    setOpen(true);
    setSelectedCallbackBlock(null);
  };

  const handleBlockSelection = (block: SelectedActionBlock) => {
    setSelectedCallbackBlock(block);
  };

  const addSuccessAction = useCallback(() => {
    setActionTree((prevActionTree) => {
      const newActionTree = cloneDeep(prevActionTree);
      newActionTree.successCallbacks.push({
        actionType: AppsmithFunction.none,
        code: "",
        successCallbacks: [],
        errorCallbacks: [],
      });

      setSelectedCallbackBlock({
        type: "success",
        index: newActionTree.successCallbacks.length - 1,
      });

      return newActionTree;
    });
  }, []);

  const addErrorAction = useCallback(() => {
    setActionTree((prevActionTree) => {
      const newActionTree = cloneDeep(prevActionTree);
      newActionTree.errorCallbacks.push({
        actionType: AppsmithFunction.none,
        code: "",
        successCallbacks: [],
        errorCallbacks: [],
      });

      setSelectedCallbackBlock({
        type: "failure",
        index: newActionTree.errorCallbacks.length - 1,
      });

      return newActionTree;
    });
  }, []);

  const deleteCallbackBlock = useCallback(() => {
    if (!selectedCallbackBlock) return;

    const { index, type } = selectedCallbackBlock;

    setSelectedCallbackBlock(null);

    setActionTree((prevActionTree) => {
      const newActionTree = cloneDeep(prevActionTree);
      if (type === "success") {
        newActionTree.successCallbacks.splice(index, 1);
      } else {
        newActionTree.errorCallbacks.splice(index, 1);
      }
      return newActionTree;
    });
  }, [selectedCallbackBlock]);

  const deleteMainAction = useCallback(() => {
    setActionTree({
      code: "",
      actionType: AppsmithFunction.none,
      successCallbacks: [],
      errorCallbacks: [],
    });
  }, []);

  const handleMouseEnter = () => {
    isActionInteraction.current = true;
  };

  const handleMouseLeave = () => {
    isActionInteraction.current = false;
  };

  const isCallbackBlockSelected = selectedCallbackBlock !== null;

  const shouldAddActionBeDisabled =
    activeTabApiAndQueryCallback.id === "onSuccess"
      ? actionTree.successCallbacks[actionTree.successCallbacks.length - 1]
          ?.actionType === AppsmithFunction.none
      : actionTree.errorCallbacks[actionTree.errorCallbacks.length - 1]
          ?.actionType === AppsmithFunction.none;

  const { errorCallbacks, successCallbacks } = actionTree;

  const callbackBlocks: CallbackBlocks = {
    success: [],
    failure: [],
  };

  callbackBlocks.success = successCallbacks.map((action, index) => {
    const valueWithMoustache = `{{${action.code}}}`;
    return {
      fields: (
        <FieldGroup
          additionalAutoComplete={additionalAutoComplete}
          integrationOptions={integrationOptions}
          isChainedAction
          key={action.actionType + index}
          modalDropdownList={modalDropdownList}
          onValueChange={(newValue) => {
            setActionTree((prevActionTree) => {
              const newActionTree = cloneDeep(prevActionTree);
              const action = newActionTree.successCallbacks[index];
              action.code = getCodeFromMoustache(newValue);
              const selectedField = getSelectedFieldFromValue(
                newValue,
                integrationOptions,
              );
              action.actionType = (selectedField.type ||
                selectedField.value) as any;
              return newActionTree;
            });
          }}
          pageDropdownOptions={pageDropdownOptions}
          value={valueWithMoustache}
          widgetOptionTree={widgetOptionTree}
        />
      ),
      block: (
        <ActionBlockTree
          actionTree={action}
          key={action.code + index}
          onClick={() => setSelectedCallbackBlock({ type: "success", index })}
        />
      ),
    };
  });

  callbackBlocks.failure = errorCallbacks.map((action, index) => {
    const valueWithMoustache = `{{${action.code}}}`;
    return {
      fields: (
        <FieldGroup
          additionalAutoComplete={additionalAutoComplete}
          integrationOptions={integrationOptions}
          isChainedAction
          key={action.actionType + index}
          modalDropdownList={modalDropdownList}
          onValueChange={(newValue) => {
            setActionTree((prevActionTree) => {
              const newActionTree = cloneDeep(prevActionTree);
              const action = newActionTree.errorCallbacks[index];
              action.code = getCodeFromMoustache(newValue);
              const selectedField = getSelectedFieldFromValue(
                newValue,
                integrationOptions,
              );
              action.actionType = (selectedField.type ||
                selectedField.value) as any;
              return newActionTree;
            });
          }}
          pageDropdownOptions={pageDropdownOptions}
          value={valueWithMoustache}
          widgetOptionTree={widgetOptionTree}
        />
      ),
      block: (
        <ActionBlockTree
          actionTree={action}
          key={action.code + index}
          onClick={() => setSelectedCallbackBlock({ type: "failure", index })}
        />
      ),
    };
  });

  const chainActionView = () => {
    return (
      <div className="flex flex-col gap-2">
        {showSuccessAndFailureTabs && (
          <div className="flex flex-col gap-2">
            {activeTabApiAndQueryCallback.id === "onSuccess" &&
              callbackBlocks.success.map(({ block }) => block)}
            {activeTabApiAndQueryCallback.id === "onFailure" &&
              callbackBlocks.failure.map(({ block }) => block)}
          </div>
        )}
        {showSuccessAndFailureTabs ? (
          <div className="flex flex-row">
            <Button
              category={Category.secondary}
              disabled={shouldAddActionBeDisabled}
              onClick={
                activeTabApiAndQueryCallback.id === "onSuccess"
                  ? addSuccessAction
                  : addErrorAction
              }
              text="Add Action"
            />
          </div>
        ) : null}
      </div>
    );
  };

  const boundaryParent =
    (document.querySelector("#canvas-viewport") as HTMLElement) || undefined;

  return (
    <>
      <Popover2
        boundary={boundaryParent}
        className="w-full"
        content={
          <div
            className="flex flex-col w-full"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div className="flex mb-2 w-full justify-between bg-gray-100 px-2 py-1">
              <div className="text-sm font-medium text-gray">
                Configure {isCallbackBlockSelected ? "action" : action}
              </div>
              <Icon
                fillColor="var(--ads-color-gray-700)"
                name="cross"
                onClick={handleCloseClick}
                size="extraSmall"
              />
            </div>

            <div className="flex w-full justify-between px-4 mb-[2px]">
              <div className="text-xs text-gray-600">Action</div>
              <Icon
                fillColor="var(--ads-color-black-700)"
                hoverFillColor="var(--ads-color-black-800)"
                name="delete"
                onClick={() => {
                  if (isCallbackBlockSelected) {
                    deleteCallbackBlock();
                  } else {
                    deleteMainAction();
                  }
                }}
                size="extraLarge"
              />
            </div>

            <div className="p-3 pt-0">
              {isCallbackBlockSelected ? (
                callbackBlocks[selectedCallbackBlock.type][
                  selectedCallbackBlock.index
                ].fields
              ) : (
                <>
                  <SelectorDropdown
                    onSelect={(option: TreeDropdownOption) => {
                      const fieldConfig =
                        FIELD_CONFIG[FieldType.ACTION_SELECTOR_FIELD];
                      const finalValueToSet = fieldConfig.setter(option, "");
                      setActionTree(() => {
                        const selectedField = getSelectedFieldFromValue(
                          finalValueToSet,
                          integrationOptions,
                        );
                        const actionType = (selectedField.type ||
                          selectedField.value ||
                          AppsmithFunction.none) as any;

                        return {
                          code: getCodeFromMoustache(finalValueToSet) || "",
                          actionType,
                          successCallbacks: [],
                          errorCallbacks: [],
                        };
                      });
                    }}
                    options={integrationOptions}
                    selectedOption={selectedOption}
                    value={value}
                  />
                  {showSuccessAndFailureTabs ? (
                    <TabView
                      activeObj={activeTabApiAndQueryCallback}
                      switches={apiAndQueryCallbackTabSwitches}
                    />
                  ) : (
                    <FieldGroup
                      additionalAutoComplete={additionalAutoComplete}
                      integrationOptions={integrationOptions}
                      modalDropdownList={modalDropdownList}
                      onValueChange={(newValue) => {
                        setActionTree(() => {
                          const selectedField = getSelectedFieldFromValue(
                            newValue,
                            integrationOptions,
                          );
                          const actionType = (selectedField.type ||
                            selectedField.value) as any;

                          return {
                            code: getCodeFromMoustache(newValue),
                            actionType,
                            successCallbacks: [],
                            errorCallbacks: [],
                          };
                        });
                      }}
                      pageDropdownOptions={pageDropdownOptions}
                      value={`{{${value}}}`}
                      widgetOptionTree={widgetOptionTree}
                    />
                  )}
                  {chainActionView()}
                </>
              )}
            </div>
          </div>
        }
        isOpen={isOpen}
        minimal
        onClose={onCloseByFocusOut}
        popoverClassName="!translate-x-[-18px] translate-y-[35%] w-[280px]"
        position="left"
      >
        {/* <TooltipComponent boundary="viewport" content="Action"> */}
        {/* {" "} */}

        {actionTree.actionType === AppsmithFunction.none ? (
          <span />
        ) : (
          <div className="mt-1">
            <ActionBlockTree
              actionTree={actionTree}
              handleAddFailureBlock={addErrorAction}
              handleAddSuccessBlock={addSuccessAction}
              handleBlockSelection={handleBlockSelection}
              onClick={handleMainBlockClick}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              selected={isOpen}
              selectedCallbackBlock={selectedCallbackBlock}
            />
          </div>
        )}
      </Popover2>
      {/* </TooltipComponent> */}
    </>
  );
};
