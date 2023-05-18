package com.appsmith.server.configurations;

import com.appsmith.server.constants.Appsmith;
import com.appsmith.server.helpers.InstanceConfigHelper;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.appsmith.server.services.ConfigService;
import io.sentry.Sentry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Slf4j
@RequiredArgsConstructor
@Component
public class InstanceConfig implements ApplicationListener<ApplicationReadyEvent> {

    private final ConfigService configService;

    private final CacheableRepositoryHelper cacheableRepositoryHelper;

    private final InstanceConfigHelper instanceConfigHelper;


    @Override
    public void onApplicationEvent(ApplicationReadyEvent applicationReadyEvent) {

        Mono<Void> registrationAndRtsCheckMono = configService.getByName(Appsmith.APPSMITH_REGISTERED)
                .filter(config -> Boolean.TRUE.equals(config.getConfig().get("value")))
                .switchIfEmpty(instanceConfigHelper.registerInstance())
                .onErrorResume(errorSignal -> {
                    log.debug("Instance registration failed with error: \n{}", errorSignal.getMessage());
                    return Mono.empty();
                })
                .then(instanceConfigHelper.performRtsHealthCheck())
                .doFinally(ignored -> instanceConfigHelper.printReady());

        Mono<?> startupProcess = instanceConfigHelper.checkInstanceSchemaVersion()
                .flatMap(signal -> registrationAndRtsCheckMono)
                // Prefill the server cache with anonymous user permission group ids.
                .then(cacheableRepositoryHelper.preFillAnonymousUserPermissionGroupIdsCache())
                // Add cold publisher as we have dependency on the instance registration
                .then(Mono.defer(instanceConfigHelper::isLicenseValid));

        try {
            startupProcess.block();
        } catch(Exception e) {
            log.debug("Application start up encountered an error: {}", e.getMessage());
            Sentry.captureException(e);
        }
    }

    public boolean getIsRtsAccessible() {
        return instanceConfigHelper.getIsRtsAccessible();
    }

}
