package com.appsmith.server.services.ee;

import com.appsmith.external.models.AppsmithDomain;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.external.models.Environment;
import com.appsmith.external.models.Property;
import com.appsmith.server.datasourcestorages.base.DatasourceStorageService;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.DatasourceStorageRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.EnvironmentService;
import com.appsmith.server.services.VariableReplacementService;
import com.appsmith.server.services.WorkspaceService;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@Slf4j
@DirtiesContext
public class DatasourceStorageServiceTest {

    @Autowired
    DatasourceStorageService datasourceStorageService;

    @MockBean
    VariableReplacementService variableReplacementService;

    @SpyBean
    DatasourceStorageRepository datasourceStorageRepository;

    @Autowired
    UserRepository userRepository;

    @SpyBean
    WorkspaceService workspaceService;

    @Autowired
    EnvironmentService environmentService;

    @Test
    public void testServerSideVariableReplacement() {
        String testHeaderKey = "test-header";
        Property testHeader = new Property(testHeaderKey, "<<variable>>");
        DatasourceConfiguration testConfigurations = new DatasourceConfiguration();
        testConfigurations.setHeaders(List.of(testHeader));
        Datasource testDatasource = new Datasource();
        testDatasource.setId("testDatasourceId");
        testDatasource.setDatasourceConfiguration(testConfigurations);

        String renderedValue = "Server Rendered Value";
        Property renderedHeader = new Property(testHeaderKey, renderedValue);
        DatasourceConfiguration renderedConfiguration = new DatasourceConfiguration();
        renderedConfiguration.setHeaders(List.of(renderedHeader));

        String environmentId = "mockEnvironmentId";
        DatasourceStorage mockStorage =
                datasourceStorageService.createDatasourceStorageFromDatasource(testDatasource, environmentId);
        Mockito.when(variableReplacementService.replaceValue(Mockito.any())).thenReturn(Mono.just(renderedValue));
        Mockito.when(variableReplacementService.replaceAll(Mockito.any(AppsmithDomain.class)))
                .thenReturn(Mono.just(renderedConfiguration));
        Mockito.doReturn(Mono.just(mockStorage))
                .when(datasourceStorageRepository)
                .findByDatasourceIdAndEnvironmentId(Mockito.anyString(), Mockito.any());

        Mono<DatasourceStorage> renderedDatasourceStorageMono =
                datasourceStorageService.findByDatasourceAndEnvironmentIdForExecution(testDatasource, "anyId");

        StepVerifier.create(renderedDatasourceStorageMono)
                .assertNext(datasourceStorage -> {
                    assertThat(datasourceStorage).isNotNull();
                    assertThat(datasourceStorage.getDatasourceConfiguration()).isNotNull();
                    assertThat(datasourceStorage.getDatasourceConfiguration().getHeaders())
                            .isNotEmpty();
                    assertThat(datasourceStorage
                                    .getDatasourceConfiguration()
                                    .getHeaders()
                                    .get(0)
                                    .getKey())
                            .isEqualTo(testHeaderKey);
                    assertThat(datasourceStorage
                                    .getDatasourceConfiguration()
                                    .getHeaders()
                                    .get(0)
                                    .getValue())
                            .isEqualTo(renderedValue);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void verifyFindByDatasourceAndStorageIdGivesErrorWhenStorageIsAbsent() {
        Mono<User> userMono = userRepository.findByEmail("api_user").cache();
        Workspace workspace = userMono.flatMap(user -> workspaceService.createDefault(new Workspace(), user))
                .switchIfEmpty(Mono.error(new Exception("createDefault is returning empty!!")))
                .block();

        String environmentId = environmentService
                .findByWorkspaceId(workspace.getId())
                .map(Environment::getId)
                .blockFirst();

        String datasourceId = "datasourceForUnsavedStorage";
        Datasource datasource = new Datasource();
        datasource.setId(datasourceId);

        Mono<DatasourceStorage> datasourceStorageMono =
                datasourceStorageService.findByDatasourceAndEnvironmentIdForExecution(datasource, environmentId);
        StepVerifier.create(datasourceStorageMono).verifyErrorSatisfies(error -> {
            assertThat(error).isInstanceOf(AppsmithException.class);
            assertThat(((AppsmithException) error).getAppErrorCode())
                    .isEqualTo(AppsmithError.UNCONFIGURED_DATASOURCE_STORAGE.getAppErrorCode());
        });
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void verifyEnvironmentNameFromEnvironmentId() {
        Mono<User> userMono = userRepository.findByEmail("api_user").cache();
        Workspace workspace = userMono.flatMap(user -> workspaceService.createDefault(new Workspace(), user))
                .switchIfEmpty(Mono.error(new Exception("createDefault is returning empty!!")))
                .block();

        Environment environment =
                environmentService.findByWorkspaceId(workspace.getId()).blockFirst();

        Mono<String> environmentNameMono =
                datasourceStorageService.getEnvironmentNameFromEnvironmentIdForAnalytics(environment.getId());
        StepVerifier.create(environmentNameMono).assertNext(environmentName -> {
            assertThat(environmentName).isEqualTo(environment.getName());
        });
    }
}
