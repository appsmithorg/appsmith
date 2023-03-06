package com.appsmith.server.configurations;

import com.appsmith.server.constants.Appsmith;
import com.appsmith.server.domains.Config;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.appsmith.server.services.ConfigService;
import com.appsmith.util.WebClientUtils;
import io.sentry.Sentry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationListener;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.BodyInserters;
import reactor.core.publisher.Mono;

import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Slf4j
@RequiredArgsConstructor
@Component
public class InstanceConfig implements ApplicationListener<ApplicationReadyEvent> {

    private final ConfigService configService;

    private final CloudServicesConfig cloudServicesConfig;

    private final CommonConfig commonConfig;

    private final ApplicationContext applicationContext;

    private final CacheableRepositoryHelper cacheableRepositoryHelper;

    private boolean isRtsAccessible = false;


    @Override
    public void onApplicationEvent(ApplicationReadyEvent applicationReadyEvent) {

        Mono<Void> registrationAndRtsCheckMono = configService.getByName(Appsmith.APPSMITH_REGISTERED)
                .filter(config -> Boolean.TRUE.equals(config.getConfig().get("value")))
                .switchIfEmpty(registerInstance())
                .onErrorResume(errorSignal -> {
                    log.debug("Instance registration failed with error: \n{}", errorSignal.getMessage());
                    return Mono.empty();
                })
                .then(performRtsHealthCheck())
                .doFinally(ignored -> this.printReady());

        Mono<?> startupProcess = checkInstanceSchemaVersion()
                .flatMap(signal -> registrationAndRtsCheckMono)
                // Prefill the server cache with anonymous user permission group ids.
                .then(cacheableRepositoryHelper.preFillAnonymousUserPermissionGroupIdsCache());
        try {
            startupProcess.block();
        } catch(Exception e) {
            log.debug("Application start up encountered an error: {}", e.getMessage());
            Sentry.captureException(e);
        }
    }

