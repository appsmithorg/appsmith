import { Popover2 } from "@blueprintjs/popover2";
import { Icon, TreeDropdownOption } from "design-system-old";
import React from "react";
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
  onChange: (actionBlock: TActionBlock) => void;
}) {
  const action = props.action;
  return (
    <Popover2
      className="w-full"
      content={<ActionSelectorForm action={action} onChange={props.onChange} />}
      isOpen={props.open}
      minimal
      popoverClassName="!translate-x-[-18px] w-[280px]"
      position="left"
      positioningStrategy="fixed"
    >
      {props.children}
    </Popover2>
  );
}

type TActionSelectorFormProps = {
  action: TActionBlock;
  onChange: (actionBlock: TActionBlock) => void;
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
  const { selectBlock } = React.useContext(ActionCreatorContext);
  return (
    <div className="flex flex-col w-full">
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
            onChange({
              code: "",
              actionType: AppsmithFunction.none,
              error: { blocks: [] },
              success: { blocks: [] },
            });
          }}
          size="extraLarge"
        />
      </div>

      <div className="p-3 pt-0">
        <FieldGroup
          additionalAutoComplete={additionalAutoComplete}
          integrationOptions={integrationOptions}
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
