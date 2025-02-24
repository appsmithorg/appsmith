package com.appsmith.server.configurations;

import com.appsmith.server.constants.Appsmith;
import com.appsmith.server.helpers.InstanceConfigHelper;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.appsmith.server.services.ConfigService;
import io.micrometer.observation.annotation.Observed;
import io.sentry.Sentry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static java.lang.Boolean.TRUE;

@Slf4j
@RequiredArgsConstructor
@Component
@Observed(name = "serverStartup")
public class InstanceConfig implements ApplicationListener<ApplicationReadyEvent> {

    private final ConfigService configService;

    private final CacheableRepositoryHelper cacheableRepositoryHelper;

    private final InstanceConfigHelper instanceConfigHelper;

    private static final String WWW_PATH = System.getenv("WWW_PATH");

    @Override
    public void onApplicationEvent(ApplicationReadyEvent applicationReadyEvent) {
        if (WWW_PATH != null) {
            try {
                // Delete the loading.html file if it exists.
                Files.deleteIfExists(Path.of(WWW_PATH + "/loading.html"));
            } catch (IOException e) {
                log.error("Error deleting loading.html file: {}", e.getMessage());
            }
        }

        Mono<Void> registrationAndRtsCheckMono = configService
                .getByName(Appsmith.APPSMITH_REGISTERED)
                .filter(config -> TRUE.equals(config.getConfig().get("value")))
                .switchIfEmpty(Mono.defer(instanceConfigHelper::registerInstance))
                .onErrorResume(errorSignal -> {
                    log.debug("Instance registration failed with error: \n{}", errorSignal.getMessage());
                    return Mono.empty();
                })
                .then(instanceConfigHelper.performRtsHealthCheck());

        Mono<?> startupProcess = instanceConfigHelper
                .checkMongoDBVersion()
                .flatMap(ignored -> instanceConfigHelper.checkInstanceSchemaVersion())
                .flatMap(signal -> registrationAndRtsCheckMono)
                // Prefill the server cache with anonymous user permission group ids.
                .then(cacheableRepositoryHelper.preFillAnonymousUserPermissionGroupIdsCache())
                // Cold publisher to wait for upstream execution to complete as we have dependency on the instance
                // registration
                .then(Mono.defer(instanceConfigHelper::isLicenseValid)
                        // Ensure that the org feature flags are refreshed with the latest values after completing the
                        // license verification process.
                        .flatMap(isValid -> instanceConfigHelper.updateCacheForOrganizationFeatureFlags()));

        try {
            startupProcess.block();
        } catch (Exception e) {
            log.debug("Application start up encountered an error: {}", e.getMessage());
            Sentry.captureException(e);
        }
    }

    public boolean getIsRtsAccessible() {
        return instanceConfigHelper.getIsRtsAccessible();
    }
}
