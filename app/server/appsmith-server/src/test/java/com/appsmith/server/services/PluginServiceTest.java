package com.appsmith.server.services;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import lombok.extern.slf4j.Slf4j;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit4.SpringRunner;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;

@RunWith(SpringRunner.class)
@SpringBootTest
@Slf4j
@DirtiesContext
public class PluginServiceTest {

    @MockBean
    PluginExecutor pluginExecutor;

    @Autowired
    PluginService pluginService;

    @Before
    public void setup() {
        Mockito.when(this.pluginExecutor.execute(Mockito.any(), Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(new ActionExecutionResult()));
    }

    @Test
    public void checkPluginExecutor() {
        Mono<ActionExecutionResult> executeMono = pluginExecutor.execute(new Object(), new DatasourceConfiguration(), new ActionConfiguration());

        StepVerifier
                .create(executeMono)
                .assertNext(result -> {
                    assertThat(result).isInstanceOf(ActionExecutionResult.class);
                })
                .verifyComplete();
    }

    /*
     * The Mockito.spy used in the tests below is not implemented correctly. The spies seem to be sharing data across the
     * tests. Refer to: https://dzone.com/articles/how-to-mock-spring-bean-version-2 on implementing this correctly
     */
    
    // The datasource form config is mandatory for plugins. Hence we expect an error when that file is not present
    @Test
    public void getPluginFormWithNullFormConfig() {
        PluginService pluginSpy = Mockito.spy(pluginService);

        Mockito.when(pluginSpy.loadPluginResource(Mockito.anyString(), eq("form.json")))
                .thenReturn(Mono.error(new AppsmithException(AppsmithError.PLUGIN_LOAD_FORM_JSON_FAIL)));
        Mockito.when(pluginSpy.loadPluginResource(Mockito.anyString(), eq("editor.json")))
                .thenReturn(Mono.error(new AppsmithException(AppsmithError.PLUGIN_LOAD_FORM_JSON_FAIL)));

        Mono<Map> formConfig = pluginSpy.getFormConfig("random-plugin-id");
        StepVerifier.create(formConfig)
                .expectError(AppsmithException.class)
                .verify();
    }

    // The editor form config is not mandatory for plugins. The function should return successfully even if it's not present
    @Test
    public void getPluginFormWithNullEditorConfig() {
        PluginService pluginSpy = Mockito.spy(pluginService);

        Map formMap = new HashMap();
        formMap.put("form", new Object());

        Mockito.when(pluginSpy.loadPluginResource(Mockito.anyString(), eq("form.json")))
                .thenReturn(Mono.just(formMap));
        Mockito.when(pluginSpy.loadPluginResource(Mockito.anyString(), eq("editor.json")))
                .thenReturn(Mono.error(new AppsmithException(AppsmithError.PLUGIN_LOAD_FORM_JSON_FAIL)));

        Mono<Map> formConfig = pluginSpy.getFormConfig("random-plugin-id");
        StepVerifier.create(formConfig)
                .assertNext(form -> {
                    assertThat(form).isNotNull();
                    assertThat(form.get("form")).isNotNull();
                    assertThat(form.get("editor")).isNull();
                })
                .verifyComplete();
    }
}
