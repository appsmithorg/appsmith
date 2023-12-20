import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { noop } from "lodash";
import type { RouteComponentProps } from "react-router";

import Loader from "./Loader";
import JsEditorForm from "pages/Editor/JSEditor/Form";
import ModuleJSEditorContextMenu from "./ModuleJSEditorContextMenu";
import { getIsPackageEditorInitialized } from "@appsmith/selectors/packageSelectors";
import { getJSCollectionDataById } from "selectors/editorSelectors";
import { saveJSObjectName } from "actions/jsActionActions";

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

  if (!isPackageEditorInitialized || !jsCollection) {
    return <Loader />;
  }

  return (
    <JsEditorForm
      contextMenu={contextMenu}
      jsCollectionData={jsCollectionData}
      onUpdateSettings={noop}
      saveJSObjectName={saveJSObjectName}
      showSettings={false}
    />
  );
}

export default ModuleJSEditor;
