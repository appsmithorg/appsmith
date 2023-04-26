package com.appsmith.server.helpers;

import com.appsmith.server.configurations.AirgapInstanceConfig;
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

@ExtendWith(SpringExtension.class)
@SpringBootTest
class PluginScheduledTaskUtilsTest {

    @MockBean
    AirgapInstanceConfig instanceConfig;

    @Autowired
    PluginScheduledTaskUtils pluginUtils;

    @Test
    public void fetchAndUpdateRemotePlugins_airgappedInstance_returnsEmptyList() {
        Mockito.when(instanceConfig.isAirgapEnabled()).thenReturn(true);
        Mono<Void> resultMono = pluginUtils.fetchAndUpdateRemotePlugins(Instant.now());

        StepVerifier
            .create(resultMono)
            .verifyComplete();
    }

    @Test
    public void fetchAndUpdateRemotePlugins_nonAirgappedInstance_returnsEmptyListFromCE() {
        Mockito.when(instanceConfig.isAirgapEnabled()).thenReturn(false);
        Mono<Void> resultMono = pluginUtils.fetchAndUpdateRemotePlugins(Instant.now());

        StepVerifier
            .create(resultMono)
            .verifyComplete();
    }

}