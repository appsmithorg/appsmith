package com.appsmith.server.fork;

import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.fork.internal.ApplicationForkingService;
import com.appsmith.server.layouts.UpdateLayoutService;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.EnvironmentPermission;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithUserDetails;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@Slf4j
@SpringBootTest
public class ForkingServiceTest {

    @Autowired
    private ApplicationForkingService applicationForkingService;

    @Autowired
    private WorkspaceService workspaceService;

    @Autowired
    private ApplicationPageService applicationPageService;

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private EnvironmentPermission environmentPermission;

    @MockBean
    private UpdateLayoutService updateLayoutService;

    @Test
    @WithUserDetails(value = "api_user")
    public void cloneApplication_whenDslParsingFails_shouldSucceed() {
        Workspace originalWorkspace = new Workspace();
        originalWorkspace.setName("Source Org Test");
        Workspace sourceWorkspace = workspaceService.create(originalWorkspace).block();

        Application app1 = new Application();
        app1.setName("awesome app 123");
        app1.setWorkspaceId(sourceWorkspace.getId());
        Application sourceApplication =
                applicationPageService.createApplication(app1).block();
        final String appId = sourceApplication.getId();
        final String appName = sourceApplication.getName();

        Mockito.when(updateLayoutService.updatePageLayoutsByPageId(Mockito.anyString()))
                .thenThrow(new AppsmithException(AppsmithError.INVALID_DYNAMIC_BINDING_REFERENCE));

        Workspace newWorkspace = new Workspace();
        newWorkspace.setName("Target Org Test");
        Workspace targetWorkspace = workspaceService.create(newWorkspace).block();
        String sourceEnvironmentId = workspaceService
                .getDefaultEnvironmentId(sourceWorkspace.getId(), environmentPermission.getExecutePermission())
                .block();

        Mono<Void> cloneMono = Mono.just(sourceApplication)
                .map(sourceApplication1 -> {
                    sourceApplication1.setName(appName);
                    sourceApplication1.setId(appId);
                    return sourceApplication1;
                })
                .flatMap(sourceApplication1 -> applicationForkingService.forkApplications(
                        targetWorkspace.getId(), sourceApplication1, sourceEnvironmentId))
                .then();

        Mono<List<String>> resultMono = cloneMono
                .thenMany(applicationRepository.findByWorkspaceId(targetWorkspace.getId()))
                .map(Application::getName)
                .collectList();

        StepVerifier.create(resultMono)
                .assertNext(names -> {
                    assertThat(names).hasSize(1);
                })
                .verifyComplete();
    }
}
