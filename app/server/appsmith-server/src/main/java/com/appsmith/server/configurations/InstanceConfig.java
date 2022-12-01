package com.appsmith.server.configurations;

import com.appsmith.server.constants.Appsmith;
import com.appsmith.server.domains.Config;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.services.ConfigService;
import com.appsmith.util.WebClientUtils;
import io.sentry.Sentry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.BodyInserters;
import reactor.core.publisher.Mono;

import java.util.Map;
import java.util.Objects;

@Slf4j
@RequiredArgsConstructor
@Component
public class InstanceConfig implements ApplicationListener<ApplicationReadyEvent> {

    private final ConfigService configService;

    private final CloudServicesConfig cloudServicesConfig;

    private final CommonConfig commonConfig;

    private boolean isRtsAccessible = false;

    @Override
    public void onApplicationEvent(ApplicationReadyEvent applicationReadyEvent) {
        configService.getByName(Appsmith.APPSMITH_REGISTERED)
                .filter(config -> Boolean.TRUE.equals(config.getConfig().get("value")))
                .switchIfEmpty(registerInstance())
                .doOnError(errorSignal -> log.debug("Instance registration failed with error: \n{}", errorSignal.getMessage()))
                .then(performRtsHealthCheck())
                .doFinally(ignored -> this.printReady())
                .subscribe(null, e -> {
                    log.debug(e.getMessage());
                    Sentry.captureException(e);
                });
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
                .create(commonConfig.getRtsBaseDomain() + "/rts-api/v1/health-check")
                .get()
                .retrieve()
                .toBodilessEntity()
                .doOnNext(nextSignal -> {
                    log.debug("RTS health check succeeded");
                    this.isRtsAccessible = true;
                })
                .doOnError(errorSignal -> log.debug("RTS health check failed with error: \n{}", errorSignal.getMessage()))
                .then();
    }

    private void printReady() {
        System.out.println(
                "\n" +
                        " █████╗ ██████╗ ██████╗ ███████╗███╗   ███╗██╗████████╗██╗  ██╗    ██╗███████╗    ██████╗ ██╗   ██╗███╗   ██╗███╗   ██╗██╗███╗   ██╗ ██████╗ ██╗\n" +
                        "██╔══██╗██╔══██╗██╔══██╗██╔════╝████╗ ████║██║╚══██╔══╝██║  ██║    ██║██╔════╝    ██╔══██╗██║   ██║████╗  ██║████╗  ██║██║████╗  ██║██╔════╝ ██║\n" +
                        "███████║██████╔╝██████╔╝███████╗██╔████╔██║██║   ██║   ███████║    ██║███████╗    ██████╔╝██║   ██║██╔██╗ ██║██╔██╗ ██║██║██╔██╗ ██║██║  ███╗██║\n" +
                        "██╔══██║██╔═══╝ ██╔═══╝ ╚════██║██║╚██╔╝██║██║   ██║   ██╔══██║    ██║╚════██║    ██╔══██╗██║   ██║██║╚██╗██║██║╚██╗██║██║██║╚██╗██║██║   ██║╚═╝\n" +
                        "██║  ██║██║     ██║     ███████║██║ ╚═╝ ██║██║   ██║   ██║  ██║    ██║███████║    ██║  ██║╚██████╔╝██║ ╚████║██║ ╚████║██║██║ ╚████║╚██████╔╝██╗\n" +
                        "╚═╝  ╚═╝╚═╝     ╚═╝     ╚══════╝╚═╝     ╚═╝╚═╝   ╚═╝   ╚═╝  ╚═╝    ╚═╝╚══════╝    ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝  ╚═══╝╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚═╝\n" +
                        "\n" +
                        "Please open http://localhost:<port> in your browser to experience Appsmith!\n"
        );
    }

    public boolean getIsRtsAccessible() {
        return this.isRtsAccessible;
    }

}
