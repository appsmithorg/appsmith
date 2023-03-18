import { Popover2 } from "@blueprintjs/popover2";
import { Icon, TreeDropdownOption } from "design-system-old";
import React, { useCallback, useRef } from "react";
import { useSelector } from "react-redux";
import { getWidgetOptionsTree } from "sagas/selectors";
import { getPageListAsOptions } from "selectors/entitiesSelector";
import { AdditionalDynamicDataTree } from "utils/autocomplete/customTreeTypeDefCreator";
import { ActionCreatorContext } from "../..";
import { AppsmithFunction } from "../../constants";
import FieldGroup from "../../FieldGroup";
import {
  useApisQueriesAndJsActionOptions,
  useModalDropdownList,
} from "../../helpers";
import { TActionBlock } from "../../types";
import { getCodeFromMoustache, getSelectedFieldFromValue } from "../../utils";

export default function ActionSelector(props: {
  action: TActionBlock;
  children: React.ReactNode;
  open: boolean;
  id: string;
  onChange: (actionBlock: TActionBlock, del?: boolean) => void;
}) {
  const action = props.action;
  const isNested = props.id?.split("_").length > 1;
  const popoverClassName = isNested
    ? "w-[280px] !translate-x-[-32px]"
    : "w-[280px] !translate-x-[-17px]";

  return (
    <Popover2
      canEscapeKeyClose
      className="w-full"
      content={<ActionSelectorForm action={action} onChange={props.onChange} />}
      isOpen={props.open}
      minimal
      popoverClassName={popoverClassName}
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

function ActionSelectorForm(props: TActionSelectorFormProps) {
  const integrationOptions = useApisQueriesAndJsActionOptions(() => {
    return;
  });
  const widgetOptionTree: TreeDropdownOption[] = useSelector(
    getWidgetOptionsTree,
  );
  const modalDropdownList = useModalDropdownList();
  const pageDropdownOptions = useSelector(getPageListAsOptions);
  const { action, additionalAutoComplete, onChange } = props;
  const { code } = action;
  const isCallbackBlockSelected = true;
  const { selectBlock, selectedBlockId } = React.useContext(
    ActionCreatorContext,
  );
  const isChainedAction = Boolean(selectedBlockId?.split("_").length);

  const ref = useRef<HTMLDivElement>(null);
  const handleOutsideClick = useCallback(
    (e) => {
      const paths = e.composedPath() || [];
      for (const path of paths) {
        if (
          path.classList?.contains("CodeMirror-hints") ||
          path.classList?.contains("callback-collapse") ||
          path.classList?.contains("add-action")
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
    <div className="flex flex-col w-full" ref={ref}>
      <div className="flex mb-2 w-full justify-between px-2 py-1 bg-gray-50">
        <div className="text-sm font-medium text-gray">
          {isCallbackBlockSelected
            ? "Configure action"
            : `${action.actionType}...`}
        </div>
        <Icon
          fillColor="var(--ads-color-black-700)"
          name="cross"
          onClick={() => selectBlock("-1")}
          size="extraSmall"
        />
      </div>

      <div className="flex w-full justify-between px-3 mb-[4px]">
        <div className="text-xs text-gray-600">Action</div>
        <Icon
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
