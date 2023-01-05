package com.appsmith.server.services;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.external.models.EnvironmentVariable;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.domains.User;
import com.appsmith.server.repositories.EnvironmentVariableRepository;
import com.appsmith.server.repositories.EnvironmentRepository;
import com.appsmith.external.dtos.EnvironmentDTO;
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
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;


@ExtendWith(SpringExtension.class)
@SpringBootTest
@DirtiesContext
@Slf4j
public class EnvironmentServiceTest {

    @Autowired
    EnvironmentService environmentService;

    @Autowired
    EnvironmentVariableService environmentVariableService;

    @Autowired
    EnvironmentRepository environmentRepository;

    @Autowired
    EnvironmentVariableRepository environmentVariableRepository;

    @Autowired
    UserRepository userRepository;

    @SpyBean
    WorkspaceService workspaceService;

    @SpyBean
    FeatureFlagService featureFlagService;


    private Workspace workspace;
    private static final String environmentName = "Staging-Test";
    private Mono<EnvironmentDTO> responseEnvironmentDTOMono;

    @BeforeEach
    public void setup() {
        Mono<User> userMono = userRepository.findByEmail("api_user").cache();
        workspace = userMono
                .flatMap(user -> workspaceService.createDefault(new Workspace(), user))
                .switchIfEmpty(Mono.error(new Exception("createDefault is returning empty!!")))
                .block();

        Mockito.when(workspaceService.findById(Mockito.any(), Mockito.<AclPermission>any()))
                .thenReturn(Mono.just(workspace));

        Mockito.when(featureFlagService.check(Mockito.any()))
                .thenReturn(Mono.just(Boolean.TRUE));

        EnvironmentDTO environmentDTO = new EnvironmentDTO();
        environmentDTO.setName(environmentName);
        environmentDTO.setWorkspaceId(workspace.getId());

        responseEnvironmentDTOMono = environmentService.createNewEnvironment(environmentDTO);
    }


    @Test
    @WithUserDetails(value = "api_user")
    public void createEnvironment() {
        StepVerifier.create(responseEnvironmentDTOMono)
                .assertNext(envDTO -> {
                    assert (envDTO instanceof EnvironmentDTO);
                    assert (envDTO.getName().equals(environmentName));
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getEnvironmentDTO() {

        EnvironmentDTO responseEnvironmentDTO = responseEnvironmentDTOMono.block();
        Mono<EnvironmentDTO> environmentDTOMono = environmentService
                .findEnvironmentByEnvironmentId(responseEnvironmentDTO.getId());

        StepVerifier.create(environmentDTOMono)
                .assertNext(environmentDTO1 -> {
                    assert (environmentDTO1 instanceof EnvironmentDTO);
                    assert (environmentDTO1.getName().equals(environmentName));
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void updateEnvironment() {
        EnvironmentDTO environmentDTO = responseEnvironmentDTOMono.block();

        EnvironmentVariable envVar1 = new EnvironmentVariable();
        envVar1.setName("envVar1");
        envVar1.setValue("someCredential");

        EnvironmentVariable envVar2 = new EnvironmentVariable();
        envVar1.setName("envVar2");
        envVar1.setValue("credential");

        environmentDTO.setEnvironmentVariableList(List.of(envVar1, envVar2));

        Mono<List<EnvironmentDTO>> environmentDTOListMono = environmentService
                .updateEnvironment(List.of(environmentDTO)).collectList();

        StepVerifier.create(environmentDTOListMono)
                .assertNext(environmentDTOList -> {
                    assert (environmentDTOList != null);
                    assert (environmentDTOList.size() == 1);
                    assert (environmentDTOList.get(0).getEnvironmentVariableList() != null);
                    assert (environmentDTOList.get(0).getEnvironmentVariableList().size() == 2);
                    for (EnvironmentVariable envVar : environmentDTOList.get(0).getEnvironmentVariableList()) {
                        assert (envVar != null);
                        assert (envVar instanceof EnvironmentVariable);
                    }
                })
                .verifyComplete();
    }

}
