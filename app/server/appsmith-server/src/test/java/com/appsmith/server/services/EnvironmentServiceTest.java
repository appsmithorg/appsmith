package com.appsmith.server.services;

import com.appsmith.external.dtos.EnvironmentDTO;
import com.appsmith.external.models.Environment;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithErrorCode;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.EnvironmentRepository;
import com.appsmith.server.repositories.UserRepository;
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
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.external.constants.CommonFieldName.PRODUCTION_ENVIRONMENT;
import static com.appsmith.external.constants.CommonFieldName.STAGING_ENVIRONMENT;
import static com.appsmith.server.acl.AclPermission.DELETE_ENVIRONMENTS;
import static com.appsmith.server.acl.AclPermission.EXECUTE_ENVIRONMENTS;
import static com.appsmith.server.acl.AclPermission.MANAGE_ENVIRONMENTS;
import static com.appsmith.server.constants.FieldName.ENVIRONMENT_NAME;
import static com.appsmith.server.constants.ce.FieldNameCE.WORKSPACE_ID;
import static java.lang.Boolean.TRUE;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.any;
import static org.mockito.Mockito.doReturn;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@DirtiesContext
@Slf4j
public class EnvironmentServiceTest {

    @SpyBean
    EnvironmentService environmentService;

    @Autowired
    UserRepository userRepository;

    @SpyBean
    WorkspaceService workspaceService;

    @SpyBean
    EnvironmentRepository repository;

    @MockBean
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
        Mockito.when(featureFlagService.check(any())).thenReturn(Mono.just(TRUE));
        Mono<User> userMono = userRepository.findByEmail("api_user").cache();
        workspace = userMono.flatMap(user -> workspaceService.createDefault(new Workspace(), user))
                .switchIfEmpty(Mono.error(new Exception("createDefault is returning empty!!")))
                .block();

