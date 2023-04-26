package com.appsmith.server.helpers;

import com.appsmith.server.configurations.AirgapInstanceConfig;
import lombok.RequiredArgsConstructor;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

@SpringBootTest
@RequiredArgsConstructor
class NetworkUtilsTest {

    private final AirgapInstanceConfig airgapInstanceConfig = new AirgapInstanceConfig();

    @Test
    void getExternalAddress_airgapEnabled_returnUnknownIP() {
        airgapInstanceConfig.setAirgapEnabled(true);
        NetworkUtils networkUtils = new NetworkUtils(airgapInstanceConfig);
        Mono<String> ipMono = networkUtils.getExternalAddress();
        StepVerifier
            .create(ipMono)
            .expectNext("unknown")
            .verifyComplete();
    }
}