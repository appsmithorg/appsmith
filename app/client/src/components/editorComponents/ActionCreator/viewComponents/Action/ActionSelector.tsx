import { Popover2 } from "@blueprintjs/popover2";
import { isModalOpenSelector } from "components/editorComponents/GlobalSearch";
import type { TreeDropdownOption } from "design-system-old";
import { Icon } from "design-system-old";
import React, { useCallback, useRef } from "react";
import { useSelector } from "react-redux";
import { getWidgetOptionsTree } from "sagas/selectors";
import { getPageListAsOptions } from "selectors/entitiesSelector";
import type { AdditionalDynamicDataTree } from "utils/autocomplete/customTreeTypeDefCreator";
import { ActionCreatorContext } from "../..";
import { AppsmithFunction } from "../../constants";
import FieldGroup from "../../FieldGroup";
import {
  useApisQueriesAndJsActionOptions,
  useModalDropdownList,
} from "../../helpers";
import type { TActionBlock } from "../../types";
import { getCodeFromMoustache, getSelectedFieldFromValue } from "../../utils";

export default function ActionSelector(props: {
  action: TActionBlock;
  children: React.ReactNode;
  open: boolean;
  id: string;
  level: number;
  onChange: (actionBlock: TActionBlock, del?: boolean) => void;
}) {
  const action = props.action;
  const isOmnibarOpen = useSelector(isModalOpenSelector);
  let popoverClassName = "";
  switch (props.level) {
    case 0:
      popoverClassName = "w-[280px] !translate-x-[-17px]";
      break;
    case 1:
      popoverClassName = "w-[280px] !translate-x-[-36px]";
      break;
  }

  const portalClassName = isOmnibarOpen ? "!z-1" : "!z-6";

  return (
    <Popover2
      canEscapeKeyClose
      className="w-full"
      content={<ActionSelectorForm action={action} onChange={props.onChange} />}
      isOpen={props.open}
      minimal
      popoverClassName={popoverClassName}
      portalClassName={portalClassName}
      position="left"
      positioningStrategy="fixed"
    >
      {props.children}
    </Popover2>
  );
}

type TActionSelectorFormProps = {
  action: TActionBlock;
  onChange: (actionBlock: TActionBlock, del?: boolean) => void;
  additionalAutoComplete?: AdditionalDynamicDataTree;
};

const pathClassList = [
  "CodeMirror-hints",
  "callback-collapse",
  "bp3-overlay-backdrop",
  "evaluated-value-popup",
  "subtree-container",
  "drag-handle-block",
];

const isClassPresentInList = (path: any, className: string) =>
  path.classList?.contains(className);

const isAddActionAndLabelPresentInPath = (path: any) => {
  return (
    isClassPresentInList(path, "add-action") &&
    isClassPresentInList(path, "label")
  );
};

function ActionSelectorForm(props: TActionSelectorFormProps) {
  const integrationOptions = useApisQueriesAndJsActionOptions(() => {
    return selectBlock("-1");
  });
  const widgetOptionTree: TreeDropdownOption[] =
    useSelector(getWidgetOptionsTree);
  const modalDropdownList = useModalDropdownList(() => {
    return selectBlock("-1");
  });
  const pageDropdownOptions = useSelector(getPageListAsOptions);
  const { action, additionalAutoComplete, onChange } = props;
  const { code } = action;
  const { label, selectBlock, selectedBlockId } =
    React.useContext(ActionCreatorContext);
  const isChainedAction = Boolean(
    Number(selectedBlockId?.split("_").length) > 1,
  );

  const ref = useRef<HTMLDivElement>(null);
  const handleOutsideClick = useCallback(
    (e) => {
      const paths = e.composedPath() || [];
      for (const path of paths) {
        if (
          pathClassList.some((className) =>
            isClassPresentInList(path, className),
          ) ||
          isAddActionAndLabelPresentInPath(path)
        ) {
          return;
        }
        if (ref?.current && path === ref.current) {
          return;
        }
      }
      selectBlock("-1");
      return;
    },
    [selectBlock],
  );

  React.useEffect(() => {
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  return (
    <div
      className="flex flex-col w-full action-selector-popup t--action-selector-popup"
      ref={ref}
    >
      <div className="flex mb-2 w-full justify-between px-2 py-1 bg-gray-50">
        <div className="text-sm font-medium text-gray">
          {isChainedAction ? "Configure action" : label}
        </div>
        <Icon
          className="t--close"
          fillColor="var(--ads-color-black-700)"
          name="cross"
          onClick={() => selectBlock("-1")}
          size="extraSmall"
        />
      </div>

      <div className="flex w-full justify-between px-3 mb-[4px]">
        <div className="text-xs text-gray-600">Action</div>
        <Icon
          className="t--delete"
          fillColor="var(--ads-color-black-500)"
          hoverFillColor="var(--ads-color-black-700)"
          name="delete"
          onClick={() => {
            onChange(
              {
                code: "",
                actionType: AppsmithFunction.none,
                error: { blocks: [] },
                success: { blocks: [] },
              },
              true,
            );
            selectBlock("-1");
          }}
          size="extraLarge"
        />
      </div>

      <div className="p-3 pt-0">
        <FieldGroup
          additionalAutoComplete={additionalAutoComplete}
          integrationOptions={integrationOptions}
          isChainedAction={isChainedAction}
          modalDropdownList={modalDropdownList}
          onValueChange={(newValue) => {
            const code = getCodeFromMoustache(newValue);
            const selectedField = getSelectedFieldFromValue(
              code,
              integrationOptions,
            );
            const actionType = (selectedField.type ||
              selectedField.value) as any;
            onChange({
              ...action,
              code,
              actionType,
            });
          }}
          pageDropdownOptions={pageDropdownOptions}
          value={`{{${code}}}`}
          widgetOptionTree={widgetOptionTree}
        />
      </div>
    </div>
  );
}
