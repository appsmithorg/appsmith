package com.appsmith.server.applications.git;

import com.appsmith.external.git.models.GitResourceIdentity;
import com.appsmith.external.git.models.GitResourceMap;
import com.appsmith.external.git.models.GitResourceType;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.migrations.JsonSchemaMigration;
import com.fasterxml.jackson.databind.ObjectMapper;
import net.minidev.json.JSONArray;
import net.minidev.json.JSONObject;
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
import java.util.Map;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * A page name becomes a directory name and a file name in the Git repository, so it must be a
 * single path segment when the application is written to the repository and when it is read back.
 */
@ExtendWith(MockitoExtension.class)
class ApplicationGitFileUtilsCEImplTest {

    private static final String INVALID_PAGE_NAME_MESSAGE =
            AppsmithError.GIT_FILE_SYSTEM_ERROR.getMessage("Page name is not a valid Git file path segment");

    @Mock
    private JsonSchemaMigration jsonSchemaMigration;

    private ApplicationGitFileUtilsCEImpl applicationGitFileUtils;

    @BeforeEach
    void setUp() {
        applicationGitFileUtils = new ApplicationGitFileUtilsCEImpl(new ObjectMapper(), jsonSchemaMigration);
    }

    static Stream<String> namesThatAreNotSinglePathSegments() {
        return Stream.of("", ".", "..", "Parent/Child", "Parent\\Child", "Page\u0000One");
    }

    static Stream<String> namesThatAreSinglePathSegments() {
        return Stream.of("Page1", "Sales.2024", "Monthly report", "Übersicht", "v1..v2");
    }

    @ParameterizedTest
    @MethodSource("namesThatAreNotSinglePathSegments")
    @DisplayName("GHSA-x4j8-9c4j-73r7")
    void should_rejectSerialization_when_pageNameIsNotSinglePathSegment(String pageName) {
        // Given
        ApplicationJson applicationJson = applicationJsonWithPage(pageName);
        GitResourceMap gitResourceMap = new GitResourceMap();

        // When
        ThrowingCallable serialization =
                () -> applicationGitFileUtils.setArtifactDependentResources(applicationJson, gitResourceMap);

        // Then
        assertThatThrownBy(serialization).isInstanceOf(AppsmithException.class).hasMessage(INVALID_PAGE_NAME_MESSAGE);
        assertThat(gitResourceMap.getGitResourceMap().keySet())
                .noneMatch(identity -> GitResourceType.CONTEXT_CONFIG.equals(identity.getResourceType()));
    }

    @ParameterizedTest
    @MethodSource("namesThatAreSinglePathSegments")
    void should_serializePageUnderItsName_when_pageNameIsSinglePathSegment(String pageName) {
        // Given
        ApplicationJson applicationJson = applicationJsonWithPage(pageName);
        GitResourceMap gitResourceMap = new GitResourceMap();

        // When
        applicationGitFileUtils.setArtifactDependentResources(applicationJson, gitResourceMap);

        // Then
        assertThat(gitResourceMap.getGitResourceMap().keySet())
                .filteredOn(identity -> GitResourceType.CONTEXT_CONFIG.equals(identity.getResourceType()))
                .extracting(GitResourceIdentity::getFilePath)
                .containsExactly("pages/" + pageName + "/" + pageName + ".json");
    }

    @Test
    @DisplayName("GHSA-x4j8-9c4j-73r7")
    void should_leavePageLayoutUnchanged_when_pageNameIsRejected() {
        // Given
        ApplicationJson applicationJson = applicationJsonWithPage("Parent/Child");
        Layout layout = applicationJson
                .getPageList()
                .get(0)
                .getUnpublishedPage()
                .getLayouts()
                .get(0);
        JSONObject child = new JSONObject();
        child.put("widgetName", "Text1");
        child.put("widgetId", "1");
        JSONArray children = new JSONArray();
        children.add(child);
        layout.getDsl().put("children", children);
        JSONObject layoutBefore = layout.getDsl();

        // When
        ThrowingCallable serialization =
                () -> applicationGitFileUtils.setArtifactDependentResources(applicationJson, new GitResourceMap());

        // Then
        assertThatThrownBy(serialization).isInstanceOf(AppsmithException.class).hasMessage(INVALID_PAGE_NAME_MESSAGE);
        assertThat(layout.getDsl()).isSameAs(layoutBefore);
        assertThat(layout.getDsl()).containsKey("children");
    }

