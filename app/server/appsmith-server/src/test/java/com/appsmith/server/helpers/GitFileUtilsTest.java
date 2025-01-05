package com.appsmith.server.helpers;

import com.appsmith.external.git.FileInterface;
import com.appsmith.external.models.ApplicationGitReference;
import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.extensions.AfterAllCleanUpExtension;
import com.appsmith.server.migrations.JsonSchemaMigration;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.SessionUserService;
import com.google.gson.Gson;
import lombok.SneakyThrows;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.core.io.ClassPathResource;
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

import java.nio.file.Path;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static com.appsmith.external.git.constants.GitConstants.NAME_SEPARATOR;
import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith({AfterAllCleanUpExtension.class})
@SpringBootTest
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_CLASS)
public class GitFileUtilsTest {
    private static final Path localRepoPath = Path.of("localRepoPath");
    private static final String filePath = "test_assets/ImportExportServiceTest/valid-application.json";

    @MockBean
    FileInterface fileInterface;

    @Autowired
    CommonGitFileUtils commonGitFileUtils;

    @Autowired
    AnalyticsService analyticsService;

    @Autowired
    SessionUserService userService;

    @Autowired
    Gson gson;

    @Autowired
    JsonSchemaMigration jsonSchemaMigration;

    private Mono<ApplicationJson> createAppJson(String filePath) {
        FilePart filePart = Mockito.mock(FilePart.class, Mockito.RETURNS_DEEP_STUBS);
        Flux<DataBuffer> dataBufferFlux = DataBufferUtils.read(
                        new ClassPathResource(filePath), new DefaultDataBufferFactory(), 4096)
                .cache();

        Mockito.when(filePart.content()).thenReturn(dataBufferFlux);
        Mockito.when(filePart.headers().getContentType()).thenReturn(MediaType.APPLICATION_JSON);

        Mono<String> stringifiedFile = DataBufferUtils.join(filePart.content()).map(dataBuffer -> {
            byte[] data = new byte[dataBuffer.readableByteCount()];
            dataBuffer.read(data);
            DataBufferUtils.release(dataBuffer);
            return new String(data);
        });

        return stringifiedFile
                .map(data -> {
                    return gson.fromJson(data, ApplicationJson.class);
                })
                .flatMap(applicationJson -> jsonSchemaMigration.migrateArtifactExchangeJsonToLatestSchema(
                        applicationJson, null, null, null))
                .map(artifactExchangeJson -> (ApplicationJson) artifactExchangeJson);
    }

    @Test
    public void getSerializableResource_allEntitiesArePresentForApplication_keysIncludesSeparator() {
        ApplicationJson validAppJson = createAppJson(filePath).block();
        ApplicationGitReference applicationGitReference =
                (ApplicationGitReference) commonGitFileUtils.createArtifactReference(validAppJson);

        List<String> pageNames = validAppJson.getPageList().stream()
                .map(newPage -> newPage.getUnpublishedPage().getName())
                .collect(Collectors.toList());

        List<String> actionNames = validAppJson.getActionList().stream()
                .map(newAction ->
                        newAction.getUnpublishedAction().getValidName().replace(".", "-"))
                .collect(Collectors.toList());

        List<String> collectionNames = validAppJson.getActionCollectionList().stream()
                .map(actionCollection ->
                        actionCollection.getUnpublishedCollection().getName())
                .collect(Collectors.toList());

        Map<String, Object> actions = applicationGitReference.getActions();
        for (Map.Entry<String, Object> entry : actions.entrySet()) {
            assertThat(entry.getKey()).contains(NAME_SEPARATOR);
            String[] names = entry.getKey().split(NAME_SEPARATOR);
            final String queryName = names[0].replace(".", "-");
            final String pageName = names[1];
            assertThat(actionNames).contains(queryName);
            assertThat(pageNames).contains(pageName);
        }

        Map<String, Object> actionsCollections = applicationGitReference.getActionCollections();
        for (Map.Entry<String, Object> entry : actionsCollections.entrySet()) {
            assertThat(entry.getKey()).contains(NAME_SEPARATOR);
            String[] names = entry.getKey().split(NAME_SEPARATOR);
            final String collectionName = names[0].replace(".", "-");
            final String pageName = names[1];
            assertThat(collectionNames).contains(collectionName);
            assertThat(pageNames).contains(pageName);
        }

        Map<String, Object> pages = applicationGitReference.getPages();
        for (Map.Entry<String, Object> entry : pages.entrySet()) {
            assertThat(entry.getKey()).doesNotContain(NAME_SEPARATOR);
        }
    }

