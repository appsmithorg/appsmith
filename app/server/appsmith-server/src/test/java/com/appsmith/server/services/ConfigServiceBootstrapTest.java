package com.appsmith.server.services;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Config;
import com.appsmith.server.repositories.ConfigRepository;
import net.minidev.json.JSONObject;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import reactor.test.StepVerifier;

import static com.appsmith.server.constants.ce.FieldNameCE.BOOTSTRAP_COMPLETED;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class ConfigServiceBootstrapTest {

    @Autowired
    private ConfigService configService;

    @Autowired
    private ConfigRepository configRepository;

    @Test
    void isBootstrapCompleted_WhenFlagIsTrue_ReturnsTrue() {
        configRepository.findByName(FieldName.INSTANCE_CONFIG)
                .flatMap(config -> {
                    config.getConfig().put(BOOTSTRAP_COMPLETED, true);
                    return configRepository.save(config);
                })
                .block();

        StepVerifier.create(configService.isBootstrapCompleted())
                .assertNext(completed -> assertThat(completed).isTrue())
                .verifyComplete();
    }

    @Test
    void markBootstrapCompleted_SetsFlag() {
        configRepository.findByName(FieldName.INSTANCE_CONFIG)
                .flatMap(config -> {
                    config.getConfig().remove(BOOTSTRAP_COMPLETED);
                    return configRepository.save(config);
                })
                .block();

        StepVerifier.create(configService.markBootstrapCompleted()
                        .then(configService.isBootstrapCompleted()))
                .assertNext(completed -> assertThat(completed).isTrue())
                .verifyComplete();
    }

    @Test
    void markBootstrapCompleted_PersistsFlagInConfig() {
        StepVerifier.create(
                        configService.markBootstrapCompleted()
                                .then(configService.getByName(FieldName.INSTANCE_CONFIG)))
                .assertNext(config -> {
                    Object flag = config.getConfig().get(BOOTSTRAP_COMPLETED);
                    assertThat(flag).isEqualTo(true);
                })
                .verifyComplete();
    }
}
