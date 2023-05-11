package com.appsmith.server.services;

import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceConfigurationStorage;
import com.appsmith.external.models.Endpoint;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.repositories.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.Comparator;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@Slf4j
public class DatasourceConfigurationStorageServiceTest {

    @Autowired
    UserRepository userRepository;
    @SpyBean
    WorkspaceService workspaceService;
    @Autowired
    DatasourceConfigurationStorageService datasourceConfigurationStorageService;



    @BeforeEach
    public void setup() {
        Mono<User> userMono = userRepository.findByEmail("api_user").cache();
        Workspace workspace =
                userMono.flatMap(user -> workspaceService.createDefault(new Workspace(), user))
                        .switchIfEmpty(Mono.error(new Exception("createDefault is returning empty!!")))
                        .block();

    }

    @Test
    @WithUserDetails(value = "api_user")
    public void verifyFindOneByDatasourceId() {
        String datasourceId = "mockDatasourceId";
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setEndpoints(List.of(new Endpoint("mockEndpoints", 000L)));
        DatasourceConfigurationStorage datasourceConfigurationStorage =
                new DatasourceConfigurationStorage(datasourceId, null, datasourceConfiguration, null, null);

        DatasourceConfigurationStorage savedDatasourceConfigurationStorage =
                datasourceConfigurationStorageService.save(datasourceConfigurationStorage).block();

        Mono<DatasourceConfigurationStorage> datasourceConfigurationStorageMono =
                datasourceConfigurationStorageService.findOneByDatasourceId(datasourceId);

        StepVerifier.create(datasourceConfigurationStorageMono)
                .assertNext(datasourceConfigurationStorage1 -> {
                    assertThat(datasourceConfigurationStorage1).isNotNull();
                    assertThat(datasourceId).isEqualTo(datasourceConfigurationStorage1.getDatasourceId());
                    assertThat(datasourceConfigurationStorage1.getDatasourceConfiguration().getEndpoints().size()).isEqualTo(1);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void verifyFindByDatasourceId() {

        String datasourceId = "mockDatasourceId";
        String environmentIdOne = "mockEnvironmentIdOne";
        String environmentIdTwo = "mockEnvironmentIdTwo";
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setEndpoints(List.of(new Endpoint("mockEndpoints", 000L)));
        DatasourceConfigurationStorage datasourceConfigurationStorageOne =
                new DatasourceConfigurationStorage(datasourceId, environmentIdOne, datasourceConfiguration, null, null);

        DatasourceConfigurationStorage datasourceConfigurationStorageTwo =
                new DatasourceConfigurationStorage(datasourceId, environmentIdTwo, datasourceConfiguration, null, null);


        datasourceConfigurationStorageService.save(datasourceConfigurationStorageOne).block();
        datasourceConfigurationStorageService.save(datasourceConfigurationStorageTwo).block();

        Flux<DatasourceConfigurationStorage> datasourceConfigurationStorageFlux =
                datasourceConfigurationStorageService.findByDatasourceId(datasourceId)
                        .sort(Comparator.comparing(DatasourceConfigurationStorage::getEnvironmentId));

        StepVerifier.create(datasourceConfigurationStorageFlux)
                .assertNext(datasourceConfigurationStorage -> {
                    assertThat(datasourceConfigurationStorage).isNotNull() ;
                    assertThat(datasourceId).isEqualTo(datasourceConfigurationStorage.getDatasourceId());
                    assertThat(environmentIdOne).isEqualTo(datasourceConfigurationStorage.getEnvironmentId());
                })
                .assertNext(datasourceConfigurationStorage -> {
                    assertThat(datasourceConfigurationStorage).isNotNull();
                    assertThat(datasourceId).isEqualTo(datasourceConfigurationStorage.getDatasourceId());
                    assertThat(environmentIdTwo).isEqualTo(datasourceConfigurationStorage.getEnvironmentId());
                })
                .verifyComplete();
    }
}
