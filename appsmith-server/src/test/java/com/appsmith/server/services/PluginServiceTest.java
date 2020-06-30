package com.appsmith.server.services;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.plugins.PluginExecutor;
import lombok.extern.slf4j.Slf4j;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mockito;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit4.SpringRunner;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import static org.assertj.core.api.Assertions.assertThat;

@RunWith(SpringRunner.class)
@SpringBootTest
@Slf4j
@DirtiesContext
public class PluginServiceTest {

    @MockBean
    PluginExecutor pluginExecutor;

    @Before
    public void setup() {
        Mockito.when(this.pluginExecutor.execute(Mockito.any(), Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(new ActionExecutionResult()));
    }

    @Test
    public void checkPluginExecutor() {
        Mono<Object> executeMono = pluginExecutor.execute(new Object(), new DatasourceConfiguration(), new ActionConfiguration());

        StepVerifier
                .create(executeMono)
                .assertNext(result -> {
                    assertThat(result).isInstanceOf(ActionExecutionResult.class);
                })
                .verifyComplete();
    }
}
