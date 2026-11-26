package com.appsmith.server.dtos;

import com.appsmith.external.git.constants.ce.RefType;
import com.appsmith.server.domains.NewPage;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class ClonePageMetaDTO {
    String branchedSourcePageId;
    PageDTO clonedPageDTO;
    // The cloned page as persisted, loaded once so that every cloned action is created against it instead of
    // re-reading the page (and its DSL) per action. See LayoutActionServiceCE#createAction.
    NewPage clonedNewPage;
    RefType refType;
    String refName;
    // Cloners fill these maps from concurrent flatMap branches, so the maps must tolerate concurrent puts.
    Map<String, String> oldToNewCollectionIds = Collections.synchronizedMap(new HashMap<>());
    // Populated by the page-clone DSL regeneration step (see DslUtils#regenerateWidgetIds and
    // ApplicationPageServiceCEImpl#clonePageGivenApplicationId). Downstream cloners that hold
    // widget id references outside the DSL (e.g. ModuleInstance.widgetId) translate their
    // source-page widget ids through this map so the cloned references resolve to the
    // freshly generated widgets on the cloned page. Sibling of oldToNewCollectionIds.
    Map<String, String> oldToNewWidgetIds = Collections.synchronizedMap(new HashMap<>());
}
