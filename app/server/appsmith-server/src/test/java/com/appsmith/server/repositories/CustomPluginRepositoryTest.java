package com.appsmith.server.repositories;

import com.appsmith.server.domains.Plugin;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit4.SpringRunner;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@RunWith(SpringRunner.class)
public class CustomPluginRepositoryTest {

    @Autowired
    PluginRepository pluginRepository;

    @Test
    public void findDefaultPluginIcons_WhenResultFound_OnlyDefaultInstallPluginsReturned() {
        String randomPackageId = "plugin-" + UUID.randomUUID().toString();
        Plugin plugin = new Plugin();
        plugin.setPackageName(randomPackageId);
        plugin.setDefaultInstall(false);
        plugin.setName("My Plugin");

        Mono<List<Plugin>> pluginListMono = pluginRepository.save(plugin).then(
                pluginRepository.findDefaultPluginIcons().collectList()
        );
        StepVerifier.create(pluginListMono).assertNext(plugins -> {
            Optional<Plugin> createdPlugin = plugins.stream().filter(p -> p.getPackageName().equals(randomPackageId))
                    .findAny();
            assertThat(createdPlugin.isPresent()).isFalse();
        }).verifyComplete();
    }
}