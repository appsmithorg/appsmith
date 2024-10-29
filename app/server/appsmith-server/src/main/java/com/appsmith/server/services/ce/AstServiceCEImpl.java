package com.appsmith.server.services.ce;

import com.appsmith.external.helpers.MustacheHelper;
import com.appsmith.external.models.MustacheBindingToken;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.configurations.InstanceConfig;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.RTSCaller;
import com.appsmith.util.WebClientUtils;
import io.micrometer.observation.ObservationRegistry;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.observability.micrometer.Micrometer;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.netty.resources.ConnectionProvider;
import reactor.util.function.Tuple2;
import reactor.util.function.Tuples;
import reactor.util.retry.Retry;

import java.time.Duration;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Slf4j
@RequiredArgsConstructor
public class AstServiceCEImpl implements AstServiceCE {

    private final CommonConfig commonConfig;
    private final InstanceConfig instanceConfig;
    private final RTSCaller rtsCaller;
    private final ObservationRegistry observationRegistry;

    private final WebClient webClient = WebClientUtils.create(ConnectionProvider.builder("rts-provider")
            .maxConnections(100)
            .maxIdleTime(Duration.ofSeconds(30))
            .maxLifeTime(Duration.ofSeconds(40))
            .pendingAcquireTimeout(Duration.ofSeconds(10))
            .pendingAcquireMaxCount(-1)
            .build());

    private static final long MAX_API_RESPONSE_TIME_IN_MS = 50;

    @Override
    public Mono<Map<MustacheBindingToken, String>> replaceValueInMustacheKeys(
            Set<MustacheBindingToken> mustacheKeySet,
            String oldName,
            String newName,
            int evalVersion,
            Pattern oldNamePattern) {
        return this.replaceValueInMustacheKeys(mustacheKeySet, oldName, newName, evalVersion, oldNamePattern, false);
    }

    @Override
    public Mono<Map<MustacheBindingToken, String>> replaceValueInMustacheKeys(
            Set<MustacheBindingToken> mustacheKeySet,
            String oldName,
            String newName,
            int evalVersion,
            Pattern oldNamePattern,
            boolean isJSObject) {
        if (Boolean.TRUE.equals(this.instanceConfig.getIsRtsAccessible())) {
            return this.refactorNameInDynamicBindings(mustacheKeySet, oldName, newName, evalVersion, isJSObject);
        }
        return this.replaceValueInMustacheKeys(mustacheKeySet, oldNamePattern, newName);
    }

    @Override
    public Mono<Map<MustacheBindingToken, String>> replaceValueInMustacheKeys(
            Set<MustacheBindingToken> mustacheKeySet, Pattern oldNamePattern, String newName) {
        return Flux.fromIterable(mustacheKeySet)
                .flatMap(mustacheKey -> {
                    Matcher matcher = oldNamePattern.matcher(mustacheKey.getValue());
                    if (matcher.find()) {
                        return Mono.zip(
                                Mono.just(mustacheKey),
                                Mono.just(matcher.replaceAll(Matcher.quoteReplacement(newName))));
                    }
                    return Mono.empty();
                })
                .collectMap(Tuple2::getT1, Tuple2::getT2);
    }

    @Override
    public Flux<Tuple2<String, Set<String>>> getPossibleReferencesFromDynamicBinding(
            List<String> bindingValues, int evalVersion) {
        if (bindingValues == null || bindingValues.isEmpty()) {
            return Flux.empty();
        }
        /*
           For the binding value which starts with "appsmith.theme" can be directly served
           without calling the AST API or the calling the method for non-AST implementation
        */
        if (bindingValues.size() == 1 && bindingValues.get(0).startsWith("appsmith.theme.")) {
            return Flux.just(Tuples.of(bindingValues.get(0), new HashSet<>(bindingValues)));
        }

        // If RTS server is not accessible for this instance, it means that this is a slim container set up
        // Proceed with assuming that all words need to be processed as possible entity references
        if (Boolean.FALSE.equals(instanceConfig.getIsRtsAccessible())) {
            return Flux.fromIterable(bindingValues).flatMap(bindingValue -> {
                return Mono.zip(
                        Mono.just(bindingValue),
                        Mono.just(new HashSet<>(MustacheHelper.getPossibleParentsOld(bindingValue))));
            });
        }
        long startTime = System.nanoTime();

        Flux<Tuple2<String, Set<String>>> res = rtsCaller
                .post("/rts-api/v1/ast/multiple-script-data", new GetIdentifiersRequestBulk(bindingValues, evalVersion))
                .flatMapMany(spec -> spec.retrieve()
                        .bodyToMono(GetIdentifiersResponseBulk.class)
                        .retryWhen(Retry.max(3))
                        .flatMapIterable(getIdentifiersResponse -> getIdentifiersResponse.data)
                        .index())
                .flatMap(tuple2 -> {
                    long currentIndex = tuple2.getT1();
                    Set<String> references = tuple2.getT2().getReferences();
                    return Mono.zip(Mono.just(bindingValues.get((int) currentIndex)), Mono.just(references));
                })
                .name("appsmith.rts.multiple-script-data")
                .tap(Micrometer.observation(observationRegistry));

        long endTime = System.nanoTime();
        double timeTakenMs = (endTime - startTime) / 1_000_000.0;
        log.debug(String.format("\nTime taken to get possible references from dynamic bindings: %.4f ms", timeTakenMs));

        // TODO: add error handling scenario for when RTS is not accessible in fat container
        return res;
    }

