package com.appsmith.server.transactions;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.external.models.PluginType;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.extensions.AfterAllCleanUpExtension;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.imports.importable.ImportableService;
import com.appsmith.server.imports.internal.ImportService;
import com.appsmith.server.migrations.ApplicationVersion;
import com.appsmith.server.migrations.JsonSchemaMigration;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.repositories.cakes.ActionCollectionRepositoryCake;
import com.appsmith.server.repositories.cakes.ApplicationRepositoryCake;
import com.appsmith.server.repositories.cakes.NewActionRepositoryCake;
import com.appsmith.server.repositories.cakes.NewPageRepositoryCake;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.WorkspaceService;
import com.google.gson.Gson;
import jakarta.transaction.TransactionalException;
import org.junit.jupiter.api.BeforeEach;
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
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;

// All the test case are for failure or exception. Test cases for valid json file is already present in
// ImportExportApplicationServiceTest class

@SpringBootTest
@ExtendWith(AfterAllCleanUpExtension.class)
public class ImportApplicationTransactionServiceTest {

    @Autowired
    ImportService importService;

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    ApplicationRepositoryCake applicationRepository;

    @Autowired
    NewActionService newActionService;

    @Autowired
    NewActionRepositoryCake newActionRepository;

    @Autowired
    NewPageRepositoryCake newPageRepository;

    @Autowired
    ActionCollectionService actionCollectionService;

    @Autowired
    ActionCollectionRepositoryCake actionCollectionRepository;

    @MockBean
    PluginExecutorHelper pluginExecutorHelper;

    @MockBean
    ImportableService<NewAction> newActionImportableService;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    private Gson gson;

    @Autowired
    JsonSchemaMigration jsonSchemaMigration;

    Long applicationCount = 0L, pageCount = 0L, actionCount = 0L, actionCollectionCount = 0L;
    private ApplicationJson applicationJson = new ApplicationJson();

