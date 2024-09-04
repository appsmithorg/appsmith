package com.appsmith.external.constants.spans.ce;

import static com.appsmith.external.constants.spans.BaseSpan.APPSMITH_SPAN_PREFIX;

/**
 * Please make sure that all span names start with `appsmith.` because span with any other naming format would get
 * dropped / ignored as defined in TracingConfig.java
 */
public class ActionCollectionSpanCE {
    // Action Collection spans
    public static final String ACTION_COLLECTION = "actionCollection.";
    public static final String ACTION_COLLECTION_VIEW_MODE_PREFIX = ACTION_COLLECTION;

    public static final String ACTION_COLLECTION_UPDATE = APPSMITH_SPAN_PREFIX + "update.actionCollection";
    public static final String GENERATE_ACTION_COLLECTION_BY_VIEW_MODE = APPSMITH_SPAN_PREFIX + "generate.actions";
    public static final String POPULATE_ACTION_COLLECTION_BY_VIEW_MODE = APPSMITH_SPAN_PREFIX + "populate.actions";
    public static final String SAVE_LAST_EDIT_INFORMATION_IN_PARENT = APPSMITH_SPAN_PREFIX + "save.lastEditInfo";

    // Getter spans
    public static final String GET_ACTION_COLLECTION_BY_ID = APPSMITH_SPAN_PREFIX + "get.actionCollection.unpublished";
}