    @ParameterizedTest
    @NullSource
    @ValueSource(strings = {" "})
    void should_notRejectSerialization_when_pageNameIsNullOrWhitespace(String pageName) {
        // Given
        ApplicationJson applicationJson = applicationJsonWithPage(pageName);
        GitResourceMap gitResourceMap = new GitResourceMap();

        // When
        ThrowingCallable serialization =
                () -> applicationGitFileUtils.setArtifactDependentResources(applicationJson, gitResourceMap);

        // Then
        assertThatCode(serialization).doesNotThrowAnyException();
    }

    @ParameterizedTest
    @MethodSource("namesThatAreNotSinglePathSegments")
    @DisplayName("GHSA-x4j8-9c4j-73r7")
    void should_rejectReconstruction_when_pageNameInRepositoryIsNotSinglePathSegment(String pageName) {
        // Given
        GitResourceMap gitResourceMap = repositoryResourcesWithPage(pageName);
        ApplicationJson applicationJson = new ApplicationJson();

        // When
        ThrowingCallable reconstruction =
                () -> applicationGitFileUtils.setArtifactDependentPropertiesInJson(gitResourceMap, applicationJson);

        // Then
        assertThatThrownBy(reconstruction).isInstanceOf(AppsmithException.class).hasMessage(INVALID_PAGE_NAME_MESSAGE);
        assertThat(applicationJson.getPageList()).isNullOrEmpty();
    }

    @ParameterizedTest
    @MethodSource("namesThatAreSinglePathSegments")
    void should_reconstructPage_when_pageNameInRepositoryIsSinglePathSegment(String pageName) {
        // Given
        GitResourceMap gitResourceMap = repositoryResourcesWithPage(pageName);
        ApplicationJson applicationJson = new ApplicationJson();

        // When
        applicationGitFileUtils.setArtifactDependentPropertiesInJson(gitResourceMap, applicationJson);

        // Then
        assertThat(applicationJson.getPageList())
                .extracting(page -> page.getUnpublishedPage().getName())
                .containsExactly(pageName);
    }

    private static ApplicationJson applicationJsonWithPage(String pageName) {
        Layout layout = new Layout();
        layout.setDsl(mainContainer());

        PageDTO pageDTO = new PageDTO();
        pageDTO.setName(pageName);
        pageDTO.setLayouts(new ArrayList<>(List.of(layout)));

        NewPage newPage = new NewPage();
        newPage.setGitSyncId("application_page");
        newPage.setUnpublishedPage(pageDTO);

        ApplicationJson applicationJson = new ApplicationJson();
        applicationJson.setExportedApplication(new Application());
        applicationJson.setPageList(new ArrayList<>(List.of(newPage)));
        return applicationJson;
    }

    private static GitResourceMap repositoryResourcesWithPage(String pageName) {
        GitResourceMap gitResourceMap = new GitResourceMap();
        Map<GitResourceIdentity, Object> resources = gitResourceMap.getGitResourceMap();
        resources.put(
                new GitResourceIdentity(GitResourceType.ROOT_CONFIG, "application.json", "application.json"), Map.of());
        resources.put(new GitResourceIdentity(GitResourceType.ROOT_CONFIG, "metadata.json", "metadata.json"), Map.of());
        resources.put(
                new GitResourceIdentity(GitResourceType.CONTEXT_CONFIG, "application_page", "pages/Page1/Page1.json"),
                Map.of(
                        "gitSyncId",
                        "application_page",
                        "unpublishedPage",
                        Map.of("name", pageName, "layouts", List.of(Map.of("dsl", mainContainer())))));
        return gitResourceMap;
    }

    private static JSONObject mainContainer() {
        JSONObject mainContainer = new JSONObject();
        mainContainer.put("widgetName", "MainContainer");
        mainContainer.put("widgetId", "0");
        return mainContainer;
    }
}