    @BeforeEach
    public void setup() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(any())).thenReturn(Mono.just(new MockPluginExecutor()));

        applicationJson = createAppJson("test_assets/ImportExportServiceTest/valid-application.json")
                .block();

        applicationCount = applicationRepository.count().block();
        pageCount = newPageRepository.count().block();
        actionCount = newActionRepository.count().block();
        actionCollectionCount = actionCollectionRepository.count().block();
    }

    private FilePart createFilePart(String filePath) {
        FilePart filepart = Mockito.mock(FilePart.class, Mockito.RETURNS_DEEP_STUBS);
        Flux<DataBuffer> dataBufferFlux = DataBufferUtils.read(
                        new ClassPathResource(filePath), new DefaultDataBufferFactory(), 4096)
                .cache();

        Mockito.when(filepart.content()).thenReturn(dataBufferFlux);
        Mockito.when(filepart.headers().getContentType()).thenReturn(MediaType.APPLICATION_JSON);

        return filepart;
    }

    private Mono<ApplicationJson> createAppJson(String filePath) {
        FilePart filePart = createFilePart(filePath);

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
                .flatMap(applicationJson ->
                        jsonSchemaMigration.migrateArtifactExchangeJsonToLatestSchema(applicationJson, null, null))
                .map(artifactExchangeJson -> (ApplicationJson) artifactExchangeJson);
    }

    private ApplicationJson createApplicationJSON(List<String> pageNames) {
        ApplicationJson applicationJson = new ApplicationJson();

        // set the application data
        Application application = new Application();
        application.setName("Template Application");
        application.setSlug("template-application");
        application.setForkingEnabled(true);
        application.setIsPublic(true);
        application.setApplicationVersion(ApplicationVersion.LATEST_VERSION);
        applicationJson.setExportedApplication(application);

        DatasourceStorage sampleDatasource = new DatasourceStorage();
        sampleDatasource.setName("SampleDS");
        sampleDatasource.setPluginId("restapi-plugin");

        applicationJson.setDatasourceList(List.of(sampleDatasource));

        // add pages and actions
        List<NewPage> newPageList = new ArrayList<>(pageNames.size());
        List<NewAction> actionList = new ArrayList<>();
        List<ActionCollection> actionCollectionList = new ArrayList<>();

        for (String pageName : pageNames) {
            NewPage newPage = new NewPage();
            newPage.setUnpublishedPage(new PageDTO());
            newPage.getUnpublishedPage().setName(pageName);
            newPage.getUnpublishedPage().setLayouts(List.of());
            newPageList.add(newPage);

            NewAction action = new NewAction();
            action.setId(pageName + "_SampleQuery");
            action.setPluginType(PluginType.API);
            action.setPluginId("restapi-plugin");
            action.setUnpublishedAction(new ActionDTO());
            action.getUnpublishedAction().setName("SampleQuery");
            action.getUnpublishedAction().setPageId(pageName);
            action.getUnpublishedAction().setDatasource(new Datasource());
            action.getUnpublishedAction().getDatasource().setId("SampleDS");
            action.getUnpublishedAction().getDatasource().setPluginId("restapi-plugin");
            actionList.add(action);

            ActionCollection actionCollection = new ActionCollection();
            actionCollection.setId(pageName + "_SampleJS");
            actionCollection.setUnpublishedCollection(new ActionCollectionDTO());
            actionCollection.getUnpublishedCollection().setName("SampleJS");
            actionCollection.getUnpublishedCollection().setPageId(pageName);
            actionCollection.getUnpublishedCollection().setPluginId("js-plugin");
            actionCollection.getUnpublishedCollection().setPluginType(PluginType.JS);
            actionCollection.getUnpublishedCollection().setBody("export default {\\n\\t\\n}");
            actionCollectionList.add(actionCollection);
        }

        applicationJson.setPageList(newPageList);
        applicationJson.setActionList(actionList);
        applicationJson.setActionCollectionList(actionCollectionList);
        return applicationJson;
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void importIntoExistingApp_exceptionDuringImport_removedEntitiesRestored() {
        // Create a git connected application
        String uniqueString = UUID.randomUUID().toString();

        Workspace newWorkspace = new Workspace();
        newWorkspace.setName("Template Test");
        Workspace createdWorkspace = workspaceService.create(newWorkspace).block();

        Application destApplication = new Application();
        destApplication.setName("App_" + uniqueString);
        destApplication.setSlug("my-slug");
        destApplication.setIsPublic(false);
        destApplication.setForkingEnabled(false);
        Mono<Application> createAppAndPageMono = applicationPageService
                .createApplication(destApplication, createdWorkspace.getId())
                .flatMap(application -> {
                    PageDTO pageDTO = new PageDTO();
                    pageDTO.setName("Home");
                    pageDTO.setApplicationId(application.getId());
                    return applicationPageService.createPage(pageDTO).thenReturn(application);
                });

        Application application = createAppAndPageMono.block();

        // let's create an ApplicationJSON which we'll merge with application created by createAppAndPageMono.
        // The page names are different, hence the old ones are removed during the import
        ApplicationJson applicationJson = createApplicationJSON(List.of("Test1", "Test2"));

        Mockito.when(newActionImportableService.importEntities(any(), any(), any(), any(), any()))
                .thenReturn(Mono.error(new AppsmithException(AppsmithError.GENERIC_BAD_REQUEST)));

        Mono<Application> resultMono = importService
                .importNewArtifactInWorkspaceFromJson(createdWorkspace.getId(), applicationJson)
                .map(importableArtifact -> (Application) importableArtifact);

        // Verify for the failure state
        StepVerifier.create(resultMono)
                .expectErrorMatches(error -> error instanceof AppsmithException
                        && error.getMessage()
                                .contains(AppsmithError.GENERIC_JSON_IMPORT_ERROR.getMessage(
                                        createdWorkspace.getId(), "")))
                .verify();

        // Verify the db state after the import failed
        Application dbApp = applicationRepository.findById(application.getId()).block();

        assertThat(dbApp).isNotNull();
        assertThat(dbApp.getPages().size()).isEqualTo(2);
        for (ApplicationPage page : dbApp.getPages()) {
            NewPage newPage = newPageRepository.findById(page.getId()).block();
            assertThat(newPage).isNotNull();
            assertThat(newPage.getUnpublishedPage().getName()).isIn("Home", "Page1");
        }
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void importIntoExistingApplication_exceptionDuringImport_dataRestoredBack() {
        // Create a git connected application
        String uniqueString = UUID.randomUUID().toString();

        Workspace newWorkspace = new Workspace();
        newWorkspace.setName("Template");
        Workspace createdWorkspace = workspaceService.create(newWorkspace).block();

        Application destApplication = new Application();
        destApplication.setName("App_" + uniqueString);
        destApplication.setSlug("my-slug");
        destApplication.setIsPublic(false);
        destApplication.setForkingEnabled(false);
        Mono<Application> createAppAndPageMono = applicationPageService
                .createApplication(destApplication, createdWorkspace.getId())
                .flatMap(application -> {
                    PageDTO pageDTO = new PageDTO();
                    pageDTO.setName("Home");
                    pageDTO.setApplicationId(application.getId());
                    return applicationPageService.createPage(pageDTO).thenReturn(application);
                });

        Application application = createAppAndPageMono.block();

        // let's create an ApplicationJSON which we'll merge with application created by createAppAndPageMono
        ApplicationJson applicationJson = createApplicationJSON(List.of("Home", "About"));

        Mockito.when(newActionImportableService.importEntities(any(), any(), any(), any(), any()))
                .thenReturn(Mono.error(new AppsmithException(AppsmithError.GENERIC_BAD_REQUEST)));

        Mono<Application> resultMono = importService
                .importNewArtifactInWorkspaceFromJson(createdWorkspace.getId(), applicationJson)
                .map(importableArtifact -> (Application) importableArtifact);

        // Verify for the failure state
        StepVerifier.create(resultMono)
                .expectErrorMatches(error -> error instanceof AppsmithException
                        && error.getMessage()
                                .contains(AppsmithError.GENERIC_JSON_IMPORT_ERROR.getMessage(
                                        createdWorkspace.getId(), "")))
                .verify();

        // Verify the db state after the import failed
        Application dbApp = applicationRepository.findById(application.getId()).block();

        assertThat(dbApp).isNotNull();
        assertThat(dbApp.getPages().size()).isEqualTo(2);
        for (ApplicationPage page : dbApp.getPages()) {
            NewPage newPage = newPageRepository.findById(page.getId()).block();
            assertThat(newPage).isNotNull();
            assertThat(newPage.getUnpublishedPage().getName()).isIn("Home", "Page1");
        }
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void importApplication_exceptionDuringImportActions_savedPagesAndApplicationReverted() {

        Workspace newWorkspace = new Workspace();
        newWorkspace.setName("Template Workspace");

        Mockito.when(newActionImportableService.importEntities(any(), any(), any(), any(), any()))
                .thenReturn(Mono.error(new AppsmithException(AppsmithError.GENERIC_BAD_REQUEST)));

        Workspace createdWorkspace = workspaceService.create(newWorkspace).block();

        Mono<Application> resultMono = importService
                .importNewArtifactInWorkspaceFromJson(createdWorkspace.getId(), applicationJson)
                .map(importableArtifact -> (Application) importableArtifact);

        // Check  if expected exception is thrown
        StepVerifier.create(resultMono)
                .expectErrorMatches(error -> error instanceof AppsmithException
                        && error.getMessage()
                                .contains(AppsmithError.GENERIC_JSON_IMPORT_ERROR.getMessage(
                                        createdWorkspace.getId(), "")))
                .verify();

        // After the import application failed in the middle of execution after the application and pages are saved to
        // DB
        // check if the saved pages reverted after the exception
        assertThat(applicationRepository.count().block()).isEqualTo(applicationCount);
        assertThat(newPageRepository.count().block()).isEqualTo(pageCount);
        assertThat(newActionRepository.count().block()).isEqualTo(actionCount);
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void importApplication_transactionExceptionDuringListActionSave_omitTransactionMessagePart() {

        Workspace newWorkspace = new Workspace();
        newWorkspace.setName("Template Workspace");

        Mockito.when(newActionImportableService.importEntities(any(), any(), any(), any(), any()))
                .thenReturn(Mono.error(new TransactionalException(
                        "Command failed with error 251 (NoSuchTransaction): 'Transaction 1 has been aborted.'", null)));

        Workspace createdWorkspace = workspaceService.create(newWorkspace).block();

        Mono<Application> resultMono = importService
                .importNewArtifactInWorkspaceFromJson(createdWorkspace.getId(), applicationJson)
                .map(importableArtifact -> (Application) importableArtifact);

        String errorMessage = AppsmithError.GENERIC_JSON_IMPORT_ERROR.getMessage(
                createdWorkspace.getId(),
                "Error: Command failed with error 251 (NoSuchTransaction): 'Transaction 1 has been aborted.'");

        // Check  if expected exception is thrown
        StepVerifier.create(resultMono)
                .expectErrorMatches(error ->
                        error instanceof AppsmithException && error.getMessage().equals(errorMessage))
                .verify();
    }
}
