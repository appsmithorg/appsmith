package com.appsmith.external.constants.spans.ce;

import static com.appsmith.external.constants.spans.BaseSpan.APPSMITH_SPAN_PREFIX;

public class OnLoadSpanCE {

    public static final String GET_ALL_EXECUTABLES_BY_CREATOR_ID =
            APPSMITH_SPAN_PREFIX + "getAllExecutablesByCreatorIdFlux";
    public static final String EXECUTABLE_NAME_TO_EXECUTUTABLE_MAP =
            APPSMITH_SPAN_PREFIX + "executableNameToExecutableMapMono";
    public static final String EXECUTABLE_IN_CREATOR_CONTEXT = APPSMITH_SPAN_PREFIX + "executablesInCreatorContextMono";
    public static final String ADD_DIRECTLY_REFERENCED_EXECUTABLES_TO_GRAPH =
            APPSMITH_SPAN_PREFIX + "addDirectlyReferencedExecutablesToGraph";
    public static final String GET_POSSIBLE_ENTITY_REFERENCES = APPSMITH_SPAN_PREFIX + "getPossibleEntityReferences";
    public static final String UPDATE_EXECUTABLE_SELF_REFERENCING_PATHS =
            APPSMITH_SPAN_PREFIX + "updateExecutableSelfReferencingPaths";
    public static final String EXTRACT_AND_SET_EXECUTABLE_BINDING_IN_GRAPH =
            APPSMITH_SPAN_PREFIX + "extractAndSetExecutableBindingsInGraphEdges";
    public static final String GET_POSSIBLE_ENTITY_PARENTS_MAP = APPSMITH_SPAN_PREFIX + "getPossibleEntityParentsMap";
    public static final String ADD_EXPLICIT_USER_SET_ON_LOAD_EXECUTABLES_TO_GRAPH =
            APPSMITH_SPAN_PREFIX + "addExplicitUserSetOnLoadExecutablesToGraph";
    public static final String GET_UNPUBLISHED_ON_LOAD_EXECUTABLES_EXPLICIT_SET_BY_USER_IN_CREATOR_CONTEXT =
            APPSMITH_SPAN_PREFIX + "getUnpublishedOnLoadExecutablesExplicitSetByUserInCreatorContextFlux";
}
