import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Popover2 } from "@blueprintjs/popover2";
import {
  Button,
  Category,
  Icon,
  Size,
  TreeDropdownOption,
} from "design-system";
import { SelectorDropdown } from "../SelectorDropdown";
import { FIELD_CONFIG } from "../../Field/FieldConfig";
import FieldGroup from "../../FieldGroup";
import { AppsmithFunction, FieldType } from "../../constants";
import { ActionBlock } from "../ActionBlock";
import {
  ActionTree,
  DataTreeForActionCreator,
  SelectedActionBlock,
  SwitchType,
} from "../../types";
import {
  actionToCode,
  codeToAction,
  getSelectedFieldFromValue,
  isValueValidURL,
  JSToString,
} from "../../utils";
import { useSelector } from "react-redux";
import {
  getDataTreeForActionCreator,
  getWidgetOptionsTree,
} from "sagas/selectors";
import { getPageListAsOptions } from "selectors/entitiesSelector";
import {
  getFieldFromValue,
  useApisQueriesAndJsActionOptions,
  useModalDropdownList,
} from "../../helpers";
import {
  getFuncExpressionAtPosition,
  getFunction,
  replaceActionInQuery,
} from "@shared/ast";
import { TabView } from "../TabView";
import { cloneDeep } from "lodash";
import { getDynamicBindings } from "utils/DynamicBindingUtils";
import { ActionBlockTree } from "../ActionBlockTree";

type Props = {
  action: string;
  value: string;
  onValueChange: (newValue: string, isUpdatedViaKeyboard: boolean) => void;
  additionalAutoComplete?: Record<string, Record<string, unknown>>;
  onClick: () => void;
  handleClose: () => void;
  isOpen: boolean;
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
  handleClose,
  isOpen,
  onClick,
  onValueChange,
  value,
}) => {
  const firstRender = React.useRef(true);
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
  const integrationOptions = useApisQueriesAndJsActionOptions();
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

  console.log("** Actions **", actionTree, "******", "******");

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    console.log("actionTree", actionTree, "****", actionToCode(actionTree));
    onValueChange(`{{${actionToCode(actionTree)}}}`, false);
  }, [actionTree]);

  console.log("success** actionTree", actionTree);

  const addSuccessAction = useCallback(() => {
    setActionTree((prevActionTree) => {
      const newActionTree = cloneDeep(prevActionTree);
      newActionTree.successCallbacks.push({
        actionType: AppsmithFunction.none,
        code: "",
        successCallbacks: [],
        errorCallbacks: [],
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
      return newActionTree;
    });
  }, []);

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
          key={action.code + index}
          modalDropdownList={modalDropdownList}
          onValueChange={(newValue, isUpdatedViaKeyboard) => {
            setActionTree((prevActionTree) => {
              const newActionTree = cloneDeep(prevActionTree);
              const action = newActionTree.successCallbacks[index];
              action.code = getDynamicBindings(newValue).jsSnippets[0];
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
          key={action.code + index}
          modalDropdownList={modalDropdownList}
          onValueChange={(newValue, isUpdatedViaKeyboard) => {
            setActionTree((prevActionTree) => {
              const newActionTree = cloneDeep(prevActionTree);
              const action = newActionTree.errorCallbacks[index];
              action.code = getDynamicBindings(newValue).jsSnippets[0];
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
        ) : // </div>
        null}
      </div>
    );
  };

  return (
    <>
      <Popover2
        className="w-full"
        content={
          <div className="flex flex-col w-full">
            <div className="flex mb-2 w-full justify-between bg-gray-100 px-2 py-1">
              <div className="text-sm font-medium text-gray">
                Configure {isCallbackBlockSelected ? "action" : action}
              </div>
              <Icon
                className="t--close-action-creator"
                fillColor="var(--ads-color-gray-700)"
                name="cross"
                onClick={() => handleClose()}
                size="extraExtraSmall"
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
                    onSelect={(
                      option: TreeDropdownOption,
                      defaultVal: any,
                      isUpdatedViaKeyboard: boolean,
                    ) => {
                      const fieldConfig =
                        FIELD_CONFIG[FieldType.ACTION_SELECTOR_FIELD];
                      const finalValueToSet = fieldConfig.setter(option, "");
                      setActionTree(() => {
                        const selectedField = getSelectedFieldFromValue(
                          finalValueToSet,
                          integrationOptions,
                        );
                        const actionType = (selectedField.type ||
                          selectedField.value) as any;

                        return {
                          code: getDynamicBindings(finalValueToSet)
                            .jsSnippets[0],
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
                      onValueChange={(newValue, isUpdatedViaKeyboard) => {
                        setActionTree(() => {
                          const selectedField = getSelectedFieldFromValue(
                            newValue,
                            integrationOptions,
                          );
                          const actionType = (selectedField.type ||
                            selectedField.value) as any;

                          return {
                            code: getDynamicBindings(newValue).jsSnippets[0],
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
        // onClose={() => setOpen(false)}
        // onClosed={() => setOpen(false)}
        // onInteraction={() => setOpen(!isOpen)}
        popoverClassName="!translate-x-[-18px] translate-y-[35%] w-[280px]"
        position="left"
      >
        <span />
      </Popover2>
      {/* <TooltipComponent boundary="viewport" content="Action"> */}
      {/* {" "} */}

      <div className="mt-1">
        <ActionBlockTree
          actionTree={actionTree}
          handleAddFailureBlock={addErrorAction}
          handleAddSuccessBlock={addSuccessAction}
          handleBlockSelection={setSelectedCallbackBlock}
          onClick={() => {
            onClick();
            setSelectedCallbackBlock(null);
          }}
          selected={isOpen}
          selectedCallbackBlock={selectedCallbackBlock}
        />
      </div>
      {/* </TooltipComponent> */}
    </>
  );
};
