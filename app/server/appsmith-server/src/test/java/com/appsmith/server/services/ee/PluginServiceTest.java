package com.appsmith.server.services.ee;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.dtos.PluginDTO;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.services.PluginService;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@Slf4j
public class PluginServiceTest {

    @Autowired
    PluginRepository pluginRepository;

    @Autowired
    PluginService pluginService;

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
}
