package com.appsmith.server.helpers;

import com.appsmith.external.git.models.GitResourceIdentity;
import com.appsmith.external.git.models.GitResourceMap;
import com.appsmith.external.git.models.GitResourceType;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.PluginType;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.ce.CommonGitFileUtilsCE;
import com.appsmith.server.newactions.base.NewActionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * The page that owns an action or an action collection becomes a directory name in the Git
 * repository, so its name must be a single path segment.
 */
@ExtendWith(MockitoExtension.class)
class CommonGitFileUtilsCEPathSegmentTest {

    @Mock
    private ArtifactGitFileUtils<ApplicationJson> applicationGitFileUtils;

    @Mock
    private NewActionService newActionService;

    @Mock
    private ActionCollectionService actionCollectionService;

    private CommonGitFileUtilsCE commonGitFileUtils;

    @BeforeEach
    void setUp() {
        commonGitFileUtils = new CommonGitFileUtilsCE(
                applicationGitFileUtils,
                null,
                null,
                null,
                null,
                null,
                newActionService,
                actionCollectionService,
                null,
                new ObjectMapper(),
                null);
    }

    static Stream<String> namesThatAreNotSinglePathSegments() {
        return Stream.of("", ".", "..", "Parent/Child", "Parent\\Child", "Page\u0000One");
    }

    @ParameterizedTest
    @MethodSource("namesThatAreNotSinglePathSegments")
    @DisplayName("GHSA-x4j8-9c4j-73r7")
    void should_rejectSerialization_when_actionContextNameIsNotSinglePathSegment(String contextName) {
        // Given
        ApplicationJson applicationJson = new ApplicationJson();
        applicationJson.setActionList(new ArrayList<>(List.of(actionInContext(contextName))));

        // When
        ThrowingCallable serialization = () -> commonGitFileUtils.createGitResourceMap(applicationJson);

        // Then
        assertThatThrownBy(serialization)
                .isInstanceOf(AppsmithException.class)
                .hasMessage(AppsmithError.GIT_FILE_SYSTEM_ERROR.getMessage(
                        "Action context name is not a valid Git file path segment"));
    }

    @ParameterizedTest
    @MethodSource("namesThatAreNotSinglePathSegments")
    @DisplayName("GHSA-x4j8-9c4j-73r7")
    void should_rejectSerialization_when_actionCollectionContextNameIsNotSinglePathSegment(String contextName) {
        // Given
        ApplicationJson applicationJson = new ApplicationJson();
        applicationJson.setActionCollectionList(new ArrayList<>(List.of(actionCollectionInContext(contextName))));

        // When
        ThrowingCallable serialization = () -> commonGitFileUtils.createGitResourceMap(applicationJson);

        // Then
        assertThatThrownBy(serialization)
                .isInstanceOf(AppsmithException.class)
                .hasMessage(AppsmithError.GIT_FILE_SYSTEM_ERROR.getMessage(
                        "ActionCollection context name is not a valid Git file path segment"));
    }

    @ParameterizedTest
    @NullSource
    @ValueSource(strings = {" "})
    void should_notRejectSerialization_when_contextNameIsNullOrWhitespace(String contextName) {
        // Given
        ApplicationJson applicationJson = new ApplicationJson();
        applicationJson.setActionList(new ArrayList<>(List.of(actionInContext(contextName))));
        applicationJson.setActionCollectionList(new ArrayList<>(List.of(actionCollectionInContext(contextName))));

        // When
        ThrowingCallable serialization = () -> commonGitFileUtils.createGitResourceMap(applicationJson);

        // Then
        assertThatCode(serialization).doesNotThrowAnyException();
    }

    @Test
    void should_serializeActionsUnderContextName_when_contextNameIsSinglePathSegment() {
        // Given
        String contextName = "Sales.2024 Übersicht";
        ApplicationJson applicationJson = new ApplicationJson();
        applicationJson.setActionList(new ArrayList<>(List.of(actionInContext(contextName))));
        applicationJson.setActionCollectionList(new ArrayList<>(List.of(actionCollectionInContext(contextName))));

        // When
        GitResourceMap gitResourceMap = commonGitFileUtils.createGitResourceMap(applicationJson);

        // Then
        assertThat(gitResourceMap.getGitResourceMap().keySet())
                .filteredOn(identity -> GitResourceType.QUERY_CONFIG.equals(identity.getResourceType())
                        || GitResourceType.JSOBJECT_CONFIG.equals(identity.getResourceType()))
                .extracting(GitResourceIdentity::getFilePath)
                .containsExactlyInAnyOrder(
                        "pages/" + contextName + "/queries/Query1/metadata.json",
                        "pages/" + contextName + "/jsobjects/JSObject1/metadata.json");
    }

    private static NewAction actionInContext(String contextName) {
        ActionDTO actionDTO = new ActionDTO();
        actionDTO.setName("Query1");
        actionDTO.setPageId(contextName);

        NewAction newAction = new NewAction();
        newAction.setGitSyncId("application_action");
        newAction.setPluginType(PluginType.DB);
        newAction.setUnpublishedAction(actionDTO);
        return newAction;
    }

    private static ActionCollection actionCollectionInContext(String contextName) {
        ActionCollectionDTO collectionDTO = new ActionCollectionDTO();
        collectionDTO.setName("JSObject1");
        collectionDTO.setPageId(contextName);

        ActionCollection actionCollection = new ActionCollection();
        actionCollection.setGitSyncId("application_collection");
        actionCollection.setUnpublishedCollection(collectionDTO);
        return actionCollection;
    }
}
