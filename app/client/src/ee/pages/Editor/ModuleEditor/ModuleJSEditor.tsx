import React, { useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { noop } from "lodash";
import type { RouteComponentProps } from "react-router";

import Loader from "./Loader";
import JsEditorForm from "pages/Editor/JSEditor/Form";
import ModuleJSEditorContextMenu from "./ModuleJSEditorContextMenu";
import { getIsPackageEditorInitialized } from "@appsmith/selectors/packageSelectors";
import { getJSCollectionDataById } from "selectors/editorSelectors";
import {
  type SaveModuleNamePayload,
  saveModuleName,
} from "@appsmith/actions/moduleActions";
import { saveJSObjectNameBasedOnParentEntity } from "@appsmith/actions/helpers";
import { ActionParentEntityType } from "@appsmith/entities/Engine/actionHelpers";

interface ModuleJSEditorRouteParams {
  packageId: string;
  moduleId: string;
  collectionId: string;
}

type ModuleJSEditorProps = RouteComponentProps<ModuleJSEditorRouteParams>;

function ModuleJSEditor(props: ModuleJSEditorProps) {
  const { collectionId, moduleId } = props.match.params;
  const isPackageEditorInitialized = useSelector(getIsPackageEditorInitialized);
  const jsCollectionData = useSelector((state) =>
    getJSCollectionDataById(state, collectionId),
  );

  const jsCollection = jsCollectionData?.config;
  const contextMenu = useMemo(() => {
    if (!jsCollection) {
      return null;
    }

    return (
      <ModuleJSEditorContextMenu
        jsCollection={jsCollection}
        moduleId={moduleId}
      />
    );
  }, [jsCollection, moduleId]);

  const onSaveName = useCallback(
    ({ name }: SaveModuleNamePayload) => {
      const isPublicEntity = jsCollectionData?.config.isPublic;
      return isPublicEntity
        ? saveModuleName({
            id: moduleId,
            name,
          })
        : saveJSObjectNameBasedOnParentEntity(
            collectionId,
            name,
            ActionParentEntityType.MODULE,
          );
    },
    [moduleId, jsCollectionData?.config.isPublic, collectionId],
  );

  if (!isPackageEditorInitialized || !jsCollection) {
    return <Loader />;
  }

  return (
    <JsEditorForm
      contextMenu={contextMenu}
      jsCollectionData={jsCollectionData}
      onUpdateSettings={noop}
      saveJSObjectName={onSaveName}
      showSettings={false}
    />
  );
}

export default ModuleJSEditor;
