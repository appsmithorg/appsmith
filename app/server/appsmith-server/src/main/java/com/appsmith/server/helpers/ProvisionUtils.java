package com.appsmith.server.helpers;

import com.appsmith.server.domains.Config;
import com.appsmith.server.enums.ProvisionStatus;
import com.appsmith.server.repositories.ConfigRepository;
import lombok.AllArgsConstructor;
import net.minidev.json.JSONObject;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.time.Instant;

import static com.appsmith.server.constants.FieldName.CONFIGURED_STATUS;
import static com.appsmith.server.constants.FieldName.PROVISIONING_LAST_UPDATED_AT;
import static com.appsmith.server.constants.FieldName.PROVISIONING_STATUS;
import static com.appsmith.server.constants.FieldName.PROVISIONING_STATUS_CONFIG;
import static com.appsmith.server.enums.ProvisionStatus.INACTIVE;

@AllArgsConstructor
@Component
public class ProvisionUtils {

    private final ConfigRepository configRepository;

    public Mono<Boolean> updateStatus(ProvisionStatus provisionStatus, Boolean configuredStatus) {
        Mono<Config> updateStatusConfigMono = getOrCreateProvisioningStatusConfig()
                .flatMap(provisionStatusConfig -> {
                    JSONObject config = new JSONObject();
                    config.put(PROVISIONING_STATUS, provisionStatus.getValue());
                    config.put(CONFIGURED_STATUS, configuredStatus);
                    config.put(PROVISIONING_LAST_UPDATED_AT, Instant.now().toString());
                    provisionStatusConfig.setConfig(config);
                    return configRepository.save(provisionStatusConfig);
                });

        return updateStatusConfigMono.thenReturn(Boolean.TRUE);
    }

    public Mono<Boolean> updateConfiguredStatus(Boolean configuredStatus) {
        Mono<Config> updateStatusConfigMono = getOrCreateProvisioningStatusConfig()
                .flatMap(provisionStatusConfig -> {
                    JSONObject config = new JSONObject();
                    config.put(
                            PROVISIONING_STATUS,
                            provisionStatusConfig.getConfig().get(PROVISIONING_STATUS));
                    config.put(CONFIGURED_STATUS, configuredStatus);
                    config.put(PROVISIONING_LAST_UPDATED_AT, Instant.now().toString());
                    provisionStatusConfig.setConfig(config);
                    return configRepository.save(provisionStatusConfig);
                });

        return updateStatusConfigMono.thenReturn(Boolean.TRUE);
    }

    public Mono<Boolean> updateProvisioningStatus(ProvisionStatus provisionStatus) {
        Mono<Config> updateStatusConfigMono = getOrCreateProvisioningStatusConfig()
                .flatMap(provisionStatusConfig -> {
                    JSONObject config = new JSONObject();
                    config.put(PROVISIONING_STATUS, provisionStatus.getValue());
                    config.put(
                            CONFIGURED_STATUS, provisionStatusConfig.getConfig().get(CONFIGURED_STATUS));
                    config.put(PROVISIONING_LAST_UPDATED_AT, Instant.now().toString());
                    provisionStatusConfig.setConfig(config);
                    return configRepository.save(provisionStatusConfig);
                });

        return updateStatusConfigMono.thenReturn(Boolean.TRUE);
    }

    public Mono<Config> getOrCreateProvisioningStatusConfig() {
        return configRepository.findByName(PROVISIONING_STATUS_CONFIG).switchIfEmpty(Mono.defer(() -> {
            Config provisioningStatusConfig = generateConfigObject(INACTIVE, Boolean.FALSE);
            return configRepository.save(provisioningStatusConfig);
        }));
    }

    public Config generateConfigObject(ProvisionStatus provisioningStatus, Boolean configuredStatus) {
        Config provisioningStatusConfig = new Config();
        provisioningStatusConfig.setName(PROVISIONING_STATUS_CONFIG);
        JSONObject config = new JSONObject();
        config.put(PROVISIONING_STATUS, provisioningStatus.getValue());
        config.put(CONFIGURED_STATUS, configuredStatus);
        config.put(PROVISIONING_LAST_UPDATED_AT, Instant.now().toString());
        provisioningStatusConfig.setConfig(config);
        return provisioningStatusConfig;
    }
}
