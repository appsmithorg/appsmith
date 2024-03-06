package com.appsmith.server.services.ce_compatible;

import com.appsmith.external.dtos.EnvironmentDTO;
import com.appsmith.external.models.Environment;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.EnvironmentService;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.WorkspaceService;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.BeforeEach;
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
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import reactor.util.function.Tuple2;

import java.util.Comparator;
import java.util.Map;

import static com.appsmith.external.constants.CommonFieldName.PRODUCTION_ENVIRONMENT;
import static com.appsmith.external.constants.CommonFieldName.STAGING_ENVIRONMENT;
import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doReturn;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@DirtiesContext
@Slf4j
class EnvironmentServiceCECompatibleImplTest {

    @Autowired
    EnvironmentService environmentService;

    @Autowired
    UserRepository userRepository;

    @SpyBean
    WorkspaceService workspaceService;

    @MockBean
    FeatureFlagService featureFlagService;

    @SpyBean
    ApplicationRepository applicationRepository;

    private Workspace workspace;

    @BeforeEach
    void setUp() {
        Mockito.when(featureFlagService.check(any())).thenReturn(Mono.just(FALSE));
        Mono<User> userMono = userRepository.findByEmail("api_user").cache();
        workspace = userMono.flatMap(user -> workspaceService.createDefault(new Workspace(), user))
                .switchIfEmpty(Mono.error(new Exception("createDefault is returning empty!!")))
                .block();

        doReturn(Mono.justOrEmpty(workspace)).when(workspaceService).findById(any(), Mockito.<AclPermission>any());
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void verifySetEnvironmentToDefault() {
        Map<String, Environment> environmentMap = environmentService
                .findByWorkspaceId(workspace.getId())
                .collectMap(Environment::getName)
                .block();

        assertThat(environmentMap.get(PRODUCTION_ENVIRONMENT).getIsDefault()).isEqualTo(TRUE);

        String stagingEnvironmentId = environmentMap.get(STAGING_ENVIRONMENT).getId();

        Mono<EnvironmentDTO> environmentDTOMono = environmentService.setEnvironmentToDefault(
                Map.of(FieldName.WORKSPACE_ID, workspace.getId(), FieldName.ENVIRONMENT_ID, stagingEnvironmentId));

        StepVerifier.create(environmentDTOMono).verifyErrorSatisfies(error -> {
            assertThat(error).isInstanceOf(AppsmithException.class);
            assertThat(error.getMessage()).isEqualTo(AppsmithError.UNSUPPORTED_OPERATION.getMessage());
        });
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void verifyGetEnvironmentDTOByEnvironmentId() {

        Flux<Environment> environmentFlux =
                environmentService.findByWorkspaceId(workspace.getId()).cache();

        Flux<Tuple2<Environment, EnvironmentDTO>> environmentTupleFlux = environmentFlux.flatMap(
                env -> Mono.zip(Mono.just(env), environmentService.getEnvironmentDTOByEnvironmentId(env.getId())));

        StepVerifier.create(environmentTupleFlux).verifyErrorSatisfies(error -> {
            assertThat(error).isInstanceOf(AppsmithException.class);
            assertThat(error.getMessage()).isEqualTo(AppsmithError.UNSUPPORTED_OPERATION.getMessage());
        });
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void verifyGetEnvironmentDTOByWorkspaceId_onlyProductionEnvIsReturned() {

        Flux<EnvironmentDTO> environmentDTOFlux = environmentService
                .getEnvironmentDTOByWorkspaceId(workspace.getId())
                .sort(Comparator.comparing(EnvironmentDTO::getName));

        StepVerifier.create(environmentDTOFlux)
                .assertNext(envDTO -> {
                    assertThat(envDTO.getName()).isEqualTo(PRODUCTION_ENVIRONMENT);
                })
                .verifyComplete();
    }
}
