package com.appsmith.server.transactions;

import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.imports.importable.ImportableService;
import com.appsmith.server.imports.internal.ImportApplicationService;
import com.appsmith.server.migrations.JsonSchemaMigration;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.repositories.ActionCollectionRepository;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.services.WorkspaceService;
import com.google.gson.Gson;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.test.autoconfigure.data.mongo.AutoConfigureDataMongo;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.core.io.buffer.DefaultDataBufferFactory;
import org.springframework.data.mongodb.MongoTransactionException;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
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
import static org.mockito.ArgumentMatchers.anyBoolean;

// All the test case are for failure or exception. Test cases for valid json file is already present in
// ImportExportApplicationServiceTest class

@AutoConfigureDataMongo
@SpringBootTest(properties = "de.flapdoodle.mongodb.embedded.version=5.0.5")
@EnableAutoConfiguration()
@TestPropertySource(properties = "property=C")
@DirtiesContext
public class ImportApplicationTransactionServiceTest {

    @Autowired
    ImportApplicationService importApplicationService;

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    MongoTemplate mongoTemplate;

    @MockBean
    NewActionService newActionService;

    @MockBean
    NewActionRepository newActionRepository;

    @MockBean
    ActionCollectionService actionCollectionService;

    @MockBean
    ActionCollectionRepository actionCollectionRepository;

    @MockBean
    PluginExecutorHelper pluginExecutorHelper;

    @MockBean
    ImportableService<NewAction> newActionImportableService;

    Long applicationCount = 0L, pageCount = 0L, actionCount = 0L, actionCollectionCount = 0L;
    private ApplicationJson applicationJson = new ApplicationJson();

    @BeforeEach
    public void setup() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(any())).thenReturn(Mono.just(new MockPluginExecutor()));

        applicationJson = createAppJson("test_assets/ImportExportServiceTest/valid-application.json")
                .block();
        applicationCount = mongoTemplate.count(new Query(), Application.class);
        pageCount = mongoTemplate.count(new Query(), NewPage.class);
        actionCount = mongoTemplate.count(new Query(), NewAction.class);
        actionCollectionCount = mongoTemplate.count(new Query(), ActionCollection.class);
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
                    Gson gson = new Gson();
                    return gson.fromJson(data, ApplicationJson.class);
                })
                .map(JsonSchemaMigration::migrateApplicationToLatestSchema);
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void importApplication_exceptionDuringImportActions_savedPagesAndApplicationReverted() {

        Workspace newWorkspace = new Workspace();
        newWorkspace.setName("Template Workspace");

        Mockito.when(newActionImportableService.importEntities(any(), any(), any(), any(), any(), anyBoolean()))
                .thenReturn(Mono.error(new AppsmithException(AppsmithError.GENERIC_BAD_REQUEST)));

        Workspace createdWorkspace = workspaceService.create(newWorkspace).block();

        Mono<Application> resultMono = importApplicationService.importNewApplicationInWorkspaceFromJson(
                createdWorkspace.getId(), applicationJson);

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
        assertThat(mongoTemplate.count(new Query(), Application.class)).isEqualTo(applicationCount);
        assertThat(mongoTemplate.count(new Query(), NewPage.class)).isEqualTo(pageCount);
        assertThat(mongoTemplate.count(new Query(), NewAction.class)).isEqualTo(actionCount);
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void importApplication_transactionExceptionDuringListActionSave_omitTransactionMessagePart() {

        Workspace newWorkspace = new Workspace();
        newWorkspace.setName("Template Workspace");

        Mockito.when(newActionImportableService.importEntities(any(), any(), any(), any(), any(), anyBoolean()))
                .thenReturn(Mono.error(new MongoTransactionException(
                        "Command failed with error 251 (NoSuchTransaction): 'Transaction 1 has been aborted.'")));

        Workspace createdWorkspace = workspaceService.create(newWorkspace).block();

        Mono<Application> resultMono = importApplicationService.importNewApplicationInWorkspaceFromJson(
                createdWorkspace.getId(), applicationJson);

        // Check  if expected exception is thrown
        StepVerifier.create(resultMono)
                .expectErrorMatches(error -> error instanceof AppsmithException
                        && error.getMessage()
                                .equals(AppsmithError.GENERIC_JSON_IMPORT_ERROR.getMessage(
                                        createdWorkspace.getId(), "")))
                .verify();
    }
}
