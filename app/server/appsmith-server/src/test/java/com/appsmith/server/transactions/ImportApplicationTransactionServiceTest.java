package com.appsmith.server.transactions;

import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.extensions.AfterAllCleanUpExtension;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.imports.importable.ImportableService;
import com.appsmith.server.imports.internal.ImportService;
import com.appsmith.server.migrations.JsonSchemaMigration;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.repositories.cakes.ActionCollectionRepositoryCake;
import com.appsmith.server.repositories.cakes.ApplicationRepositoryCake;
import com.appsmith.server.repositories.cakes.NewActionRepositoryCake;
import com.appsmith.server.repositories.cakes.NewPageRepositoryCake;
import com.appsmith.server.services.WorkspaceService;
import com.google.gson.Gson;
import jakarta.transaction.TransactionalException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.mongo.AutoConfigureDataMongo;
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
import org.springframework.test.context.TestPropertySource;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;

// All the test case are for failure or exception. Test cases for valid json file is already present in
// ImportExportApplicationServiceTest class

@ExtendWith(AfterAllCleanUpExtension.class)
@AutoConfigureDataMongo
@SpringBootTest
@TestPropertySource(properties = "property=C")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_CLASS)
@Disabled
public class ImportApplicationTransactionServiceTest {

    @Autowired
    ImportService importService;

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    ApplicationRepositoryCake applicationRepository;

    @MockBean
    NewActionService newActionService;

    @Autowired
    NewActionRepositoryCake newActionRepository;

    @Autowired
    NewPageRepositoryCake newPageRepository;

    @MockBean
    ActionCollectionService actionCollectionService;

    @Autowired
    ActionCollectionRepositoryCake actionCollectionRepository;

    @MockBean
    PluginExecutorHelper pluginExecutorHelper;

    @MockBean
    ImportableService<NewAction> newActionImportableService;

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
                .map(jsonSchemaMigration::migrateArtifactToLatestSchema)
                .map(artifactExchangeJson -> (ApplicationJson) artifactExchangeJson);
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

        // Check  if expected exception is thrown
        StepVerifier.create(resultMono)
                .expectErrorMatches(error -> error instanceof AppsmithException
                        && error.getMessage()
                                .equals(AppsmithError.GENERIC_JSON_IMPORT_ERROR.getMessage(
                                        createdWorkspace.getId(), "")))
                .verify();
    }
}
