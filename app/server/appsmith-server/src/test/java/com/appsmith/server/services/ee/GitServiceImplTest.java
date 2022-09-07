package com.appsmith.server.services.ee;

import com.appsmith.server.services.GitService;
import lombok.extern.slf4j.Slf4j;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit4.SpringRunner;
import reactor.test.StepVerifier;

import static org.junit.Assert.assertEquals;

@RunWith(SpringRunner.class)
@Slf4j
@SpringBootTest
public class GitServiceImplTest {

    @Autowired
    GitService gitService;

    @Test
    public void isRepoLimitReached_anyState_alwaysFalse() {
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
}
