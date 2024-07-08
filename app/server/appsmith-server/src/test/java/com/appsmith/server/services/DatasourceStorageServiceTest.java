package com.appsmith.server.services;

import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.external.models.Endpoint;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.datasourcestorages.base.DatasourceStorageService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.solutions.ApplicationPermission;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.security.test.context.support.WithUserDetails;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.Comparator;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Slf4j
public class DatasourceStorageServiceTest {

    @Autowired
    UserRepository userRepository;

    @SpyBean
    WorkspaceService workspaceService;

    @Autowired
    DatasourceStorageService datasourceStorageService;

    @MockBean
    PluginExecutorHelper pluginExecutorHelper;

    @Autowired
    PluginService pluginService;

    @Autowired
    ApplicationService applicationService;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    ApplicationPermission applicationPermission;

    Workspace workspace;

    @BeforeEach
    public void setup() {
        Mono<User> userMono = userRepository.findByEmail("api_user").cache();
        workspace = userMono.flatMap(user -> workspaceService.createDefault(new Workspace(), user))
                .switchIfEmpty(Mono.error(new Exception("createDefault is returning empty!!")))
                .block();
    }

    @AfterEach
    public void cleanup() {
        List<Application> deletedApplications = applicationService
                .findByWorkspaceId(workspace.getId(), applicationPermission.getDeletePermission())
                .flatMap(remainingApplication -> applicationPageService.deleteApplication(remainingApplication.getId()))
                .collectList()
                .block();
        Workspace deletedWorkspace =
                workspaceService.archiveById(workspace.getId()).block();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void verifyFindByDatasourceId() {

        String datasourceId = "mockDatasourceId";
        String environmentIdOne = "mockEnvironmentIdOne";
        String environmentIdTwo = "mockEnvironmentIdTwo";
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setEndpoints(List.of(new Endpoint("mockEndpoints", 000L)));
        DatasourceStorage datasourceStorageOne =
                new DatasourceStorage(datasourceId, environmentIdOne, datasourceConfiguration, null, null, null);

        DatasourceStorage datasourceStorageTwo =
                new DatasourceStorage(datasourceId, environmentIdTwo, datasourceConfiguration, null, null, null);

        datasourceStorageService.save(datasourceStorageOne).block();
        datasourceStorageService.save(datasourceStorageTwo).block();

        Flux<DatasourceStorage> datasourceStorageFlux = datasourceStorageService
                .findStrictlyByDatasourceId(datasourceId)
                .sort(Comparator.comparing(DatasourceStorage::getEnvironmentId));

        StepVerifier.create(datasourceStorageFlux)
                .assertNext(datasourceStorage -> {
                    assertThat(datasourceStorage).isNotNull();
                    assertThat(datasourceId).isEqualTo(datasourceStorage.getDatasourceId());
                    assertThat("mockEnvironmentIdOne").isEqualTo(datasourceStorage.getEnvironmentId());
                })
                .assertNext(datasourceStorage -> {
                    assertThat(datasourceStorage).isNotNull();
                    assertThat(datasourceId).isEqualTo(datasourceStorage.getDatasourceId());
                    assertThat("mockEnvironmentIdTwo").isEqualTo(datasourceStorage.getEnvironmentId());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void verifyStorageCreationErrorsOutWhenStorageAlreadyExists() {

        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        Endpoint endpoint = new Endpoint("https://sample.endpoint", 5432L);
        DBAuth dbAuth = new DBAuth();
        dbAuth.setPassword("password");
        dbAuth.setUsername("username");
        dbAuth.setDatabaseName("databaseName");

        datasourceConfiguration.setEndpoints(List.of(endpoint));
        datasourceConfiguration.setAuthentication(dbAuth);

        Plugin plugin = pluginService.findByPackageName("postgres-plugin").block();
        String pluginId = plugin.getId();
        String datasourceId = "mockedDatasourceId";
        String environmentIdOne = "mockedEnvironmentId";

        DatasourceStorage datasourceStorage = new DatasourceStorage();
        datasourceStorage.setDatasourceId(datasourceId);
        datasourceStorage.setEnvironmentId(environmentIdOne);
        datasourceStorage.setPluginId(pluginId);
        datasourceStorage.setDatasourceConfiguration(datasourceConfiguration);

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        datasourceStorageService.create(datasourceStorage).block();
        StepVerifier.create(datasourceStorageService.create(datasourceStorage)).verifyErrorSatisfies(error -> {
            assertThat(error).isInstanceOf(AppsmithException.class);
            assertThat(((AppsmithException) error).getAppErrorCode())
                    .isEqualTo(AppsmithError.DUPLICATE_DATASOURCE_CONFIGURATION.getAppErrorCode());
        });
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void verifyStorageCreationSucceedsWithDifferentEnvironmentId() {

        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        Endpoint endpoint = new Endpoint("https://sample.endpoint", 5432L);
        DBAuth dbAuth = new DBAuth();
        dbAuth.setPassword("password");
        dbAuth.setUsername("username");
        dbAuth.setDatabaseName("databaseName");

        datasourceConfiguration.setEndpoints(List.of(endpoint));
        datasourceConfiguration.setAuthentication(dbAuth);

        Plugin plugin = pluginService.findByPackageName("postgres-plugin").block();
        String pluginId = plugin.getId();
        String datasourceId = "sampleDatasourceId";
        String environmentIdOne = "sampleEnvironmentId";

        DatasourceStorage datasourceStorage = new DatasourceStorage();
        datasourceStorage.setDatasourceId(datasourceId);
        datasourceStorage.setEnvironmentId(environmentIdOne);
        datasourceStorage.setPluginId(pluginId);
        datasourceStorage.setDatasourceConfiguration(datasourceConfiguration);

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        datasourceStorageService.create(datasourceStorage).block();

        String environmentId = "sampleEnvironmentId2";
        datasourceStorage.setEnvironmentId(environmentId);
        StepVerifier.create(datasourceStorageService.create(datasourceStorage)).assertNext(dbDatasourceStorage -> {
            assertThat(dbDatasourceStorage).isNotNull();
            assertThat(datasourceId).isEqualTo(dbDatasourceStorage.getDatasourceId());
            assertThat(environmentId).isEqualTo(dbDatasourceStorage.getEnvironmentId());
        });
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void verifyFindByDatasourceAndStorageIdGivesErrorWhenNoConfigurationIsPresent() {

        Plugin plugin = pluginService.findByPackageName("postgres-plugin").block();
        String pluginId = plugin.getId();
        String datasourceId = "datasourceForExecution";
        String environmentIdOne = FieldName.UNUSED_ENVIRONMENT_ID;

        DatasourceStorage datasourceStorage = new DatasourceStorage();
        datasourceStorage.setDatasourceId(datasourceId);
        datasourceStorage.setEnvironmentId(environmentIdOne);
        datasourceStorage.setPluginId(pluginId);

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        datasourceStorageService.create(datasourceStorage).block();

        Datasource datasource = new Datasource();
        datasource.setId(datasourceId);
        datasource.setPluginId(pluginId);

        Mono<DatasourceStorage> datasourceStorageMono =
                datasourceStorageService.findByDatasourceAndEnvironmentIdForExecution(datasource, environmentIdOne);
        StepVerifier.create(datasourceStorageMono).verifyErrorSatisfies(error -> {
            assertThat(error).isInstanceOf(AppsmithException.class);
            assertThat(((AppsmithException) error).getAppErrorCode())
                    .isEqualTo(AppsmithError.NO_CONFIGURATION_FOUND_IN_DATASOURCE.getAppErrorCode());
        });
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void verifyFindByDatasourceAndStorageIdGivesErrorWhenStorageIsAbsent() {
        String datasourceId = "datasourceForUnsavedStorage";
        String environmentIdOne = FieldName.UNUSED_ENVIRONMENT_ID;

        Datasource datasource = new Datasource();
        datasource.setId(datasourceId);

        Mono<DatasourceStorage> datasourceStorageMono =
                datasourceStorageService.findByDatasourceAndEnvironmentIdForExecution(datasource, environmentIdOne);
        StepVerifier.create(datasourceStorageMono).verifyErrorSatisfies(error -> {
            assertThat(error).isInstanceOf(AppsmithException.class);
            assertThat(((AppsmithException) error).getAppErrorCode())
                    .isEqualTo(AppsmithError.NO_RESOURCE_FOUND.getAppErrorCode());
        });
    }
}
