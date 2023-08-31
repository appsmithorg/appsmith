package com.appsmith.server.helpers.ce;

import com.appsmith.server.helpers.GitCloudServicesUtils;
import com.appsmith.server.helpers.GitPrivateRepoHelper;
import com.appsmith.server.services.ApplicationService;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyString;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@Slf4j
@DirtiesContext
public class GitPrivateRepoCEImplTest {

    @Autowired
    GitPrivateRepoHelper gitPrivateRepoHelper;

    @MockBean
    GitCloudServicesUtils gitCloudServicesUtils;

    @MockBean
    ApplicationService applicationService;

    @BeforeEach
    void setup() {
        Mockito.when(gitCloudServicesUtils.getPrivateRepoLimitForOrg(anyString(), anyBoolean()))
                .thenReturn(Mono.just(3));
    }

    @Test
    public void isRepoLimitReached_connectedAppCountIsLessThanLimit_Success() {

        Mockito.when(applicationService.getGitConnectedApplicationsCountWithPrivateRepoByWorkspaceId(anyString()))
                .thenReturn(Mono.just(1L));

        StepVerifier.create(gitPrivateRepoHelper.isRepoLimitReached("workspaceId", false))
                .assertNext(aBoolean -> assertEquals(false, aBoolean))
                .verifyComplete();
    }

    @Test
    public void isRepoLimitReached_connectedAppCountIsSameAsLimit_Success() {

        Mockito.when(applicationService.getGitConnectedApplicationsCountWithPrivateRepoByWorkspaceId(anyString()))
                .thenReturn(Mono.just(3L));

        StepVerifier.create(gitPrivateRepoHelper.isRepoLimitReached("workspaceId", true))
                .assertNext(aBoolean -> assertEquals(true, aBoolean))
                .verifyComplete();
    }

    // This test is to check if the limit is reached when the count of connected apps is more than the limit
    // This happens when public visible git repo is synced with application and then the visibility is changed
    @Test
    public void isRepoLimitReached_connectedAppCountIsMoreThanLimit_Success() {

        Mockito.when(applicationService.getGitConnectedApplicationsCountWithPrivateRepoByWorkspaceId(anyString()))
                .thenReturn(Mono.just(4L));

        StepVerifier.create(gitPrivateRepoHelper.isRepoLimitReached("workspaceId", false))
                .assertNext(aBoolean -> assertEquals(true, aBoolean))
                .verifyComplete();
    }
}
