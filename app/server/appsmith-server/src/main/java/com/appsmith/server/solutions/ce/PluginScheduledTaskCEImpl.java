package com.appsmith.server.solutions.ce;

import com.appsmith.server.helpers.PluginScheduledTaskUtils;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import reactor.core.scheduler.Schedulers;

import java.time.Instant;

/**
 * This class represents a scheduled task that pings cloud services for any updates in available plugins.
 */
@Slf4j
@RequiredArgsConstructor
public class PluginScheduledTaskCEImpl implements PluginScheduledTaskCE {

    private final PluginScheduledTaskUtils pluginScheduledTaskUtils;

    private Instant lastUpdatedAt = null;

    // Number of milliseconds between the start of each scheduled calls to this method.
    @Scheduled(initialDelay = 30 * 1000 /* 30 seconds */, fixedRate = 2 * 60 * 60 * 1000 /* two hours */)
    public void updateRemotePlugins() {
        // Moving the fetch and update remote plugins to helper classes to have custom implementation for business
        // edition
        pluginScheduledTaskUtils
                .fetchAndUpdateRemotePlugins(lastUpdatedAt)
                // Set new updated time
                .doOnSuccess(success -> this.lastUpdatedAt = Instant.now())
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
