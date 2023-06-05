package com.appsmith.server.services;

import com.appsmith.external.dtos.EnvironmentDTO;
import com.appsmith.external.models.Environment;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.exceptions.AppsmithErrorCode;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
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
import static java.lang.Boolean.TRUE;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.any;
import static org.mockito.Mockito.doReturn;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@DirtiesContext
@Slf4j
public class EnvironmentServiceTest {

    @Autowired
    EnvironmentService environmentService;
    @Autowired
    UserRepository userRepository;
    @SpyBean
    WorkspaceService workspaceService;
    @SpyBean
    FeatureFlagService featureFlagService;
    @SpyBean
    ApplicationRepository applicationRepository;
    private Workspace workspace;

    /**
     * We create two environments by default when we create a workspace,
     * many of the test methods are leveraging the implicit creation of environments to find environments
     */
    @BeforeEach
    public void setup() {
        Mono<User> userMono = userRepository.findByEmail("api_user").cache();
        workspace = userMono
                .flatMap(user -> workspaceService.createDefault(new Workspace(), user))
                .switchIfEmpty(Mono.error(new Exception("createDefault is returning empty!!")))
                .block();

        doReturn(Mono.justOrEmpty(workspace))
                .when(workspaceService)
                .findById(any(), Mockito.<AclPermission>any());
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void verifyGetEnvironmentDTOByWorkspaceId() {

        doReturn(Mono.just(Boolean.TRUE))
                .when(featureFlagService)
                .check(Mockito.any());

        Flux<EnvironmentDTO> environmentDTOFlux =
                environmentService
                        .getEnvironmentDTOByWorkspaceId(workspace.getId())
                        .sort(Comparator.comparing(EnvironmentDTO::getName));

        StepVerifier.create(environmentDTOFlux)
                .assertNext(envDTO -> {
                    assertThat(envDTO.getName()).isEqualTo(PRODUCTION_ENVIRONMENT);
                })
                .assertNext(envDTO -> {
                    assertThat(envDTO.getName()).isEqualTo(STAGING_ENVIRONMENT);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void verifyFindByWorkspaceIdWithoutPermission() {

        doReturn(Mono.just(Boolean.TRUE))
                .when(featureFlagService)
                .check(any());

        Flux<Environment> environmentFlux =
                environmentService
                        .findByWorkspaceId(workspace.getId())
                        .sort(Comparator.comparing(Environment::getName));

        StepVerifier.create(environmentFlux)
                .assertNext(envDTO -> {
                    assertThat(envDTO.getName()).isEqualTo(PRODUCTION_ENVIRONMENT);
                })
                .assertNext(envDTO -> {
                    assertThat(envDTO.getName()).isEqualTo(STAGING_ENVIRONMENT);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void verifyGetEnvironmentDTOByEnvironmentId() {

        doReturn(Mono.just(Boolean.TRUE))
                .doReturn(Mono.just(Boolean.TRUE))
                .when(featureFlagService)
                .check(any());

        Flux<Environment> environmentFlux =
                environmentService
                        .findByWorkspaceId(workspace.getId()).cache();

        Flux<Tuple2<Environment, EnvironmentDTO>> environmentTupleFlux = environmentFlux
                .flatMap(env -> Mono.zip(Mono.just(env), environmentService.getEnvironmentDTOByEnvironmentId(env.getId())));

        StepVerifier.create(environmentTupleFlux)
                .assertNext(environmentTuple -> {
                    assertThat(environmentTuple.getT2().getName()).isEqualTo(environmentTuple.getT1().getName());
                })
                .assertNext(environmentTuple -> {
                    assertThat(environmentTuple.getT2().getName()).isEqualTo(environmentTuple.getT1().getName());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void verifyIndexOnEnvironmentNameAndWorkspaceId() {
        // before this test we have created a workspace
        // and two environments with defaultNames
        // an error will be thrown if we try to create a new environment with either of default names

        Flux<Environment> environmentMapFlux = environmentService.createDefaultEnvironments(workspace);
        StepVerifier.create(environmentMapFlux)
                .verifyError();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void verifyEnvironmentArchivalWhenWorkspaceIsArchived() {
        doReturn(Mono.just(0L))
                .when(applicationRepository).countByWorkspaceId(any());
        Workspace workspace1 = workspaceService.archiveById(workspace.getId()).block();
        Flux<Environment> environmentFlux =
                environmentService.findByWorkspaceId(workspace.getId());
        StepVerifier.create(environmentFlux)
                .expectNextCount(0L)
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void verifyEnvironmentWhenWorkspaceArchivalIsFailed() {
        doReturn(Mono.just(2L))
                .when(applicationRepository).countByWorkspaceId(any());

        StepVerifier.create(workspaceService.archiveById(workspace.getId()))
                .verifyError();
        Flux<Environment> environmentFlux =
                environmentService.findByWorkspaceId(workspace.getId())
                        .sort(Comparator.comparing(Environment::getName));

        StepVerifier.create(environmentFlux)
                .assertNext(env -> {
                    assert (env.getName().equals(PRODUCTION_ENVIRONMENT));
                })
                .assertNext(env -> {
                    assert (env.getName().equals(STAGING_ENVIRONMENT));
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void verifySetStagingAsDefault() {

        doReturn(Mono.just(Boolean.TRUE))
                .when(featureFlagService)
                .check(Mockito.any());

        Map<String, Environment> environmentMap =
                environmentService.findByWorkspaceId(workspace.getId())
                        .collectMap(Environment::getName)
                        .block();

        assertThat(environmentMap.get(PRODUCTION_ENVIRONMENT).getIsDefault()).isEqualTo(TRUE);

        String stagingEnvironmentId = environmentMap.get(STAGING_ENVIRONMENT).getId();

        Mono<EnvironmentDTO> environmentDTOMono =
                environmentService
                        .setEnvironmentToDefault(Map.of(FieldName.WORKSPACE_ID, workspace.getId(),
                                FieldName.ENVIRONMENT_ID, stagingEnvironmentId));

        StepVerifier.create(environmentDTOMono)
                .assertNext(environmentDTO -> {
                    assertThat(environmentDTO.getName()).isEqualTo(STAGING_ENVIRONMENT);
                    assertThat(stagingEnvironmentId).isEqualTo(environmentDTO.getId());
                    assertThat(environmentDTO.getIsDefault()).isEqualTo(TRUE);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void verifyErrorWhenNoPermissionForWorkspace() {
        doReturn(Mono.just(Boolean.TRUE))
                .when(featureFlagService)
                .check(Mockito.any());
        
        doReturn(Mono.empty())
                .when(workspaceService)
                .findById(any(), Mockito.<AclPermission>any());

        Map<String, Environment> environmentMap =
                environmentService.findByWorkspaceId(workspace.getId())
                        .collectMap(Environment::getName)
                        .block();

        assertThat(environmentMap.get(PRODUCTION_ENVIRONMENT).getIsDefault()).isEqualTo(TRUE);

        String stagingEnvironmentId = environmentMap.get(STAGING_ENVIRONMENT).getId();

        Mono<EnvironmentDTO> environmentDTOMono =
                environmentService
                        .setEnvironmentToDefault(Map.of(FieldName.WORKSPACE_ID, workspace.getId(),
                                FieldName.ENVIRONMENT_ID, stagingEnvironmentId));

        StepVerifier.create(environmentDTOMono)
                .verifyErrorSatisfies(error -> {
                    assertThat(error).isInstanceOf(AppsmithException.class);
                    assertThat(error.getMessage()).isEqualTo("Unauthorized access");
                });

    }

    @Test
    @WithUserDetails(value = "api_user")
    public void verifyErrorWhenWorkspaceIdOrEnvironmentIdIsGiven() {
        doReturn(Mono.just(Boolean.TRUE))
                .when(featureFlagService)
                .check(Mockito.any());

        doReturn(Mono.empty())
                .when(workspaceService)
                .findById(any(), Mockito.<AclPermission>any());

        Map<String, Environment> environmentMap =
                environmentService.findByWorkspaceId(workspace.getId())
                        .collectMap(Environment::getName)
                        .block();

        assertThat(environmentMap.get(PRODUCTION_ENVIRONMENT).getIsDefault()).isEqualTo(TRUE);

        String stagingEnvironmentId = environmentMap.get(STAGING_ENVIRONMENT).getId();

        Mono<EnvironmentDTO> environmentDTOWithoutWorkspaceIdMono =
                environmentService
                        .setEnvironmentToDefault(Map.of(FieldName.ENVIRONMENT_ID, stagingEnvironmentId));

        StepVerifier.create(environmentDTOWithoutWorkspaceIdMono)
                .verifyErrorSatisfies(error -> {
                    System.out.println(error.getMessage());
                    assertThat(error).isInstanceOf(AppsmithException.class);
                    assertThat(((AppsmithException) error).getAppErrorCode()).isEqualTo(AppsmithErrorCode.INVALID_PARAMETER.getCode());
                });

        Mono<EnvironmentDTO> environmentDTOWithoutEnvironmentIdMono =
                environmentService
                        .setEnvironmentToDefault(Map.of(FieldName.WORKSPACE_ID, workspace.getId()));

        StepVerifier.create(environmentDTOWithoutEnvironmentIdMono)
                .verifyErrorSatisfies(error -> {

                    System.out.println(error.getMessage());
                    assertThat(error).isInstanceOf(AppsmithException.class);
                    assertThat(((AppsmithException) error).getAppErrorCode()).isEqualTo(AppsmithErrorCode.INVALID_PARAMETER.getCode());
                });


    }

}