    @Test
    public void getSerializableResource_withDeletedEntities_excludeDeletedEntities() {
        ApplicationJson validAppJson = createAppJson(filePath).block();

        NewPage deletedPage =
                validAppJson.getPageList().get(validAppJson.getPageList().size() - 1);
        deletedPage.getUnpublishedPage().setDeletedAt(Instant.now());

        NewAction deletedAction =
                validAppJson.getActionList().get(validAppJson.getActionList().size() - 1);
        deletedAction.getUnpublishedAction().setDeletedAt(Instant.now());

        ActionCollection deletedCollection = validAppJson
                .getActionCollectionList()
                .get(validAppJson.getActionCollectionList().size() - 1);
        deletedCollection.getUnpublishedCollection().setDeletedAt(Instant.now());

        ApplicationGitReference applicationGitReference =
                (ApplicationGitReference) commonGitFileUtils.createArtifactReference(validAppJson);

        Map<String, Object> actions = applicationGitReference.getActions();
        for (Map.Entry<String, Object> entry : actions.entrySet()) {
            String[] names = entry.getKey().split(NAME_SEPARATOR);
            final String queryName = names[0].replace(".", "-");
            assertThat(queryName).isNotEmpty();
            assertThat(deletedAction.getUnpublishedAction().getValidName().replace(".", "-"))
                    .isNotEqualTo(queryName);
        }

        Map<String, Object> actionsCollections = applicationGitReference.getActionCollections();
        for (Map.Entry<String, Object> entry : actionsCollections.entrySet()) {
            String[] names = entry.getKey().split(NAME_SEPARATOR);
            final String collectionName = names[0].replace(".", "-");
            assertThat(collectionName).isNotEmpty();
            assertThat(deletedCollection.getUnpublishedCollection().getName()).isNotEqualTo(collectionName);
        }

        Map<String, Object> pages = applicationGitReference.getPages();
        for (Map.Entry<String, Object> entry : pages.entrySet()) {
            assertThat(entry.getKey()).doesNotContain(NAME_SEPARATOR);
            String pageName = entry.getKey();
            assertThat(pageName).isNotEmpty();
            assertThat(deletedPage.getUnpublishedPage().getName()).isNotEqualTo(pageName);
        }
    }

    @SneakyThrows
    @Test
    @WithUserDetails(value = "api_user")
    public void saveApplicationToLocalRepo_allResourcesArePresent_removePublishedResources() {
        ApplicationJson validAppJson = createAppJson(filePath).block();

        Mockito.when(fileInterface.saveApplicationToGitRepo(
                        Mockito.any(Path.class), Mockito.any(ApplicationGitReference.class), Mockito.anyString()))
                .thenReturn(Mono.just(Path.of("orgId", "appId", "repoName")));

        Mono<Path> resultMono = commonGitFileUtils.saveArtifactToLocalRepoWithAnalytics(
                Path.of("orgId/appId/repoName"), validAppJson, "gitFileTest");

        StepVerifier.create(resultMono)
                .assertNext(path -> {
                    validAppJson.getPageList().forEach(newPage -> {
                        assertThat(newPage.getUnpublishedPage()).isNotNull();
                        assertThat(newPage.getPublishedPage()).isNull();
                    });
                    validAppJson.getActionList().forEach(newAction -> {
                        assertThat(newAction.getUnpublishedAction()).isNotNull();
                        assertThat(newAction.getPublishedAction()).isNull();
                    });
                    validAppJson.getActionCollectionList().forEach(actionCollection -> {
                        assertThat(actionCollection.getUnpublishedCollection()).isNotNull();
                        assertThat(actionCollection.getPublishedCollection()).isNull();
                    });
                })
                .verifyComplete();
    }

