import React from "react";
import type { RouteComponentProps } from "react-router";

import Loader from "../ModuleEditor/Loader";
import QueryModuleInstance from "./Query";
import JSModuleInstance from "./JS";
import { useSelector } from "react-redux";
import { getModuleInstanceById } from "@appsmith/selectors/moduleInstanceSelectors";
import { MODULE_TYPE } from "@appsmith/constants/ModuleConstants";

interface ModuleInstanceRouteParams {
  moduleInstanceId: string;
}

const EDITORS = {
  [MODULE_TYPE.QUERY]: QueryModuleInstance,
  [MODULE_TYPE.JS]: JSModuleInstance,
  [MODULE_TYPE.UI]: () => null,
};

export type ModuleInstanceEditorProps =
  RouteComponentProps<ModuleInstanceRouteParams>;

function ModuleInstanceEditor(props: ModuleInstanceEditorProps) {
  const { moduleInstanceId } = props.match.params;

  const moduleInstance = useSelector((state) =>
    getModuleInstanceById(state, moduleInstanceId),
  );

  if (!moduleInstance) {
    return <Loader />;
  }

  const Editor = EDITORS[moduleInstance.type];

  return <Editor moduleInstanceId={moduleInstanceId} />;
}

export default ModuleInstanceEditor;
