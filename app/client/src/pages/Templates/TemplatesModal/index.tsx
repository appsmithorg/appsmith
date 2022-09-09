import React, { useEffect, useState } from "react";
import DialogComponent from "components/ads/DialogComponent";
import { useDispatch, useSelector } from "react-redux";
import {
  templateModalOpenSelector,
  templatesCountSelector,
} from "selectors/templatesSelectors";
import {
  getAllTemplates,
  getTemplateFilters,
  showTemplatesModal,
} from "actions/templateActions";
import TemplatesList from "./TemplateList";
import { fetchDefaultPlugins } from "actions/pluginActions";
import TemplateDetailedView from "./TemplateDetailedView";
import { isEmpty } from "lodash";
import { AppState } from "@appsmith/reducers";

function TemplatesModal() {
  const templatesModalOpen = useSelector(templateModalOpenSelector);
  const dispatch = useDispatch();
  const templatesCount = useSelector(templatesCountSelector);
  const pluginListLength = useSelector(
    (state: AppState) => state.entities.plugins.defaultPluginList.length,
  );
  const filters = useSelector(
    (state: AppState) => state.ui.templates.allFilters,
  );
  const [showTemplateDetails, setShowTemplateDetails] = useState("");

  useEffect(() => {
    setShowTemplateDetails("");
  }, [templatesModalOpen]);

  useEffect(() => {
    if (!templatesCount && templatesModalOpen) {
      dispatch(getAllTemplates());
    }
  }, [templatesCount, templatesModalOpen]);

  useEffect(() => {
    if (!pluginListLength) {
      dispatch(fetchDefaultPlugins());
    }
  }, [pluginListLength]);

  useEffect(() => {
    if (isEmpty(filters.functions)) {
      dispatch(getTemplateFilters());
    }
  }, [filters]);

  const onClose = () => {
    dispatch(showTemplatesModal(false));
    setShowTemplateDetails("");
  };

  const onTemplateClick = (id: string) => {
    setShowTemplateDetails(id);
  };

  return (
    <DialogComponent
      canEscapeKeyClose
      canOutsideClickClose
      isOpen={templatesModalOpen}
      noModalBodyMarginTop
      onClose={onClose}
      width={"90%"}
    >
      {!!showTemplateDetails ? (
        <TemplateDetailedView
          onBackPress={() => setShowTemplateDetails("")}
          onClose={onClose}
          templateId={showTemplateDetails}
        />
      ) : (
        <TemplatesList onClose={onClose} onTemplateClick={onTemplateClick} />
      )}
    </DialogComponent>
  );
}

export default TemplatesModal;
