package com.appsmith.server.services.ce;

import com.appsmith.external.helpers.MustacheHelper;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.configurations.InstanceConfig;
import com.appsmith.util.WebClientUtils;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.BodyInserters;
import reactor.core.publisher.Mono;

import java.util.HashSet;
import java.util.Set;

@Slf4j
@RequiredArgsConstructor
public class AstServiceCEImpl implements AstServiceCE {

    private final CommonConfig commonConfig;

    private final InstanceConfig instanceConfig;

    @Override
    public Mono<Set<String>> getPossibleReferencesFromDynamicBinding(String bindingValue, int evalVersion) {
        if (!StringUtils.hasLength(bindingValue)) {
            return Mono.empty();
        }

        // If RTS server is not accessible for this instance, it means that this is a slim container set up
        // Proceed with assuming that all words need to be processed as possible entity references
        if (Boolean.FALSE.equals(instanceConfig.getIsRtsAccessible())) {
            return Mono.just(new HashSet<>(MustacheHelper.getPossibleParentsOld(bindingValue)));
        }

        return WebClientUtils.create(commonConfig.getRtsBaseDomain() + "/rts-api/v1/ast/single-script-data")
                .post()
                .contentType(MediaType.APPLICATION_JSON)
                .body(BodyInserters.fromValue(new GetIdentifiersRequest(bindingValue, evalVersion)))
                .retrieve()
                .bodyToMono(GetIdentifiersResponse.class)
                .map(response -> response.data.references);
        // TODO: add error handling scenario for when RTS is not accessible in fat container
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
    @Setter
    static class GetIdentifiersResponse {
        GetIdentifiersResponseDetails data;
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
}