        doReturn(Mono.justOrEmpty(workspace)).when(workspaceService).findById(any(), Mockito.<AclPermission>any());
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void verifyGetEnvironmentDTOByWorkspaceId() {

        Flux<EnvironmentDTO> environmentDTOFlux = environmentService
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

        Flux<Environment> environmentFlux = environmentService
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

        Flux<Environment> environmentFlux =
                environmentService.findByWorkspaceId(workspace.getId()).cache();

        Flux<Tuple2<Environment, EnvironmentDTO>> environmentTupleFlux = environmentFlux.flatMap(
                env -> Mono.zip(Mono.just(env), environmentService.getEnvironmentDTOByEnvironmentId(env.getId())));

        StepVerifier.create(environmentTupleFlux)
                .assertNext(environmentTuple -> {
                    assertThat(environmentTuple.getT2().getName())
                            .isEqualTo(environmentTuple.getT1().getName());
                })
                .assertNext(environmentTuple -> {
                    assertThat(environmentTuple.getT2().getName())
                            .isEqualTo(environmentTuple.getT1().getName());
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
        StepVerifier.create(environmentMapFlux).verifyError();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void verifyEnvironmentArchivalWhenWorkspaceIsArchived() {
        doReturn(Mono.just(0L)).when(applicationRepository).countByWorkspaceId(any());
        Workspace workspace1 = workspaceService.archiveById(workspace.getId()).block();
        Flux<Environment> environmentFlux = environmentService.findByWorkspaceId(workspace.getId());
        StepVerifier.create(environmentFlux).expectNextCount(0L).verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void verifyEnvironmentWhenWorkspaceArchivalIsFailed() {
        doReturn(Mono.just(2L)).when(applicationRepository).countByWorkspaceId(any());

        StepVerifier.create(workspaceService.archiveById(workspace.getId())).verifyError();
        Flux<Environment> environmentFlux = environmentService
                .findByWorkspaceId(workspace.getId())
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

        Map<String, Environment> environmentMap = environmentService
                .findByWorkspaceId(workspace.getId())
                .collectMap(Environment::getName)
                .block();

        assertThat(environmentMap.get(PRODUCTION_ENVIRONMENT).getIsDefault()).isEqualTo(TRUE);

        String stagingEnvironmentId = environmentMap.get(STAGING_ENVIRONMENT).getId();

        Mono<EnvironmentDTO> environmentDTOMono = environmentService.setEnvironmentToDefault(
                Map.of(FieldName.WORKSPACE_ID, workspace.getId(), FieldName.ENVIRONMENT_ID, stagingEnvironmentId));

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

        doReturn(Mono.empty()).when(workspaceService).findById(any(), Mockito.<AclPermission>any());

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
            assertThat(error.getMessage()).isEqualTo("Unauthorized access");
        });
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void verifyErrorWhenWorkspaceIdOrEnvironmentIdIsGiven() {

        doReturn(Mono.just(Boolean.TRUE)).when(featureFlagService).check(Mockito.any());

        Map<String, Environment> environmentMap = environmentService
                .findByWorkspaceId(workspace.getId())
                .collectMap(Environment::getName)
                .block();

        assertThat(environmentMap.get(PRODUCTION_ENVIRONMENT).getIsDefault()).isEqualTo(TRUE);

        String stagingEnvironmentId = environmentMap.get(STAGING_ENVIRONMENT).getId();

        Mono<EnvironmentDTO> environmentDTOWithoutWorkspaceIdMono =
                environmentService.setEnvironmentToDefault(Map.of(FieldName.ENVIRONMENT_ID, stagingEnvironmentId));

        StepVerifier.create(environmentDTOWithoutWorkspaceIdMono).verifyErrorSatisfies(error -> {
            System.out.println(error.getMessage());
            assertThat(error).isInstanceOf(AppsmithException.class);
            assertThat(((AppsmithException) error).getAppErrorCode())
                    .isEqualTo(AppsmithErrorCode.INVALID_PARAMETER.getCode());
        });

        Mono<EnvironmentDTO> environmentDTOWithoutEnvironmentIdMono =
                environmentService.setEnvironmentToDefault(Map.of(FieldName.WORKSPACE_ID, workspace.getId()));

        StepVerifier.create(environmentDTOWithoutEnvironmentIdMono).verifyErrorSatisfies(error -> {
            System.out.println(error.getMessage());
            assertThat(error).isInstanceOf(AppsmithException.class);
            assertThat(((AppsmithException) error).getAppErrorCode())
                    .isEqualTo(AppsmithErrorCode.INVALID_PARAMETER.getCode());
        });
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void verifyCreateCustomEnvironmentSuccess() {

        Map<String, String> customEnvironmentDetails = new HashMap<>();
        customEnvironmentDetails.put(ENVIRONMENT_NAME, "new custom environment");
        customEnvironmentDetails.put(WORKSPACE_ID, "1234");

        Mono<EnvironmentDTO> environmentDTOMono = environmentService.createCustomEnvironment(customEnvironmentDetails);

        StepVerifier.create(environmentDTOMono)
                .assertNext(envDTO -> {
                    assertThat(envDTO.getName()).isEqualTo("new custom environment");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void verifyCreateCustomEnvironment_ReservedName_Staging_Failure() {

        Map<String, String> customEnvironmentDetails = new HashMap<>();
        customEnvironmentDetails.put(ENVIRONMENT_NAME, "Staging");
        customEnvironmentDetails.put(WORKSPACE_ID, "1234");

        Mono<EnvironmentDTO> environmentDTOMono = environmentService.createCustomEnvironment(customEnvironmentDetails);

        StepVerifier.create(environmentDTOMono).verifyErrorSatisfies(error -> {
            assertThat(error).isInstanceOf(AppsmithException.class);
            assertThat(((AppsmithException) error).getError()).isEqualTo(AppsmithError.DUPLICATE_KEY);
            assertThat(error.getMessage())
                    .isEqualTo(AppsmithError.DUPLICATE_KEY.getMessage(((AppsmithException) error).getArgs()));
        });
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void verifyCreateCustomEnvironment_Without_WorkspaceCreateEnvironment_Failure() {

        Map<String, String> customEnvironmentDetails = new HashMap<>();
        customEnvironmentDetails.put(ENVIRONMENT_NAME, "new custom environment");
        customEnvironmentDetails.put(WORKSPACE_ID, "1234");

        doReturn(Mono.empty())
                .when(workspaceService)
                .findById(customEnvironmentDetails.get(WORKSPACE_ID), AclPermission.WORKSPACE_CREATE_ENVIRONMENT);

        Mono<EnvironmentDTO> environmentDTOMono = environmentService.createCustomEnvironment(customEnvironmentDetails);

        StepVerifier.create(environmentDTOMono).verifyErrorSatisfies(error -> {
            assertThat(error).isInstanceOf(AppsmithException.class);
            assertThat(error.getMessage()).isEqualTo("Unauthorized access");
        });
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void verifyCreateCustomEnvironment_EnvNameAlreadyExists_Failure() {

        Map<String, String> customEnvironmentDetails = new HashMap<>();
        customEnvironmentDetails.put(ENVIRONMENT_NAME, "new custom environment");
        customEnvironmentDetails.put(WORKSPACE_ID, "1234");

        doReturn(Flux.fromIterable(List.of(new Environment("1234", "new custom environment"))))
                .when(repository)
                .findByWorkspaceId(customEnvironmentDetails.get(WORKSPACE_ID));

        Mono<EnvironmentDTO> environmentDTOMono = environmentService.createCustomEnvironment(customEnvironmentDetails);

        StepVerifier.create(environmentDTOMono).verifyErrorSatisfies(error -> {
            assertThat(error).isInstanceOf(AppsmithException.class);
            assertThat(((AppsmithException) error).getError()).isEqualTo(AppsmithError.DUPLICATE_KEY);
            assertThat(error.getMessage())
                    .isEqualTo(AppsmithError.DUPLICATE_KEY.getMessage(((AppsmithException) error).getArgs()));
        });
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void verifyDeleteCustomEnvironmentSuccess() {

        Environment environment = new Environment("1234", "some env");

        doReturn(Mono.just(environment))
                .when(environmentService)
                .findById(eq("1234"), eq(Optional.of(DELETE_ENVIRONMENTS)));

        doReturn(Mono.just(environment)).when(repository).archive(environment);

        Mono<EnvironmentDTO> environmentDTOMono = environmentService.deleteCustomEnvironment("1234");

        StepVerifier.create(environmentDTOMono)
                .assertNext(envDTO -> {
                    assertThat(envDTO.getName()).isEqualTo(environment.getName());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void verifyDeleteCustomEnvironment_Without_DELETEENVIRONMENT_Failure() {

        doReturn(Mono.empty()).when(repository).findById("1234", DELETE_ENVIRONMENTS);

        Mono<EnvironmentDTO> environmentDTOMono = environmentService.deleteCustomEnvironment("1234");

        StepVerifier.create(environmentDTOMono).verifyErrorSatisfies(error -> {
            assertThat(error).isInstanceOf(AppsmithException.class);
            assertThat(error.getMessage()).isEqualTo("Unauthorized access");
        });
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void verifyDeleteCustomEnvironment_ReservedName_Failure() {

        Environment environment = new Environment("1234", "Production");

        doReturn(Mono.just(environment))
                .when(environmentService)
                .findById(eq("1234"), eq(Optional.of(DELETE_ENVIRONMENTS)));

        Mono<EnvironmentDTO> environmentDTOMono = environmentService.deleteCustomEnvironment("1234");

        StepVerifier.create(environmentDTOMono).verifyErrorSatisfies(error -> {
            assertThat(error).isInstanceOf(AppsmithException.class);
            assertThat(((AppsmithException) error).getError()).isEqualTo(AppsmithError.UNSUPPORTED_OPERATION);
            assertThat(error.getMessage())
                    .isEqualTo(AppsmithError.UNSUPPORTED_OPERATION.getMessage(((AppsmithException) error).getArgs()));
        });
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void verifyUpdateCustomEnvironmentSuccess() {

        String customEnvironmentId = "1234";
        EnvironmentDTO environmentDTO = new EnvironmentDTO();
        environmentDTO.setName("new Name");

        Environment environment = new Environment("1234", "old name");
        environment.setId("1234");

        Workspace workspace = new Workspace();
        workspace.setId("1234");

        doReturn(Mono.just(environment))
                .when(environmentService)
                .findById(eq(customEnvironmentId), eq(Optional.of(MANAGE_ENVIRONMENTS)));

        doReturn(Mono.just(workspace))
                .when(workspaceService)
                .findById(workspace.getId(), AclPermission.WORKSPACE_READ_ENVIRONMENTS);

        doReturn(Flux.empty()).when(environmentService).findByWorkspaceId(workspace.getId());

        doReturn(Mono.just(environment)).when(repository).save(environment);

        Mono<EnvironmentDTO> environmentDTOMono =
                environmentService.updateCustomEnvironment(customEnvironmentId, environmentDTO);

        StepVerifier.create(environmentDTOMono)
                .assertNext(envDTO -> {
                    assertThat(envDTO.getName()).isEqualTo(environmentDTO.getName());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void verifyUpdateCustomEnvironment_SettingToReserveName_Failure() {

        String customEnvironmentId = "1234";
        EnvironmentDTO environmentDTO = new EnvironmentDTO();
        environmentDTO.setName("Production");

        Mono<EnvironmentDTO> environmentDTOMono =
                environmentService.updateCustomEnvironment(customEnvironmentId, environmentDTO);

        StepVerifier.create(environmentDTOMono).verifyErrorSatisfies(error -> {
            assertThat(error).isInstanceOf(AppsmithException.class);
            assertThat(((AppsmithException) error).getError()).isEqualTo(AppsmithError.DUPLICATE_KEY);
            assertThat(error.getMessage())
                    .isEqualTo(AppsmithError.DUPLICATE_KEY.getMessage(((AppsmithException) error).getArgs()));
        });
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void verifyUpdateCustomEnvironment_RenamingReservedName_Failure() {

        String customEnvironmentId = "1234";
        EnvironmentDTO environmentDTO = new EnvironmentDTO();
        environmentDTO.setName("new Name");

        Environment environment = new Environment("1234", "production");
        environment.setId("1234");

        Workspace workspace = new Workspace();
        workspace.setId("1234");

        doReturn(Mono.just(environment))
                .when(environmentService)
                .findById(eq(customEnvironmentId), eq(Optional.of(MANAGE_ENVIRONMENTS)));

        Mono<EnvironmentDTO> environmentDTOMono =
                environmentService.updateCustomEnvironment(customEnvironmentId, environmentDTO);

        StepVerifier.create(environmentDTOMono).verifyErrorSatisfies(error -> {
            assertThat(error).isInstanceOf(AppsmithException.class);
            assertThat(((AppsmithException) error).getError()).isEqualTo(AppsmithError.UNSUPPORTED_OPERATION);
            assertThat(error.getMessage())
                    .isEqualTo(AppsmithError.UNSUPPORTED_OPERATION.getMessage(((AppsmithException) error).getArgs()));
        });
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void verifyUpdateCustomEnvironment_Without_MANAGEENVIRONMENT_Failure() {

        String customEnvironmentId = "1234";
        EnvironmentDTO environmentDTO = new EnvironmentDTO();
        environmentDTO.setName("new Name");

        Environment environment = new Environment("1234", "old name");
        environment.setId("1234");

        Workspace workspace = new Workspace();
        workspace.setId("1234");

        doReturn(Mono.empty()).when(repository).findById(customEnvironmentId, MANAGE_ENVIRONMENTS);

        Mono<EnvironmentDTO> environmentDTOMono =
                environmentService.updateCustomEnvironment(customEnvironmentId, environmentDTO);

        StepVerifier.create(environmentDTOMono).verifyErrorSatisfies(error -> {
            assertThat(error).isInstanceOf(AppsmithException.class);
            assertThat(((AppsmithException) error).getError()).isEqualTo(AppsmithError.NO_RESOURCE_FOUND);
            assertThat(error.getMessage())
                    .isEqualTo(AppsmithError.NO_RESOURCE_FOUND.getMessage(((AppsmithException) error).getArgs()));
        });
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void verifyUpdateCustomEnvironment_RenamingWithExistingName_Failure() {

        String customEnvironmentId = "1234";
        EnvironmentDTO environmentDTO = new EnvironmentDTO();
        environmentDTO.setName("new Name");

        Environment environment = new Environment("1234", "old name");
        environment.setId("1234");

        Environment environmentExistingName = new Environment("1234", "new Name");
        environmentExistingName.setId("1234");

        Workspace workspace = new Workspace();
        workspace.setId("1234");

        doReturn(Mono.just(environment))
                .when(environmentService)
                .findById(eq(customEnvironmentId), eq(Optional.of(MANAGE_ENVIRONMENTS)));

        doReturn(Mono.just(workspace))
                .when(workspaceService)
                .findById(eq(workspace.getId()), eq(AclPermission.WORKSPACE_READ_ENVIRONMENTS));

        doReturn(Flux.fromIterable(List.of(environmentExistingName)))
                .when(environmentService)
                .findByWorkspaceId(eq(workspace.getId()));

        Mono<EnvironmentDTO> environmentDTOMono =
                environmentService.updateCustomEnvironment(customEnvironmentId, environmentDTO);

        StepVerifier.create(environmentDTOMono).verifyErrorSatisfies(error -> {
            assertThat(error).isInstanceOf(AppsmithException.class);
            assertThat(((AppsmithException) error).getError()).isEqualTo(AppsmithError.DUPLICATE_KEY);
            assertThat(error.getMessage())
                    .isEqualTo(AppsmithError.DUPLICATE_KEY.getMessage(((AppsmithException) error).getArgs()));
        });
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void verifyPermissionsForDefaultEnvironments() {

        Map<String, Environment> environmentMap = environmentService
                .findByWorkspaceId(workspace.getId())
                .collectMap(Environment::getName)
                .block();

        Environment stagingEnvironment = environmentMap.get(STAGING_ENVIRONMENT);
        assertThat(stagingEnvironment).isNotNull();
        stagingEnvironment.getPolicies().forEach(policy -> {
            // for staging the default rights stays only with administrator and developer
            assertThat(policy.getPermissionGroups()).hasSize(2);
        });

        Set<String> stagingPermissions = stagingEnvironment.getPolicies().stream()
                .map(Policy::getPermission)
                .collect(Collectors.toSet());
        assertThat(stagingPermissions)
                .containsAll(Set.of(
                        DELETE_ENVIRONMENTS.getValue(),
                        MANAGE_ENVIRONMENTS.getValue(),
                        EXECUTE_ENVIRONMENTS.getValue()));

        Environment productionEnvironment = environmentMap.get(PRODUCTION_ENVIRONMENT);
        assertThat(productionEnvironment).isNotNull();
        assertThat(productionEnvironment).isNotNull();
        productionEnvironment.getPolicies().forEach(policy -> {
            // for staging the default rights stays only with administrator and developer
            if (policy.getPermission().equals(EXECUTE_ENVIRONMENTS.getValue())) {
                assertThat(policy.getPermissionGroups()).hasSize(3);
            } else {
                assertThat(policy.getPermissionGroups()).hasSize(2);
            }
        });

        Set<String> productionPermissions = stagingEnvironment.getPolicies().stream()
                .map(Policy::getPermission)
                .collect(Collectors.toSet());
        assertThat(productionPermissions)
                .containsAll(Set.of(
                        DELETE_ENVIRONMENTS.getValue(),
                        MANAGE_ENVIRONMENTS.getValue(),
                        EXECUTE_ENVIRONMENTS.getValue()));
    }
}
