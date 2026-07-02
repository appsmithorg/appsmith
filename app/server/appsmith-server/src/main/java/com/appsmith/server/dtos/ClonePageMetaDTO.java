package com.appsmith.server.dtos;

import com.appsmith.external.git.constants.ce.RefType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashMap;
import java.util.Map;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class ClonePageMetaDTO {
    String branchedSourcePageId;
    PageDTO clonedPageDTO;
    RefType refType;
    String refName;
    Map<String, String> oldToNewCollectionIds = new HashMap<>();
    // Populated by the page-clone DSL regeneration step (see DslUtils#regenerateWidgetIds and
    // ApplicationPageServiceCEImpl#clonePageGivenApplicationId). Downstream cloners that hold
    // widget id references outside the DSL (e.g. ModuleInstance.widgetId) translate their
    // source-page widget ids through this map so the cloned references resolve to the
    // freshly generated widgets on the cloned page. Sibling of oldToNewCollectionIds.
    Map<String, String> oldToNewWidgetIds = new HashMap<>();
}
