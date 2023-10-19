import React from "react";
import { Redirect, matchPath, useLocation } from "react-router";

import { MODULE_EDITOR_PATH } from "@appsmith/constants/routes/packageRoutes";
import type { Module } from "@appsmith/constants/ModuleConstants";

interface ModuleEditorDefaultRedirectProps {
  module: Module;
}

function ModuleEditorDefaultRedirect({
  module,
}: ModuleEditorDefaultRedirectProps) {
  const { pathname } = useLocation();
  const { isExact } = matchPath(pathname, MODULE_EDITOR_PATH) || {};

  const defaultRedirectUrl = `${pathname}/queries/${module.publicEntityId}`;

  if (!isExact) return null;

  return <Redirect to={defaultRedirectUrl} />;
}

export default ModuleEditorDefaultRedirect;
