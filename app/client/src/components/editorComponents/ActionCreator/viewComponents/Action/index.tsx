import React, { useCallback, useEffect, useState } from "react";
import ActionTree from "./ActionTree";
import { useApisQueriesAndJsActionOptions } from "../../helpers";
import type { TActionBlock } from "../../types";
import { actionToCode, codeToAction } from "../../utils";
import type { AdditionalDynamicDataTree } from "utils/autocomplete/customTreeTypeDefCreator";

interface TRootActionProps {
  code: string;
  id: string;
  onChange: (code: string) => void;
  index: number;
  propertyName: string;
  widgetName: string;
  widgetType: string;
  dataTreePath: string | undefined;
  additionalAutoComplete?: AdditionalDynamicDataTree;
}

export default function Action(props: TRootActionProps) {
  const { code, id, onChange } = props;

  const integrationOptions = useApisQueriesAndJsActionOptions(() => {
    return;
  });

  const [action, setAction] = useState(() =>
    codeToAction(code, integrationOptions),
  );

  useEffect(() => {
    setAction(() => codeToAction(code, integrationOptions));
  }, [code, id, integrationOptions]);

  const handleChange = useCallback(
    (actionBlock: TActionBlock) => {
      const newCode = actionToCode(actionBlock, true);

      onChange(newCode);
    },
    [onChange],
  );

  return (
    <ActionTree
      actionBlock={action}
      additionalAutoComplete={props.additionalAutoComplete}
      className={`${props.index === 0 ? "mt-1" : "mt-2"}`}
      dataTreePath={props.dataTreePath}
      id={id}
      level={0}
      onChange={handleChange}
      propertyName={props.propertyName}
      widgetName={props.widgetName}
      widgetType={props.widgetType}
    />
  );
}
