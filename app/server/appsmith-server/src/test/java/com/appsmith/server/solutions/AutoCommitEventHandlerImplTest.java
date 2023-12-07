package com.appsmith.server.solutions;

import com.appsmith.external.git.GitExecutor;
import com.appsmith.server.configurations.ProjectProperties;
import com.appsmith.server.events.AutoCommitEvent;
import com.appsmith.server.helpers.DSLMigrationUtils;
import com.appsmith.server.helpers.GitFileUtils;
import com.appsmith.server.helpers.RedisUtils;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@Slf4j
@DirtiesContext
public class AutoCommitEventHandlerImplTest {
    @MockBean
    ApplicationEventPublisher applicationEventPublisher;

    @Autowired
    RedisUtils redisUtils;

    @MockBean
    DSLMigrationUtils dslMigrationUtils;

    @MockBean
    GitFileUtils fileUtils;

    @MockBean
    GitExecutor gitExecutor;

    @MockBean
    ProjectProperties projectProperties;

    AutoCommitEventHandler autoCommitEventHandler;

    private static final String defaultApplicationId = "default-app-id", branchName = "develop";

    @BeforeEach
    public void beforeTest() {
        autoCommitEventHandler = new AutoCommitEventHandlerImpl(
                applicationEventPublisher, redisUtils, dslMigrationUtils, fileUtils, gitExecutor, projectProperties);
    }

    @AfterEach
    public void afterTest() {
        redisUtils.finishAutoCommit(defaultApplicationId);
    }

    @Test
    public void handle_WhenAutoCommitAlreadyStarted_ReturnsFalse() {
        AutoCommitEvent autoCommitEvent = new AutoCommitEvent();
        autoCommitEvent.setApplicationId(defaultApplicationId);
        autoCommitEvent.setBranchName(branchName);

        Mockito.when(dslMigrationUtils.getLatestDslVersion()).thenReturn(Mono.just(10));

        Mono<Boolean> map = redisUtils
                .startAutoCommit(defaultApplicationId, branchName)
                .then(autoCommitEventHandler.autoCommitDSLMigration(autoCommitEvent));

        StepVerifier.create(map)
                .assertNext(x -> {
                    assertThat(x).isFalse();
                })
                .verifyComplete();
    }
}