    @Override
    public Mono<Map<MustacheBindingToken, String>> refactorNameInDynamicBindings(
            Set<MustacheBindingToken> bindingValues,
            String oldName,
            String newName,
            int evalVersion,
            boolean isJSObject) {
        if (bindingValues == null || bindingValues.isEmpty()) {
            return Mono.empty();
        }

        return Flux.fromIterable(bindingValues)
                .flatMap(bindingValue -> {
                    EntityRefactorRequest entityRefactorRequest = new EntityRefactorRequest(
                            bindingValue.getValue(), oldName, newName, evalVersion, isJSObject);
                    return rtsCaller
                            .post("/rts-api/v1/ast/entity-refactor", entityRefactorRequest)
                            .flatMap(spec -> spec.retrieve().toEntity(EntityRefactorResponse.class))
                            .flatMap(entityRefactorResponseResponseEntity -> {
                                if (HttpStatus.OK.equals(entityRefactorResponseResponseEntity.getStatusCode())) {
                                    return Mono.just(
                                            Objects.requireNonNull(entityRefactorResponseResponseEntity.getBody()));
                                }
                                return Mono.error(new AppsmithException(
                                        AppsmithError.RTS_SERVER_ERROR,
                                        entityRefactorResponseResponseEntity.getStatusCodeValue()));
                            })
                            .elapsed()
                            .map(tuple -> {
                                if (tuple.getT1() > MAX_API_RESPONSE_TIME_IN_MS) {
                                    log.debug("Time elapsed since AST refactor call: {} ms", tuple.getT1());
                                    log.debug("This call took longer than expected. The binding was: {}", bindingValue);
                                }
                                return tuple.getT2();
                            })
                            .map(EntityRefactorResponse::getData)
                            .filter(details -> details.refactorCount > 0)
                            .flatMap(response -> Mono.just(bindingValue).zipWith(Mono.just(response.script)))
                            .onErrorResume(error -> {
                                // If there is a problem with parsing and refactoring this binding, we just ignore it
                                // and move ahead
                                // The expectation is that this binding would error out during eval anyway
                                return Mono.empty();
                            });
                })
                .collect(Collectors.toMap(Tuple2::getT1, Tuple2::getT2));
    }

    @NoArgsConstructor
    @AllArgsConstructor
    @Getter
    static class GetIdentifiersRequest {
        String script;
        int evalVersion;
    }

    @NoArgsConstructor
    @AllArgsConstructor
    @Getter
    static class GetIdentifiersRequestBulk {
        List<String> scripts;
        int evalVersion;
    }

    @NoArgsConstructor
    @AllArgsConstructor
    @Getter
    @Setter
    static class GetIdentifiersResponse {
        GetIdentifiersResponseDetails data;
    }

    @NoArgsConstructor
    @AllArgsConstructor
    @Getter
    @Setter
    static class GetIdentifiersResponseBulk {
        List<GetIdentifiersResponseDetails> data;
    }

    /**
     * Consider the following binding:
     * ( function(ignoredAction1) {
     * let a = ignoredAction1.data
     * let ignoredAction2 = { data: "nothing" }
     * let b = ignoredAction2.data
     * let c = "ignoredAction3.data"
     * // ignoredAction4.data
     * return aPostAction.data
     * } )(anotherPostAction.data)
     * <p/>
     * The values in the returned instance of GetIdentifiersResponseDetails will be:
     * {
     * references: ["aPostAction.data", "anotherPostAction.data"],
     * functionalParams: ["ignoredAction1"],
     * variables: ["ignoredAction2", "a", "b", "c"]
     */
    @NoArgsConstructor
    @AllArgsConstructor
    @Getter
    @Setter
    static class GetIdentifiersResponseDetails {
        Set<String> references;
        Set<String> functionalParams;
        Set<String> variables;
    }

    @NoArgsConstructor
    @AllArgsConstructor
    @Getter
    static class EntityRefactorRequest {
        String script;
        String oldName;
        String newName;
        int evalVersion;
        Boolean isJSObject;
    }

    @NoArgsConstructor
    @AllArgsConstructor
    @Getter
    @Setter
    static class EntityRefactorResponse {
        EntityRefactorResponseDetails data;
    }

    @NoArgsConstructor
    @AllArgsConstructor
    @Getter
    @Setter
    static class EntityRefactorResponseDetails {
        String script;
        int referenceCount;
        int refactorCount;
    }
}
