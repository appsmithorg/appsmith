import React, { useEffect } from "react";
import DialogComponent from "components/ads/DialogComponent";
import { useDispatch, useSelector } from "react-redux";
import {
  templateModalOpenSelector,
  templatesCountSelector,
} from "selectors/templatesSelectors";
import { getAllTemplates, showTemplatesModal } from "actions/templateActions";
import TemplatesList from "./TemplateList";
import { fetchDefaultPlugins } from "actions/pluginActions";
import { AppState } from "reducers";

function TemplatesModal() {
  const templatesModalOpen = useSelector(templateModalOpenSelector);
  const dispatch = useDispatch();
  const templatesCount = useSelector(templatesCountSelector);
  const pluginListLength = useSelector(
    (state: AppState) => state.entities.plugins.defaultPluginList.length,
  );

  useEffect(() => {
    if (!templatesCount) {
      dispatch(getAllTemplates());
    }
  }, [templatesCount]);

  useEffect(() => {
    if (!pluginListLength) {
      dispatch(fetchDefaultPlugins());
    }
  }, [pluginListLength]);

  const onClose = () => {
    dispatch(showTemplatesModal(false));
  };

  return (
    <DialogComponent
      canEscapeKeyClose
      canOutsideClickClose
      isOpen={templatesModalOpen}
      maxHeight={"90vh"}
      onClose={onClose}
      width={"90%"}
    >
      <TemplatesList />
    </DialogComponent>
  );
}

export default TemplatesModal;
