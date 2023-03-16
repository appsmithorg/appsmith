import React, { useCallback, useEffect, useState } from "react";
import ActionV2 from ".";
import { useApisQueriesAndJsActionOptions } from "../../helpers";
import { TActionBlock } from "../../types";
import { actionToCode, codeToAction } from "../../utils";

type TRootActionProps = {
  code: string;
  id: string;
  onChange: (code: string) => void;
};

export default function RootAction(props: TRootActionProps) {
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

  const handleChange = useCallback((actionBlock: TActionBlock) => {
    const newCode = actionToCode(actionBlock, true);
    onChange(newCode);
  }, []);

  return (
    <ActionV2
      actionBlock={action}
      className="mt-2"
      id={id}
      onChange={handleChange}
      supportCallback
    />
  );
}
