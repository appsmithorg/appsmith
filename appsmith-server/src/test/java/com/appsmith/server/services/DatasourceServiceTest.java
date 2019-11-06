package com.appsmith.server.services;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Datasource;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import lombok.extern.slf4j.Slf4j;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.junit4.SpringRunner;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import static org.assertj.core.api.Assertions.assertThat;

@RunWith(SpringRunner.class)
@SpringBootTest
@Slf4j
public class DatasourceServiceTest {

    @Autowired
    DatasourceService datasourceService;

    @Autowired
    PluginService pluginService;

    @Before
    public void setup() {
    }

    @Test
    @WithMockUser(username = "api_user")
    public void createDatasourceWithNullPluginId() {
        Datasource datasource = new Datasource();
        Mono<Datasource> datasourceMono = Mono.just(datasource)
                .flatMap(datasourceService::create);
        StepVerifier
                .create(datasourceMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.PLUGIN_ID_NOT_GIVEN.getMessage()))
                .verify();
    }

    @Test
    @WithMockUser(username = "api_user")
    public void createDatasourceWithId() {
        Datasource datasource = new Datasource();
        datasource.setId("randomId");
        Mono<Datasource> datasourceMono = Mono.just(datasource)
                .flatMap(datasourceService::create);
        StepVerifier
                .create(datasourceMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.ID)))
                .verify();
    }

    @Test
    @WithMockUser(username = "api_user")
    public void createDatasourceNotInstalledPlugin() {
        Mono<Plugin> pluginMono = pluginService.findByName("Not Installed Plugin Name");
        Datasource datasource = new Datasource();

        Mono<Datasource> datasourceMono = pluginMono.map(plugin -> {
            datasource.setPluginId(plugin.getId());
            return datasource;
        }).flatMap(datasourceService::create);

        StepVerifier
                .create(datasourceMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        ((AppsmithException) throwable).getError().equals(AppsmithError.PLUGIN_NOT_INSTALLED))
                .verify();
    }

    @Test
    @WithMockUser(username = "api_user")
    public void createDatasourceValid() {
        Mono<Plugin> pluginMono = pluginService.findByName("Installed Plugin Name");
        Datasource datasource = new Datasource();
        datasource.setName("test datasource name");
        Mono<Datasource> datasourceMono = pluginMono.map(plugin -> {
            datasource.setPluginId(plugin.getId());
            return datasource;
        }).flatMap(datasourceService::create);

        StepVerifier
                .create(datasourceMono)
                .assertNext(createdDatasource -> {
                    assertThat(createdDatasource.getId()).isNotEmpty();
                    assertThat(createdDatasource.getPluginId()).isEqualTo(datasource.getPluginId());
                    assertThat(createdDatasource.getName()).isEqualTo(datasource.getName());
                })
                .verifyComplete();
    }
}
