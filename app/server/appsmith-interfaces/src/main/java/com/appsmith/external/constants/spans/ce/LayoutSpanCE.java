package com.appsmith.external.constants.spans.ce;

import static com.appsmith.external.constants.spans.BaseSpan.APPSMITH_SPAN_PREFIX;

public class LayoutSpanCE {
    public static final String UPDATE_LAYOUT = "updateLayout.";
    public static final String UPDATE_PAGE_LAYOUT_BY_PAGE_ID = APPSMITH_SPAN_PREFIX + UPDATE_LAYOUT + "pageId";
    public static final String UPDATE_LAYOUT_METHOD = APPSMITH_SPAN_PREFIX + UPDATE_LAYOUT + "method";
    public static final String UPDATE_LAYOUT_DSL_METHOD = APPSMITH_SPAN_PREFIX + UPDATE_LAYOUT + "dsl.method";
    public static final String UPDATE_LAYOUT_BASED_ON_CONTEXT = APPSMITH_SPAN_PREFIX + UPDATE_LAYOUT + "context";

    public static final String FIND_ALL_ON_LOAD_EXECUTABLES =
            APPSMITH_SPAN_PREFIX + "onLoadExecutablesUtil.findAllOnLoadExecutables";
    public static final String UPDATE_EXECUTABLES_RUN_BEHAVIOUR =
            APPSMITH_SPAN_PREFIX + "onLoadExecutablesUtil.updateExecutablesRunBehaviour";
    public static final String FIND_AND_UPDATE_LAYOUT =
            APPSMITH_SPAN_PREFIX + "onLoadExecutablesUtil.findAndUpdateLayout";
    public static final String UNESCAPE_MONGO_SPECIAL_CHARS = APPSMITH_SPAN_PREFIX + "unescapeMongoSpecialCharacters";
    public static final String EXTRACT_ALL_WIDGET_NAMES_AND_DYNAMIC_BINDINGS_FROM_DSL =
            APPSMITH_SPAN_PREFIX + "extractAllWidgetNamesAndDynamicBindingsFromDSL";
    public static final String EXTRACT_AND_SET_EXECUTABLE_BINDINGS_IN_GRAPH_EDGES =
            APPSMITH_SPAN_PREFIX + "extractAndSetExecutableBindingsInGraphEdges";
    public static final String RECURSIVELY_ADD_EXECUTABLES_AND_THEIR_DEPENDENTS_TO_GRAPH_FROM_BINDINGS =
            APPSMITH_SPAN_PREFIX + "recursivelyAddExecutablesAndTheirDependentsToGraphFromBindings";
    public static final String ADD_WIDGET_RELATIONSHIP_TO_GRAPH = APPSMITH_SPAN_PREFIX + "addWidgetRelationshipToGraph";
    public static final String COMPUTE_ON_PAGE_LOAD_EXECUTABLES_SCHEDULING_ORDER =
            APPSMITH_SPAN_PREFIX + "computeOnPageLoadExecutablesSchedulingOrder";
    public static final String FILTER_AND_TRANSFORM_SCHEDULING_ORDER_TO_DTO =
            APPSMITH_SPAN_PREFIX + "filterAndTransformSchedulingOrderToDTO";
}
