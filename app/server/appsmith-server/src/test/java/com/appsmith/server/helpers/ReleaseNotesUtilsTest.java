package com.appsmith.server.helpers;

import com.appsmith.server.configurations.AirgapInstanceConfig;
import com.appsmith.server.dtos.ReleaseNode;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@ExtendWith(SpringExtension.class)
@SpringBootTest
class ReleaseNotesUtilsTest {

    @MockBean
    AirgapInstanceConfig instanceConfig;

    @Autowired
    ReleaseNotesUtils releaseNotesUtils;

    private List<ReleaseNode> releaseNodesCache = null;

    @BeforeEach
    void setup() {
        ReleaseNode releaseNode = new ReleaseNode();
        releaseNode.setTagName("v1.0.0");
        releaseNodesCache = List.of(releaseNode);
    }

    @Test
    void getReleaseNodes_airgappedInstance_returnsEmptyList() {

        Mockito.when(instanceConfig.isAirgapEnabled()).thenReturn(true);
        Mono<List<ReleaseNode>> resultMono = releaseNotesUtils.getReleaseNodes(releaseNodesCache, Instant.now());

        StepVerifier
            .create(resultMono)
            .assertNext(releaseNodes -> Assertions.assertEquals(releaseNodes, new ArrayList<>()))
            .verifyComplete();
    }

    @Test
    void getReleaseNodes_nonAirgappedInstance_returnsNodesFromCEImpl() {

        Mockito.when(instanceConfig.isAirgapEnabled()).thenReturn(false);

        Mono<List<ReleaseNode>> resultMono = releaseNotesUtils.getReleaseNodes(releaseNodesCache, Instant.now().plusSeconds(10));

        StepVerifier
            .create(resultMono)
            .assertNext(releaseNodes -> Assertions.assertEquals(releaseNodes, releaseNodesCache))
            .verifyComplete();
    }
}