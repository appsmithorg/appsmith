package com.appsmith.server.git;

import com.appsmith.external.converters.ISOStringToInstantConverter;
import com.appsmith.external.dtos.ModifiedResources;
import com.appsmith.external.git.GitExecutor;
import com.appsmith.external.models.ApplicationGitReference;
import com.appsmith.server.constants.SerialiseArtifactObjective;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ApplicationImportDTO;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.exports.internal.ExportService;
import com.appsmith.server.helpers.CommonGitFileUtils;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.imports.internal.ImportService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.testhelpers.git.GitFileSystemTestHelper;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.diff.DiffEntry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.mongo.AutoConfigureDataMongo;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.core.io.buffer.DefaultDataBufferFactory;
import org.springframework.http.MediaType;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.io.IOException;
import java.net.URISyntaxException;
import java.net.URL;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.List;

import static com.appsmith.server.constants.ArtifactType.APPLICATION;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;

/**
 * This class tests the enforcement of server schema migrations within the Appsmith platform.
 * It ensures that any changes to the domain models or their serialization that could affect
 * git-connected applications are detected. The test fails by design when such changes are detected,
 * prompting developers to take corrective actions to maintain schema compatibility.
 */
/**
 * The purpose of this test file is to detect if code in Appsmith has changed in a way which would reflect
 * as uncommitted changes in git-connected applications.
 * This test case would fail if we have added new domains, changed the underlying structure of the domains,
 * or how it's represented in domains.
 * It is intentionally kept to fail so that developers could identify if their code has brought about these changes.
 *
 * In order to make the test case pass, we would need to add the following steps:
 *
 *  1.  Once the test starts failing, that would mean that we need to increment the serverSchemaVersion
 *      which is a constant in JsonSchemaVersions.java by 1 count.
 *      After that, an increment logic addition would be required change in JsonSchemaMigrations to
 *      update the version number for incoming imports.
 *
 *  This is important so that the server code could detect that an auto-commit is
 *  required for git-connected applications for a seamless experience.
 *  2.  After step 1, this test case would still fail.
 *      In order to make the test case work again, please replace the respective JSON with the updated application JSON.
 *      Please take note that the Serialisation Objective should be VERSION_CONTROL.
 *      In order to retrieve the updated JSON, one could simply copy the serialized files from the test case itself.
 */
@Slf4j
@AutoConfigureDataMongo
@SpringBootTest
@DirtiesContext
public class ServerSchemaMigrationEnforcerTest {

    @Autowired
    WorkspaceService workspaceService;

    @SpyBean
    ImportService importService;

    @Autowired
    ExportService exportService;

    @Autowired
    CommonGitFileUtils commonGitFileUtils;

    @Autowired
    GitFileSystemTestHelper gitFileSystemTestHelper;

    @SpyBean
    GitExecutor gitExecutor;

    @MockBean
    PluginExecutorHelper pluginExecutorHelper;

    private final Gson gson = new GsonBuilder()
            .registerTypeAdapter(Instant.class, new ISOStringToInstantConverter())
            .setPrettyPrinting()
            .create();

    private static final String DEFAULT_APPLICATION_ID = "default-app-id",
            BRANCH_NAME = "develop",
            REPO_NAME = "repoName",
            WORKSPACE_ID = "test-workspace-id";

    public static final String CUSTOM_JS_LIB_LIST = "jsLibraries";
    public static final String EXPORTED_APPLICATION = "application";
    public static final String UNPUBLISHED_CUSTOM_JS_LIBS = "unpublishedCustomJSLibs";
    public static final String PUBLISHED_CUSTOM_JS_LIBS = "publishedCustomJSLibs";

