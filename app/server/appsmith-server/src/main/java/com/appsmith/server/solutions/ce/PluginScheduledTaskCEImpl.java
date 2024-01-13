package com.appsmith.server.solutions.ce;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Config;
import com.appsmith.server.helpers.PluginScheduledTaskUtils;
import com.appsmith.server.services.ConfigService;
import io.micrometer.observation.annotation.Observed;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONObject;
import org.springframework.scheduling.annotation.Scheduled;
import reactor.core.scheduler.Schedulers;

import java.time.Instant;
import java.util.Date;
import java.util.Map;

/**
 * This class represents a scheduled task that pings cloud services for any updates in available plugins.
 */
@Slf4j
@RequiredArgsConstructor
public class PluginScheduledTaskCEImpl implements PluginScheduledTaskCE {

    private final PluginScheduledTaskUtils pluginScheduledTaskUtils;
    private final ConfigService configService;

    // Number of milliseconds between the start of each scheduled calls to this method.
    @Scheduled(initialDelay = 30 * 1000 /* 30 seconds */, fixedRate = 2 * 60 * 60 * 1000 /* two hours */)
    @Observed(name = "updateRemotePlugins")
    public void updateRemotePlugins() {
        // Moving the fetch and update remote plugins to helper classes to have custom implementation for business
        // edition
        configService
                .getByName(FieldName.REMOTE_PLUGINS)
                .onErrorReturn(new Config())
                .flatMap(config -> {
                    JSONObject config1 = config.getConfig();
                    Instant lastUpdatedAt = null;

                    if (config1 != null) {
                        Object tempUpdatedAt = config1.getOrDefault(FieldName.UPDATED_AT, null);
                        if (tempUpdatedAt != null) {
                            lastUpdatedAt = ((Date) tempUpdatedAt).toInstant();
                        }
                    }
                    return pluginScheduledTaskUtils.fetchAndUpdateRemotePlugins(lastUpdatedAt);
                })
                // Set new updated time
                .flatMap(success -> {
                    Config config = new Config(
                            new JSONObject(Map.of(FieldName.UPDATED_AT, Instant.now())), FieldName.REMOTE_PLUGINS);
                    return configService.save(config);
                })
                .subscribeOn(Schedulers.single())
                .subscribe();
    }

    @AllArgsConstructor
    @Getter
    @EqualsAndHashCode
    public static class PluginIdentifier {
        String pluginName;
        String version;
    }
}
