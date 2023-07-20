package com.appsmith.server.helpers;

import com.appsmith.server.domains.Config;
import com.appsmith.server.enums.ProvisionStatus;
import com.appsmith.server.repositories.ConfigRepository;
import lombok.AllArgsConstructor;
import net.minidev.json.JSONObject;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.time.Instant;

import static com.appsmith.server.constants.FieldName.PROVISIONING_LAST_UPDATED_AT;
import static com.appsmith.server.constants.FieldName.PROVISIONING_STATUS;
import static com.appsmith.server.constants.FieldName.PROVISIONING_STATUS_CONFIG;
import static com.appsmith.server.enums.ProvisionStatus.INACTIVE;

@AllArgsConstructor
@Component
public class ProvisionUtils {

    private final ConfigRepository configRepository;

    public Mono<Boolean> updateProvisioningStatus(ProvisionStatus provisionStatus) {
        Mono<Config> updateProvisioningStatusConfigMono = getOrCreateProvisioningStatusConfig()
                .flatMap(provisionStatusConfig -> {
                    JSONObject config = new JSONObject();
                    config.put(PROVISIONING_STATUS, provisionStatus.getValue());
                    config.put(PROVISIONING_LAST_UPDATED_AT, Instant.now().toString());
                    provisionStatusConfig.setConfig(config);
                    return configRepository.save(provisionStatusConfig);
                });

        return updateProvisioningStatusConfigMono.thenReturn(Boolean.TRUE);
    }

    public Mono<Config> getOrCreateProvisioningStatusConfig() {
        return configRepository.findByName(PROVISIONING_STATUS_CONFIG).switchIfEmpty(Mono.defer(() -> {
            Config provisioningStatusConfig = new Config();
            provisioningStatusConfig.setName(PROVISIONING_STATUS_CONFIG);
            JSONObject config = new JSONObject();
            config.put(PROVISIONING_STATUS, INACTIVE.getValue());
            config.put(PROVISIONING_LAST_UPDATED_AT, Instant.now().toString());
            provisioningStatusConfig.setConfig(config);
            return configRepository.save(provisioningStatusConfig);
        }));
    }
}