    @BeforeEach
    public void setup() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(any())).thenReturn(Mono.just(new MockPluginExecutor()));
    }

    /**
     * Each entity in the map is a separate file in git file-system, it's imperative that we compare them separately
     * If the comparison fails then it would essentially mean that users would see the diff,
     * hence it should not be ignored
     * @param target
     * @param source
     */
    public void verifyMapAssertions(JsonObject target, JsonObject source) {
        for (String key : source.keySet()) {
            assertThat(convertElementToString(source.get(key))).isEqualTo(convertElementToString(target.get(key)));
        }
    }

    public String convertElementToString(JsonElement element) {
        return gson.toJson(element);
    }

    public void verifyAssertions(
            JsonObject exportedApplicationJsonObject, JsonObject importApplicationGitReferenceObject) {

        assertThat(exportedApplicationJsonObject.get(EXPORTED_APPLICATION).getAsJsonObject())
                .isEqualTo(importApplicationGitReferenceObject
                        .get(EXPORTED_APPLICATION)
                        .getAsJsonObject());

        assertThat(exportedApplicationJsonObject.get("metadata").getAsJsonObject())
                .isEqualTo(importApplicationGitReferenceObject.get("metadata").getAsJsonObject());

        assertThat(exportedApplicationJsonObject.get("theme").getAsJsonObject())
                .isEqualTo(importApplicationGitReferenceObject.get("theme").getAsJsonObject());

        verifyMapAssertions(
                exportedApplicationJsonObject.get("actions").getAsJsonObject(),
                importApplicationGitReferenceObject.get("actions").getAsJsonObject());

        verifyMapAssertions(
                exportedApplicationJsonObject.get("actionBody").getAsJsonObject(),
                importApplicationGitReferenceObject.get("actionBody").getAsJsonObject());

        verifyMapAssertions(
                exportedApplicationJsonObject.get("actionCollections").getAsJsonObject(),
                importApplicationGitReferenceObject.get("actionCollections").getAsJsonObject());

        verifyMapAssertions(
                exportedApplicationJsonObject.get("actionCollectionBody").getAsJsonObject(),
                importApplicationGitReferenceObject.get("actionCollectionBody").getAsJsonObject());

        verifyMapAssertions(
                exportedApplicationJsonObject.get("pages").getAsJsonObject(),
                importApplicationGitReferenceObject.get("pages").getAsJsonObject());

        verifyMapAssertions(
                exportedApplicationJsonObject.get("pageDsl").getAsJsonObject(),
                importApplicationGitReferenceObject.get("pageDsl").getAsJsonObject());

        verifyMapAssertions(
                exportedApplicationJsonObject.get("datasources").getAsJsonObject(),
                importApplicationGitReferenceObject.get("datasources").getAsJsonObject());
    }

    @Test
    @Disabled
    @WithUserDetails(value = "api_user")
    public void importApplication_ThenExportApplication_MatchJson_equals_Success() throws URISyntaxException {
        String filePath = "ce-automation-test.json";
        FilePart filePart = createFilePart(filePath);
        Workspace newWorkspace = new Workspace();
        newWorkspace.setName("Template Workspace");
        Mono<Workspace> workspaceMono = workspaceService.create(newWorkspace).cache();

        ApplicationJson applicationJsonToBeImported = importService
                .extractArtifactExchangeJson(filePart)
                .map(artifactExchangeJson -> (ApplicationJson) artifactExchangeJson)
                .block();

        applicationJsonToBeImported.setModifiedResources(null);
        ApplicationGitReference importApplicationGitReference =
                (ApplicationGitReference) commonGitFileUtils.createArtifactReference(applicationJsonToBeImported);

        JsonObject importApplicationGitReferenceObject = gson.toJsonTree(
                        importApplicationGitReference, ApplicationGitReference.class)
                .getAsJsonObject();
        removeCustomJsLibsEntries(importApplicationGitReferenceObject);

        final Mono<ApplicationImportDTO> resultMono = workspaceMono
                .flatMap(workspace ->
                        importService.extractArtifactExchangeJsonAndSaveArtifact(filePart, workspace.getId(), null))
                .map(importableArtifactDTO -> (ApplicationImportDTO) importableArtifactDTO);

        final Mono<ApplicationJson> exportApplicationMono = resultMono.flatMap(applicationImportDTO -> {
            return exportService
                    .exportByArtifactId(
                            applicationImportDTO.getApplication().getId(),
                            SerialiseArtifactObjective.VERSION_CONTROL,
                            APPLICATION)
                    .map(artifactExchangeJson -> (ApplicationJson) artifactExchangeJson);
        });

        // The logic over here is that we are comparing the imported json and exported json,
        // if exported changes has diff from the imported one
        StepVerifier.create(exportApplicationMono)
                .assertNext(exportedApplicationJson -> {
                    assertThat(exportedApplicationJson).isNotNull();
                    exportedApplicationJson.setModifiedResources(null);

                    ApplicationGitReference exportedApplicationGitReference = (ApplicationGitReference)
                            commonGitFileUtils.createArtifactReference(exportedApplicationJson);

                    JsonObject exportedApplicationGitReferenceObject = gson.toJsonTree(
                                    exportedApplicationGitReference, ApplicationGitReference.class)
                            .getAsJsonObject();
                    removeCustomJsLibsEntries(exportedApplicationGitReferenceObject);
                    verifyAssertions(exportedApplicationGitReferenceObject, importApplicationGitReferenceObject);
                })
                .verifyComplete();
    }

    private FilePart createFilePart(String filePath) throws URISyntaxException {
        FilePart filePart = Mockito.mock(FilePart.class, Mockito.RETURNS_DEEP_STUBS);
        URL resource = this.getClass().getResource(filePath);
        Flux<DataBuffer> dataBufferFlux = DataBufferUtils.read(
                        Path.of(resource.toURI()), new DefaultDataBufferFactory(), 4096)
                .cache();

        Mockito.when(filePart.content()).thenReturn(dataBufferFlux);
        Mockito.when(filePart.headers().getContentType()).thenReturn(MediaType.APPLICATION_JSON);

        return filePart;
    }

    private void removeCustomJsLibsEntries(JsonObject applicationObjectNode) {
        // Remove customJsLib entry from json
        if (applicationObjectNode.has(CUSTOM_JS_LIB_LIST)) {
            applicationObjectNode.remove(CUSTOM_JS_LIB_LIST);
        }

        // Remove customJsLibList entries from exported Json
        if (applicationObjectNode.has(EXPORTED_APPLICATION)) {
            JsonObject exportedApplicationNode =
                    applicationObjectNode.get(EXPORTED_APPLICATION).getAsJsonObject();
            if (exportedApplicationNode.has(PUBLISHED_CUSTOM_JS_LIBS)) {
                exportedApplicationNode.remove(PUBLISHED_CUSTOM_JS_LIBS);
            }

            if (exportedApplicationNode.has(UNPUBLISHED_CUSTOM_JS_LIBS)) {
                exportedApplicationNode.remove(UNPUBLISHED_CUSTOM_JS_LIBS);
            }
        }
    }

    @Test
    public void savedFile_reSavedWithSameSerialisationLogic_noDiffOccurs()
            throws URISyntaxException, IOException, GitAPIException {

        ApplicationJson applicationJson =
                gitFileSystemTestHelper.getApplicationJson(this.getClass().getResource("ce-automation-test.json"));

        ModifiedResources modifiedResources = new ModifiedResources();
        modifiedResources.setAllModified(true);
        applicationJson.setModifiedResources(modifiedResources);

        gitFileSystemTestHelper.setupGitRepository(
                WORKSPACE_ID, DEFAULT_APPLICATION_ID, BRANCH_NAME, REPO_NAME, applicationJson);

        Path suffixPath = Paths.get(WORKSPACE_ID, DEFAULT_APPLICATION_ID, REPO_NAME);
        Path gitCompletePath = gitExecutor.createRepoPath(suffixPath);

        commonGitFileUtils
                .saveArtifactToLocalRepo(suffixPath, applicationJson, BRANCH_NAME)
                .block();

        try (Git gitRepo = Git.open(gitCompletePath.toFile())) {
            List<DiffEntry> diffEntries = gitRepo.diff().call();
            assertThat(diffEntries.size()).isZero();
        }
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void saveGitRepo_ImportAndThenExport_diffOccurs() throws URISyntaxException, IOException, GitAPIException {
        ApplicationJson applicationJson =
                gitFileSystemTestHelper.getApplicationJson(this.getClass().getResource("ce-automation-test.json"));

        ModifiedResources modifiedResources = new ModifiedResources();
        modifiedResources.setAllModified(true);
        applicationJson.setModifiedResources(modifiedResources);

        gitFileSystemTestHelper.setupGitRepository(
                WORKSPACE_ID, DEFAULT_APPLICATION_ID, BRANCH_NAME, REPO_NAME, applicationJson);

        ApplicationJson jsonToBeImported = commonGitFileUtils
                .reconstructArtifactExchangeJsonFromGitRepo(
                        WORKSPACE_ID, DEFAULT_APPLICATION_ID, REPO_NAME, BRANCH_NAME, APPLICATION)
                .map(artifactExchangeJson -> (ApplicationJson) artifactExchangeJson)
                .block();

        Workspace newWorkspace = new Workspace();
        newWorkspace.setName("Template Workspace1");
        Workspace workspace = workspaceService.create(newWorkspace).block();

        ApplicationJson exportedJson = importService
                .importNewArtifactInWorkspaceFromJson(workspace.getId(), jsonToBeImported)
                .flatMap(artifactExchangeJson -> {
                    return exportService
                            .exportByArtifactId(
                                    artifactExchangeJson.getId(),
                                    SerialiseArtifactObjective.VERSION_CONTROL,
                                    APPLICATION)
                            .map(exportArtifactJson -> {
                                ApplicationJson applicationJson1 = (ApplicationJson) exportArtifactJson;
                                applicationJson1.setModifiedResources(modifiedResources);
                                return applicationJson1;
                            });
                })
                .block();

        Path suffixPath = Paths.get(WORKSPACE_ID, DEFAULT_APPLICATION_ID, REPO_NAME);
        Path gitCompletePath = gitExecutor.createRepoPath(suffixPath);

        // save back to the repository in order to compare the diff.
        commonGitFileUtils
                .saveArtifactToLocalRepo(suffixPath, exportedJson, BRANCH_NAME)
                .block();

        try (Git gitRepo = Git.open(gitCompletePath.toFile())) {
            List<DiffEntry> diffEntries = gitRepo.diff().call();
            assertThat(diffEntries.size()).isNotZero();
            for (DiffEntry diffEntry : diffEntries) {
                // assertion that no new file has been created
                assertThat(diffEntry.getOldPath()).isEqualTo(diffEntry.getNewPath());
            }
        }
    }
}
