package com.appsmith.server.services.ee;

import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.services.GitService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.test.StepVerifier;

import jakarta.validation.Validator;

import static org.junit.jupiter.api.Assertions.assertEquals;

@ExtendWith(SpringExtension.class)
@Slf4j
@SpringBootTest
public class GitServiceImplTest {

    @Autowired
    GitService gitService;

    @SpyBean
    CommonConfig commonConfig;

    @MockBean
    Scheduler scheduler;
    @MockBean
    Validator validator;
    @MockBean
    ObjectMapper objectMapper;

    // For self hosted Appsmith EE images
    @Test
    public void isRepoLimitReached_anyState_alwaysFalse() {
        Mockito.when(commonConfig.isCloudHosting()).thenReturn(false);
        StepVerifier
                .create(gitService.isRepoLimitReached(null, null))
                .assertNext(isRepoLimit -> assertEquals(false, isRepoLimit))
                .verifyComplete();

        StepVerifier
                .create(gitService.isRepoLimitReached("", true))
                .assertNext(isRepoLimit -> assertEquals(false, isRepoLimit))
                .verifyComplete();

        StepVerifier
                .create(gitService.isRepoLimitReached("workspaceId", false))
                .assertNext(isRepoLimit -> assertEquals(false, isRepoLimit))
                .verifyComplete();
    }

    @Test
    public void isRepoLimitReached_AppsmithCloudRunningEEImage_hasLimitOnRepoCount() {
        Mockito.when(commonConfig.isCloudHosting()).thenReturn(true);

        // False because there are no git connected apps
        GitService gitService1 = Mockito.spy(gitService);
        Mockito.doReturn(Mono.just(Boolean.FALSE)).when(gitService1).isRepoLimitReached(Mockito.anyString(), Mockito.anyBoolean());

        StepVerifier
                .create(gitService1.isRepoLimitReached("", false))
                .assertNext(isRepoLimit -> assertEquals(false, isRepoLimit))
                .verifyComplete();

        // Connect 3 private repos
        GitService gitService2 = Mockito.spy(gitService);
        Mockito.doReturn(Mono.just(Boolean.TRUE)).when(gitService2).isRepoLimitReached(Mockito.anyString(), Mockito.anyBoolean());

        StepVerifier
                .create(gitService2.isRepoLimitReached("", false))
                .assertNext(isRepoLimit -> assertEquals(true, isRepoLimit))
                .verifyComplete();
    }
}
