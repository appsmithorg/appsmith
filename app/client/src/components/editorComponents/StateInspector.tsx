import React, { useEffect } from "react";
import { getActions } from "@appsmith/selectors/entitiesSelector";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { isArray, isNil, isObject, keyBy } from "lodash";
import { getStateInspectorStatus } from "selectors/stateInspectorSelector";
import { openStateInspector } from "actions/stateInspectorActions";

export default function StateInspector() {
  const [selectedAction, setSelectedAction] = useState<string>();
  const status = useSelector(getStateInspectorStatus);
  const actions = useSelector(getActions);
  const setActionValue = (ev: any) => {
    const { actionId } = ev.currentTarget.dataset;
    setSelectedAction(actionId);
  };

  const dispatch = useDispatch();

  const openStateInspectorFn = () => {
    dispatch(openStateInspector());
  };

  useEffect(() => {
    document.addEventListener("openstateinspector", openStateInspectorFn);
  }, []);

  const actionByKey = keyBy(actions, "config.id");

  if (!status) return null;

  return (
    <div className="flex h-128 w-full fixed z-10 left-0 bottom-0 state-inspector">
      <div className="bg-gray-900 text-gray-200 p-6 border-r border-gray-800 w-64 flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <p className="text-xl font-bold">State Inspector</p>
        </div>
        <nav className="flex flex-col gap-2">
          {actions.map((action) => (
            <a
              data-action-id={action.config.id}
              key={action.config.id}
              onClick={setActionValue}
            >
              {action.config.name}
            </a>
          ))}
        </nav>
      </div>
      <div className="flex-1 bg-gray-900 text-gray-200 p-8 overflow-y-auto">
        <div className="grid grid-cols-1 gap-8">
          <h2 className="text-2xl font-bold mb-4">Response</h2>
          <nav className="flex flex-col gap-2">
            {selectedAction && !isNil(actionByKey[selectedAction].data?.body)
              ? isArray(actionByKey[selectedAction].data?.body)
                ? (actionByKey[selectedAction]?.data?.body || []).map(
                    (_: any, index: number) => (
                      <a
                        data-action-id={actionByKey[selectedAction].config.id}
                        key={actionByKey[selectedAction].config.id}
                        onClick={setActionValue}
                      >
                        {index}
                      </a>
                    ),
                  )
                : isObject(actionByKey[selectedAction].data?.body)
                  ? Object.keys(
                      actionByKey[selectedAction]?.data?.body || {},
                    ).map((objectKey) => (
                      <a
                        data-action-id={actionByKey[selectedAction].config.id}
                        key={actionByKey[selectedAction].config.id}
                        onClick={setActionValue}
                      >
                        {objectKey}
                      </a>
                    ))
                  : null
              : null}
          </nav>
        </div>
      </div>
      <div className="bg-gray-800 text-gray-200 p-6 border-l border-gray-700 w-80 flex flex-col gap-6">
        Leaf node
      </div>
    </div>
  );
}
