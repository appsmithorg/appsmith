package com.appsmith.server.transactions;

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
import com.appsmith.server.migrations.JsonSchemaMigration;
import com.appsmith.server.repositories.ActionCollectionRepository;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.services.ActionCollectionService;
import com.appsmith.server.services.NewActionService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.ImportExportApplicationService;
import com.google.gson.Gson;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.test.autoconfigure.data.mongo.AutoConfigureDataMongo;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.core.io.buffer.DefaultDataBufferFactory;
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

// All the test case are for failure or exception. Test cases for valid json file is already present in ImportExportApplicationServiceTest class

@AutoConfigureDataMongo
@SpringBootTest(
        properties = "de.flapdoodle.mongodb.embedded.version=5.0.5"
)
@EnableAutoConfiguration()
@TestPropertySource(properties = "property=C")
@DirtiesContext
public class ImportApplicationTransactionServiceTest {

    @Autowired
    @Qualifier("importExportServiceCEImplV2")
    ImportExportApplicationService importExportApplicationService;

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

    private ApplicationJson applicationJson = new ApplicationJson();

    Long applicationCount = 0L, pageCount = 0L, actionCount = 0L, actionCollectionCount = 0L;

    @BeforeEach
    public void setup() {
        Mockito
                .when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        applicationJson = createAppJson("test_assets/ImportExportServiceTest/valid-application.json").block();
        applicationCount = mongoTemplate.count(new Query(), Application.class);
        pageCount = mongoTemplate.count(new Query(), NewPage.class);
        actionCount = mongoTemplate.count(new Query(), NewAction.class);
        actionCollectionCount = mongoTemplate.count(new Query(), ActionCollection.class);
    }


    private FilePart createFilePart(String filePath) {
        FilePart filepart = Mockito.mock(FilePart.class, Mockito.RETURNS_DEEP_STUBS);
        Flux<DataBuffer> dataBufferFlux = DataBufferUtils
                .read(
                        new ClassPathResource(filePath),
                        new DefaultDataBufferFactory(),
                        4096)
                .cache();

        Mockito.when(filepart.content()).thenReturn(dataBufferFlux);
        Mockito.when(filepart.headers().getContentType()).thenReturn(MediaType.APPLICATION_JSON);

        return filepart;

    }

    private Mono<ApplicationJson> createAppJson(String filePath) {
        FilePart filePart = createFilePart(filePath);

        Mono<String> stringifiedFile = DataBufferUtils.join(filePart.content())
                .map(dataBuffer -> {
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
    public void importApplication_exceptionDuringActionSave_savedPagesAndApplicationReverted() {

        Workspace newWorkspace = new Workspace();
        newWorkspace.setName("Template Workspace");

        Mockito.when(newActionService.save(Mockito.any()))
                .thenThrow(new AppsmithException(AppsmithError.GENERIC_BAD_REQUEST));

        Workspace createdWorkspace = workspaceService.create(newWorkspace).block();

        Mono<Application> resultMono = importExportApplicationService.importApplicationInWorkspace(createdWorkspace.getId(), applicationJson);

        // Check  if expected exception is thrown
        StepVerifier
                .create(resultMono)
                .expectErrorMatches(error -> error instanceof AppsmithException && error.getMessage().equals(AppsmithError.GENERIC_JSON_IMPORT_ERROR.getMessage(createdWorkspace.getId(), "")))
                .verify();

        // After the import application failed in the middle of execution after the application and pages are saved to DB
        // check if the saved pages reverted after the exception
        assertThat(mongoTemplate.count(new Query(), Application.class)).isEqualTo(applicationCount);
        assertThat(mongoTemplate.count(new Query(), NewPage.class)).isEqualTo(pageCount);
        assertThat(mongoTemplate.count(new Query(), NewAction.class)).isEqualTo(actionCount);
    }
}