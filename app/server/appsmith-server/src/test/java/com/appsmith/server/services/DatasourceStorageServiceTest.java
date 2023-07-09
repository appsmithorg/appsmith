package com.appsmith.server.services;

import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStorage;
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
public class DatasourceStorageServiceTest {

    @Autowired
    UserRepository userRepository;

    @SpyBean
    WorkspaceService workspaceService;

    @Autowired
    DatasourceStorageService datasourceStorageService;

    @BeforeEach
    public void setup() {
        Mono<User> userMono = userRepository.findByEmail("api_user").cache();
        Workspace workspace = userMono.flatMap(user -> workspaceService.createDefault(new Workspace(), user))
                .switchIfEmpty(Mono.error(new Exception("createDefault is returning empty!!")))
                .block();
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
}
