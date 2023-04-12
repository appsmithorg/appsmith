package com.appsmith.server.services.ee;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.configurations.AirgapInstanceConfig;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.PluginDTO;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.services.PluginService;
import com.appsmith.server.services.WorkspaceService;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.pf4j.PluginManager;
import org.pf4j.PluginWrapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.core.io.ClassPathResource;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import static com.appsmith.external.constants.PluginConstants.PackageName.AMAZON_S3_PLUGIN;
import static com.appsmith.external.constants.PluginConstants.PackageName.DYNAMO_PLUGIN;
import static com.appsmith.external.constants.PluginConstants.PackageName.FIRESTORE_PLUGIN;
import static com.appsmith.external.constants.PluginConstants.PackageName.GOOGLE_SHEETS_PLUGIN;
import static com.appsmith.external.constants.PluginConstants.PackageName.RAPID_API_PLUGIN;
import static com.appsmith.external.constants.PluginConstants.PackageName.REDSHIFT_PLUGIN;
import static com.appsmith.external.constants.PluginConstants.PackageName.SAAS_PLUGIN;
import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@Slf4j
public class PluginServiceTest {

    @Autowired
    PluginRepository pluginRepository;

    @Autowired
    PluginService pluginService;

    @Autowired
    AirgapInstanceConfig airgapInstanceConfig;

    @Autowired
    WorkspaceService workspaceService;

    @MockBean
    PluginManager pluginManager;

    final Set<String> unsupportedPluginPackageNameInAirgap = Set.of(
        SAAS_PLUGIN, RAPID_API_PLUGIN, FIRESTORE_PLUGIN, REDSHIFT_PLUGIN, DYNAMO_PLUGIN,
        AMAZON_S3_PLUGIN, GOOGLE_SHEETS_PLUGIN
    );

    @BeforeEach
    public void setup() throws IOException {
        final ClassPathResource mockEditor = new ClassPathResource("test_assets/PluginServiceTest/mock-editor.json");
        final ClassPathResource mockExample = new ClassPathResource("test_assets/PluginServiceTest/mock-example.json");
        final ClassLoader classLoader = Mockito.mock(ClassLoader.class);
        Mockito.when(classLoader.getResourceAsStream("editor/root.json")).thenReturn(mockEditor.getInputStream());
        Mockito.when(classLoader.getResourceAsStream("editor/mock-example.json")).thenReturn(mockExample.getInputStream());
        final PluginWrapper pluginWrapper = Mockito.mock(PluginWrapper.class);
        Mockito.when(pluginWrapper.getPluginClassLoader()).thenReturn(classLoader);
        Mockito.when(pluginManager.getPlugin(Mockito.anyString())).thenReturn(pluginWrapper);
        Mockito.when(pluginWrapper.getPluginClassLoader()).thenReturn(classLoader);
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testGetAllPluginIconLocation() {
        Map<String, Plugin> pluginMap = pluginRepository.findAll()
                .collectMap(BaseDomain::getId, plugin -> plugin).block();
        List<PluginDTO> pluginDTOList = pluginService.getAllPluginIconLocation().block();

        if (pluginMap != null) {
            assertThat(pluginDTOList.size()).isEqualTo(pluginMap.size());
            for (PluginDTO pluginDTO : pluginDTOList) {
                assertThat(pluginDTO.getIconLocation())
                        .isEqualTo(pluginMap.get(pluginDTO.getId()).getIconLocation());
            }
        }
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testGetPluginIconLocation() {
        Plugin plugin = this.pluginRepository.findAll().blockFirst();
        if (plugin != null) {
            Mono<PluginDTO> pluginDTOMono = this.pluginService.getPluginIconLocation(plugin.getId());

            StepVerifier.create(pluginDTOMono)
                    .assertNext(pluginDTO -> {
                        assertThat(pluginDTO).isNotNull();
                        assertThat(pluginDTO.getId()).isEqualTo(plugin.getId());
                        assertThat(pluginDTO.getIconLocation()).isEqualTo(plugin.getIconLocation());
                    })
                    .verifyComplete();
        }
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getPlugins_airgappedInstance_onlySupportedPluginsAreFetched() {

        airgapInstanceConfig.setAirgapEnabled(true);

        String workspaceName = UUID.randomUUID().toString();
        Workspace workspace = new Workspace();
        workspace.setName(workspaceName);
        workspace.setDomain("example.com");
        workspace.setWebsite("https://example.com");
        workspace.setSlug(workspaceName);

        Mono<List<Plugin>> pluginListMono = workspaceService.create(workspace)
            .flatMapMany(workspace1 -> {
                MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
                params.set(FieldName.WORKSPACE_ID, workspace1.getId());
                return pluginService.get(params);
            })
            .collectList();

        StepVerifier
            .create(pluginListMono)
            .assertNext(plugins -> {
                assertThat(plugins).isNotEmpty();
                List<Plugin> airgappedSupportedPlugins = new ArrayList<>(), nonSupportedPluginForAirgap = new ArrayList<>();
                plugins
                    .forEach(plugin -> {
                        assertThat(plugin.isSupportedForAirGap()).isTrue();
                        assertThat(unsupportedPluginPackageNameInAirgap).doesNotContain(plugin.getPackageName());
                        if (plugin.isSupportedForAirGap()) {
                            airgappedSupportedPlugins.add(plugin);
                        } else {
                            nonSupportedPluginForAirgap.add(plugin);
                        }
                    });
                assertThat(airgappedSupportedPlugins).isNotEmpty();
                assertThat(nonSupportedPluginForAirgap).isEmpty();
            })
            .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getPlugins_nonAirgappedInstance_allPluginsAreFetched() {

        airgapInstanceConfig.setAirgapEnabled(false);

        String workspaceName = UUID.randomUUID().toString();
        Workspace workspace = new Workspace();
        workspace.setName(workspaceName);
        workspace.setDomain("example.com");
        workspace.setWebsite("https://example.com");
        workspace.setSlug(workspaceName);

        Mono<List<Plugin>> pluginListMono = workspaceService.create(workspace)
            .flatMapMany(workspace1 -> {
                MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
                params.set(FieldName.WORKSPACE_ID, workspace1.getId());
                return pluginService.get(params);
            })
            .collectList();

        StepVerifier
            .create(pluginListMono)
            .assertNext(plugins -> {
                assertThat(plugins).isNotEmpty();
                List<Plugin> airgappedSupportedPlugins = new ArrayList<>(), nonSupportedPluginForAirgap = new ArrayList<>();
                plugins
                    .forEach(plugin -> {
                        if (plugin.isSupportedForAirGap()) {
                            airgappedSupportedPlugins.add(plugin);
                        } else {
                            nonSupportedPluginForAirgap.add(plugin);
                        }
                    });
                assertThat(airgappedSupportedPlugins).isNotEmpty();
                assertThat(nonSupportedPluginForAirgap).isNotEmpty();
            })
            .verifyComplete();
    }
}
