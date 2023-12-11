import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RouteComponentProps } from "react-router";

import { setCurrentModule, setupModule } from "@appsmith/actions/moduleActions";
import {
  getIsModuleFetchingActions,
  getModuleById,
} from "@appsmith/selectors/modulesSelector";
import ModuleEditorDefaultRedirect from "./ModuleEditorDefaultRedirect";
import urlBuilder from "@appsmith/entities/URLRedirect/URLAssembly";
import Loader from "./Loader";

interface RouteProps {
  moduleId: string;
}

export type ModuleEditorProps = RouteComponentProps<RouteProps>;

function ModuleEditor({ match }: ModuleEditorProps) {
  const { moduleId } = match.params;
  const dispatch = useDispatch();
  const isModuleFetchingActions = useSelector(getIsModuleFetchingActions);
  const module = useSelector((state) => getModuleById(state, moduleId));

  useEffect(() => {
    dispatch(setupModule({ moduleId }));
  }, [moduleId]);

  useEffect(() => {
    urlBuilder.setCurrentModuleId(moduleId);

    return () => {
      dispatch(setCurrentModule(undefined));
      urlBuilder.setCurrentModuleId(undefined);
    };
  }, [moduleId]);

  if (!module) return null;

  if (isModuleFetchingActions) {
    return <Loader />;
  }

  /* Redirect to default url */
  return <ModuleEditorDefaultRedirect module={module} />;
}

export default ModuleEditor;
