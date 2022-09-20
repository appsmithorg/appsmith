package com.appsmith.server.services.ce;

import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.util.WebClientUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.BodyInserters;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@Slf4j
@RequiredArgsConstructor
public class AstServiceCEImpl implements AstServiceCE {

    private final CommonConfig commonConfig;

    @Override
    public Mono<List<String>> getPossibleReferencesFromDynamicBinding(String bindingValue, int evalVersion) {
        if (!StringUtils.hasLength(bindingValue)) {
            return Mono.empty();
        }

        return WebClientUtils.create(commonConfig.getRtsBaseDomain() + "rts-api/v1/ast/single-script-identifiers")
                .post()
                .body(BodyInserters.fromValue(Map.of("script", bindingValue, "evalVersion", evalVersion)))
                .retrieve()
                .bodyToMono(Map.class)
                .map(response -> (List<String>) response.get("data"));
    }
}
