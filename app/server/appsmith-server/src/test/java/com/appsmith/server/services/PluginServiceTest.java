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
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
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
/*
 * The ClassMode BEFORE_EACH_TEST_METHOD is required to get the spy pluginService to reset before each test. Else
 * the spies for each test interfere with each other. This increases the test time but unfortunately, that seems to be
 * the only solution for now.
 */
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
public class PluginServiceTest {

    @MockBean
    PluginExecutor pluginExecutor;

    @SpyBean
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
    
    // The datasource form config is mandatory for plugins. Hence we expect an error when that file is not present
    @Test
    public void getPluginFormWithNullFormConfig() {

        Mockito.when(pluginService.loadPluginResource(Mockito.anyString(), eq("form.json")))
                .thenReturn(Mono.error(new AppsmithException(AppsmithError.PLUGIN_LOAD_FORM_JSON_FAIL)));
        Mockito.when(pluginService.loadPluginResource(Mockito.anyString(), eq("editor.json")))
                .thenReturn(Mono.error(new AppsmithException(AppsmithError.PLUGIN_LOAD_FORM_JSON_FAIL)));
        Mockito.when(pluginService.loadPluginResource(Mockito.anyString(), eq("setting.json")))
                .thenReturn(Mono.error(new AppsmithException(AppsmithError.PLUGIN_LOAD_FORM_JSON_FAIL)));
        Mockito.when(pluginService.loadPluginResource(Mockito.anyString(), eq("dependency.json")))
                .thenReturn(Mono.error(new AppsmithException(AppsmithError.PLUGIN_LOAD_FORM_JSON_FAIL)));

        Mono<Map> formConfig = pluginService.getFormConfig("random-plugin-id");

        StepVerifier.create(formConfig)
                .expectError(AppsmithException.class)
                .verify();
    }

    // The editor form config is not mandatory for plugins. The function should return successfully even if it's not present
    @Test
    public void getPluginFormWithNullEditorConfig() {
        Map formMap = new HashMap();
        formMap.put("form", new Object());

        Mockito.when(pluginService.loadPluginResource(Mockito.anyString(), eq("form.json")))
                .thenReturn(Mono.just(formMap));
        Mockito.when(pluginService.loadPluginResource(Mockito.anyString(), eq("editor.json")))
                .thenReturn(Mono.error(new AppsmithException(AppsmithError.PLUGIN_LOAD_FORM_JSON_FAIL)));
        Mockito.when(pluginService.loadPluginResource(Mockito.anyString(), eq("setting.json")))
                .thenReturn(Mono.error(new AppsmithException(AppsmithError.PLUGIN_LOAD_FORM_JSON_FAIL)));
        Mockito.when(pluginService.loadPluginResource(Mockito.anyString(), eq("dependency.json")))
                .thenReturn(Mono.error(new AppsmithException(AppsmithError.PLUGIN_LOAD_FORM_JSON_FAIL)));

        Mono<Map> formConfig = pluginService.getFormConfig("random-plugin-id");
        StepVerifier.create(formConfig)
                .assertNext(form -> {
                    assertThat(form).isNotNull();
                    assertThat(form.get("form")).isNotNull();
                    assertThat(form.get("editor")).isNull();
                    assertThat(form.get("setting")).isNull();
                    assertThat(form.get("dependencies")).isNull();
                })
                .verifyComplete();
    }


    @Test
    public void getPluginFormValid() {
        Map formMap = new HashMap();
        formMap.put("form", new Object());

        Map editorMap = new HashMap();
        editorMap.put("editor", new Object());

        Map settingMap = new HashMap();
        settingMap.put("setting", new Object());

        Map dependencyMap = new HashMap();
        dependencyMap.put("dependencies", new Object());

        Mockito.when(pluginService.loadPluginResource(Mockito.anyString(), eq("form.json")))
                .thenReturn(Mono.just(formMap));
        Mockito.when(pluginService.loadPluginResource(Mockito.anyString(), eq("editor.json")))
                .thenReturn(Mono.just(editorMap));
        Mockito.when(pluginService.loadPluginResource(Mockito.anyString(), eq("setting.json")))
                .thenReturn(Mono.just(settingMap));
        Mockito.when(pluginService.loadPluginResource(Mockito.anyString(), eq("dependency.json")))
                .thenReturn(Mono.just(dependencyMap));

        Mono<Map> formConfig = pluginService.getFormConfig("random-plugin-id");
        StepVerifier.create(formConfig)
                .assertNext(form -> {
                    assertThat(form).isNotNull();
                    assertThat(form.get("form")).isNotNull();
                    assertThat(form.get("editor")).isNotNull();
                    assertThat(form.get("setting")).isNotNull();
                })
                .verifyComplete();
    }
}