    @SneakyThrows
    @Test
    @WithUserDetails(value = "api_user")
    public void reconstructApplicationFromLocalRepo_allResourcesArePresent_getClonedPublishedResources() {
        ApplicationJson applicationJson = createAppJson(filePath).block();
        // Prepare the JSON without published resources
        Map<String, Object> pageRef = new HashMap<>();
        Map<String, Object> actionRef = new HashMap<>();
        Map<String, Object> actionCollectionRef = new HashMap<>();
        applicationJson.getPageList().forEach(newPage -> {
            newPage.setPublishedPage(null);
            pageRef.put(newPage.getUnpublishedPage().getName(), newPage);
        });
        applicationJson.getActionList().forEach(newAction -> {
            newAction.setPublishedAction(null);
            actionRef.put(newAction.getUnpublishedAction().getName(), newAction);
        });
        applicationJson.getActionCollectionList().forEach(actionCollection -> {
            actionCollection.setPublishedCollection(null);
            actionCollectionRef.put(actionCollection.getUnpublishedCollection().getName(), actionCollection);
        });

        ApplicationGitReference applicationReference = new ApplicationGitReference();
        applicationReference.setApplication(applicationJson.getExportedApplication());
        applicationReference.setPages(pageRef);
        applicationReference.setActions(actionRef);
        applicationReference.setActionCollections(actionCollectionRef);

        Mockito.when(fileInterface.reconstructApplicationReferenceFromGitRepo(
                        Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(applicationReference));

        Mono<ApplicationJson> resultMono = commonGitFileUtils
                .reconstructArtifactExchangeJsonFromGitRepoWithAnalytics(
                        "orgId", "appId", "repoName", "branch", ArtifactType.APPLICATION)
                .map(artifactExchangeJson -> (ApplicationJson) artifactExchangeJson)
                .cache();

        StepVerifier.create(resultMono)
                .assertNext(applicationJson1 -> {
                    applicationJson1.getPageList().forEach(newPage -> {
                        assertThat(newPage.getUnpublishedPage()).isNotNull();
                        // Both DTOs will not be equal as we are creating a deep copy for the published version from
                        // unpublished version
                        assertThat(newPage.getPublishedPage()).isNotEqualTo(newPage.getUnpublishedPage());

                        // Check if the published versions are deep copy of the unpublished version and updating any
                        // will not affect the other
                        final String unpublishedName =
                                newPage.getUnpublishedPage().getName();
                        newPage.getUnpublishedPage().setName("updatedName");

                        assertThat(newPage.getPublishedPage().getName()).isEqualTo(unpublishedName);
                        assertThat(newPage.getUnpublishedPage().getName()).isNotEqualTo(unpublishedName);
                    });
                    applicationJson1.getActionList().forEach(newAction -> {
                        assertThat(newAction.getUnpublishedAction()).isNotNull();
                        assertThat(newAction.getPublishedAction()).isNotEqualTo(newAction.getUnpublishedAction());

                        final String unpublishedName =
                                newAction.getUnpublishedAction().getName();
                        newAction.getUnpublishedAction().setName("updatedName");
                        assertThat(newAction.getPublishedAction().getName()).isEqualTo(unpublishedName);
                        assertThat(newAction.getUnpublishedAction().getName()).isNotEqualTo(unpublishedName);
                    });
                    applicationJson1.getActionCollectionList().forEach(actionCollection -> {
                        assertThat(actionCollection.getUnpublishedCollection()).isNotNull();
                        assertThat(actionCollection.getPublishedCollection())
                                .isNotEqualTo(actionCollection.getUnpublishedCollection());

                        final String unpublishedName =
                                actionCollection.getUnpublishedCollection().getName();
                        actionCollection.getUnpublishedCollection().setName("updatedName");
                        assertThat(actionCollection.getPublishedCollection().getName())
                                .isEqualTo(unpublishedName);
                        assertThat(actionCollection.getUnpublishedCollection().getName())
                                .isNotEqualTo(unpublishedName);
                    });
                })
                .verifyComplete();
    }
}
