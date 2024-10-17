package com.appsmith.server.connectionpoolconfig.configurations;

import com.appsmith.external.configurations.connectionpool.ConnectionPoolConfig;
import com.appsmith.server.extensions.AfterAllCleanUpExtension;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ExtendWith(AfterAllCleanUpExtension.class)
public class ConnectionPoolConfigCETest {

    @Autowired
    ConnectionPoolConfig connectionPoolConfig;

    @Test
    public void verifyGetMaxConnectionPoolSizeProvidesDefaultValue() {
        // this is same as default
        Integer connectionPoolMaxSize = 5;

        Mono<Integer> connectionPoolMaxSizeMono = connectionPoolConfig.getMaxConnectionPoolSize();
        StepVerifier.create(connectionPoolMaxSizeMono).assertNext(poolSize -> {
            assertThat(poolSize).isEqualTo(connectionPoolMaxSize);
        });
    }
}