    private Mono<Config> checkInstanceSchemaVersion() {
        return configService.getByName(Appsmith.INSTANCE_SCHEMA_VERSION)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.SCHEMA_VERSION_NOT_FOUND_ERROR)))
                .onErrorMap(AppsmithException.class, e -> new AppsmithException(AppsmithError.SCHEMA_VERSION_NOT_FOUND_ERROR))
                .flatMap(config -> {
                    if (CommonConfig.LATEST_INSTANCE_SCHEMA_VERSION == config.getConfig().get("value")) {
                        return Mono.just(config);
                    }
                    return Mono.error(populateSchemaMismatchError((Integer) config.getConfig().get("value")));
                })
                .doOnError(errorSignal -> {
                    log.error("""

                                    ################################################
                                    Error while trying to start up Appsmith instance:\s
                                    {}
                                    ################################################
                                    """,
                            errorSignal.getMessage());

                    SpringApplication.exit(applicationContext, () -> 1);
                    System.exit(1);
                });
    }

    private AppsmithException populateSchemaMismatchError(Integer currentInstanceSchemaVersion) {

        List<String> versions = new LinkedList<>();
        List<String> docs = new LinkedList<>();

        // Keep adding version numbers that brought in breaking instance schema migrations here
        switch (currentInstanceSchemaVersion) {
            // Example, we expect that in v1.9.2, all instances will have been migrated to instanceSchemaVer 2
            case 1:
                versions.add("v1.9.2");
                docs.add("https://docs.appsmith.com/help-and-support/troubleshooting-guide/deployment-errors#server-shuts-down-with-schema-mismatch-error");
            default:
        }

        return new AppsmithException(AppsmithError.SCHEMA_MISMATCH_ERROR, versions, docs);
    }

    private Mono<? extends Config> registerInstance() {

        log.debug("Triggering registration of this instance...");

        final String baseUrl = cloudServicesConfig.getBaseUrl();
        if (baseUrl == null || StringUtils.isEmpty(baseUrl)) {
            return Mono.error(new AppsmithException(
                    AppsmithError.INSTANCE_REGISTRATION_FAILURE, "Unable to find cloud services base URL")
            );
        }

        return configService
                .getInstanceId()
                .flatMap(instanceId -> WebClientUtils
                        .create(baseUrl + "/api/v1/installations")
                        .post()
                        .body(BodyInserters.fromValue(Map.of("key", instanceId)))
                        .headers(httpHeaders -> httpHeaders.set(HttpHeaders.CONTENT_TYPE, "application/json"))
                        .exchange())
                .flatMap(clientResponse -> clientResponse.toEntity(new ParameterizedTypeReference<ResponseDTO<String>>() {
                }))
                .flatMap(responseEntity -> {
                    if (responseEntity.getStatusCode().is2xxSuccessful()) {
                        return Mono.justOrEmpty(Objects.requireNonNull(responseEntity.getBody()).getData());
                    }
                    return Mono.error(new AppsmithException(
                            AppsmithError.INSTANCE_REGISTRATION_FAILURE,
                            Objects.requireNonNull(responseEntity.getBody()).getResponseMeta().getError().getMessage()));
                })
                .flatMap(instanceId -> {
                    log.debug("Registration successful, updating state ...");
                    return configService.save(Appsmith.APPSMITH_REGISTERED, Map.of("value", true));
                });
    }

    private Mono<Void> performRtsHealthCheck() {
        log.debug("Performing RTS health check of this instance...");

        return WebClientUtils
                .create(commonConfig.getRtsBaseUrl() + "/rts-api/v1/health-check")
                .get()
                .retrieve()
                .toBodilessEntity()
                .doOnNext(nextSignal -> {
                    log.debug("RTS health check succeeded");
                    this.isRtsAccessible = true;
                })
                .onErrorResume(errorSignal -> {
                    log.debug("RTS health check failed with error: \n{}", errorSignal.getMessage());
                    return Mono.empty();

                }).then();
    }

    private void printReady() {
        System.out.println(
                """

                         █████╗ ██████╗ ██████╗ ███████╗███╗   ███╗██╗████████╗██╗  ██╗    ██╗███████╗    ██████╗ ██╗   ██╗███╗   ██╗███╗   ██╗██╗███╗   ██╗ ██████╗ ██╗
                        ██╔══██╗██╔══██╗██╔══██╗██╔════╝████╗ ████║██║╚══██╔══╝██║  ██║    ██║██╔════╝    ██╔══██╗██║   ██║████╗  ██║████╗  ██║██║████╗  ██║██╔════╝ ██║
                        ███████║██████╔╝██████╔╝███████╗██╔████╔██║██║   ██║   ███████║    ██║███████╗    ██████╔╝██║   ██║██╔██╗ ██║██╔██╗ ██║██║██╔██╗ ██║██║  ███╗██║
                        ██╔══██║██╔═══╝ ██╔═══╝ ╚════██║██║╚██╔╝██║██║   ██║   ██╔══██║    ██║╚════██║    ██╔══██╗██║   ██║██║╚██╗██║██║╚██╗██║██║██║╚██╗██║██║   ██║╚═╝
                        ██║  ██║██║     ██║     ███████║██║ ╚═╝ ██║██║   ██║   ██║  ██║    ██║███████║    ██║  ██║╚██████╔╝██║ ╚████║██║ ╚████║██║██║ ╚████║╚██████╔╝██╗
                        ╚═╝  ╚═╝╚═╝     ╚═╝     ╚══════╝╚═╝     ╚═╝╚═╝   ╚═╝   ╚═╝  ╚═╝    ╚═╝╚══════╝    ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝  ╚═══╝╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚═╝

                        Please open http://localhost:<port> in your browser to experience Appsmith!
                        """
        );
    }

    public boolean getIsRtsAccessible() {
        return this.isRtsAccessible;
    }

}
