package com.appsmith.server.services;


import com.appsmith.server.domains.Workspace;
import com.appsmith.server.domains.User;
import com.appsmith.server.repositories.EnvironmentVariableRepository;
import com.appsmith.server.repositories.EnvironmentRepository;
import com.appsmith.server.dtos.EnvironmentDTO;
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


    private Workspace workspace;
    private static final String environmentName = "Staging";

    @BeforeEach
    public void setup() {
        Mono<User> userMono = userRepository.findByEmail("api_user").cache();
        workspace = userMono.flatMap(user -> workspaceService.createDefault(new Workspace(), user)).switchIfEmpty(Mono.error(new Exception("createDefault is returning empty!!"))).block();
    }


    @Test
    @WithUserDetails(value = "api_user")
    public void createEnvironment() {

        Mockito.when(workspaceService.findById(Mockito.any(), Mockito.any())).thenReturn(Mono.just(workspace));

        EnvironmentDTO environmentDTO = new EnvironmentDTO();
        environmentDTO.setName(environmentName);
        environmentDTO.setWorkspaceId(workspace.getId());

        Mono<EnvironmentDTO> environmentDTOMono = environmentService.createNewEnvironment(environmentDTO);

        StepVerifier.create(environmentDTOMono).assertNext(envDTO -> {
            assert (envDTO instanceof EnvironmentDTO);
            assert (envDTO.getName().equals(environmentName));
        }).verifyComplete();


    }

}
