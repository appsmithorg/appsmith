package com.appsmith.server.services.ce;

import com.appsmith.server.domains.Plugin;
import com.appsmith.server.plugins.base.PluginServiceCE;
import com.appsmith.server.plugins.base.PluginServiceCEImpl;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.WorkspaceService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Validator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.pf4j.PluginManager;
import org.pf4j.PluginWrapper;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.core.io.ClassPathResource;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.test.context.junit.jupiter.SpringExtension;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@ExtendWith(SpringExtension.class)
public class PluginServiceCEImplTest {

    @MockBean
    Validator validator;

    @MockBean
    PluginRepository repository;

    @MockBean
    AnalyticsService analyticsService;

    @MockBean
    WorkspaceService workspaceService;

    @MockBean
    PluginManager pluginManager;

    @MockBean
    ReactiveRedisTemplate<String, String> reactiveTemplate;

    @MockBean
    ChannelTopic topic;

    ObjectMapper objectMapper;

    PluginServiceCE pluginService;

    @BeforeEach
    public void setUp() {
        objectMapper = new ObjectMapper();
        pluginService = new PluginServiceCEImpl(
                validator,
                repository,
                analyticsService,
                workspaceService,
                pluginManager,
                reactiveTemplate,
                topic,
                objectMapper);
    }

    @Test
    public void testLoadEditorPluginResourceUqi_withMockPlugin_returnsValidEditorConfig() throws IOException {
        final ClassPathResource mockEditor = new ClassPathResource("test_assets/PluginServiceTest/mock-editor.json");
        final ClassPathResource mockExample = new ClassPathResource("test_assets/PluginServiceTest/mock-example.json");
        final ClassLoader classLoader = Mockito.mock(ClassLoader.class);
        Mockito.when(classLoader.getResourceAsStream("editor/root.json")).thenReturn(mockEditor.getInputStream());
        Mockito.when(classLoader.getResourceAsStream("editor/mock-example.json"))
                .thenReturn(mockExample.getInputStream());
        final PluginWrapper pluginWrapper = Mockito.mock(PluginWrapper.class);
        Mockito.when(pluginWrapper.getPluginClassLoader()).thenReturn(classLoader);
        Mockito.when(pluginManager.getPlugin("test-plugin")).thenReturn(pluginWrapper);
        Plugin plugin = new Plugin();
        plugin.setPackageName("test-plugin");
        final Map<?, ?> editorMap = pluginService.loadEditorPluginResourceUqi(plugin);

        // Test that config is a map with a key 'editor', which is a list
        assertNotNull(editorMap);
        final Object editor = editorMap.get("editor");
        assertTrue(editor instanceof List);

        // Test that first element of editor is exactly the same as the json defined in the root json
        final Map<?, ?> mockerEditorMap = objectMapper.readValue(mockEditor.getFile(), Map.class);
        final List expectedSelectorSection = (List) mockerEditorMap.get("editor");
        assertEquals(expectedSelectorSection.get(0), ((List<?>) editor).get(0));

        // Test that second element is the template's section wrapper
        final Object templates = ((List<?>) editor).get(1);
        assertTrue(templates instanceof Map);

        final LinkedHashMap<?, ?> templatesMap = (LinkedHashMap<?, ?>) templates;
        assertEquals("SECTION", templatesMap.get("controlType"));
        assertTrue(templatesMap.containsKey("children"));

        // Test that the children of template section is exactly the same as the example template file
        final Object templateChildren = templatesMap.get("children");
        assertTrue(templateChildren instanceof List);
        final List<?> templateChildrenList = (List<?>) templateChildren;
        assertEquals(1, templateChildrenList.size());

        final Map<?, ?> expectedChildrenSection = objectMapper.readValue(mockExample.getFile(), Map.class);
        assertEquals(expectedChildrenSection, templateChildrenList.get(0));
    }
}
