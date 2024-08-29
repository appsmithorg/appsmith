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
    public static final String ACTION_COLLECTION_CREATE_ACTION = APPSMITH_SPAN_PREFIX + "create.action.inCollection";
    public static final String ACTION_COLLECTION_UPDATE_ACTION = APPSMITH_SPAN_PREFIX + "update.action.inCollection";
    public static final String ACTION_COLLECTION_DELETE_ACTION = APPSMITH_SPAN_PREFIX + "delete.action.inCollection";

    public static final String ACTION_COLLECTION_VALIDATE_ACTIONS = APPSMITH_SPAN_PREFIX + "validate.actions";
    public static final String ACTION_COLLECTION_UPDATE = APPSMITH_SPAN_PREFIX + "update.actionCollection";
    public static final String UPDATE_LAYOUT_BASED_ON_CONTEXT = APPSMITH_SPAN_PREFIX + "update.layout.context";
    public static final String GENERATE_ACTION_COLLECTION_BY_VIEW_MODE = APPSMITH_SPAN_PREFIX + "generate.actions";
    public static final String POPULATE_ACTION_COLLECTION_BY_VIEW_MODE = APPSMITH_SPAN_PREFIX + "populate.actions";
    public static final String SAVE_LAST_EDIT_INFORMATION_IN_PARENT = APPSMITH_SPAN_PREFIX + "save.lastEditInfo";
    public static final String UPDATE_SINGLE_ACTION = APPSMITH_SPAN_PREFIX + "update.single.action";
    public static final String UPDATE_ACTION_BASED_ON_CONTEXT = APPSMITH_SPAN_PREFIX + "update.action.context";
    public static final String UPDATE_PAGE_LAYOUT_BY_PAGE_ID = APPSMITH_SPAN_PREFIX + "update.pageLayout.pageId";
    public static final String UPDATE_LAYOUT_METHOD = APPSMITH_SPAN_PREFIX + "update.layout.method";

    // Getter spans
    public static final String GET_ACTION_COLLECTION_BY_ID = APPSMITH_SPAN_PREFIX + "get.actionCollection.unpublished";
    public static final String GET_ACTION_BY_ID = APPSMITH_SPAN_PREFIX + "get.action.unpublished";
    public static final String GET_PAGE_BY_ID = APPSMITH_SPAN_PREFIX + "get.page.unpublished";
}
