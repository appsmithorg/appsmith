package com.appsmith.server.services.ce;

import com.appsmith.external.helpers.MustacheHelper;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.configurations.InstanceConfig;
import com.appsmith.util.WebClientUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.BodyInserters;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RequiredArgsConstructor
public class AstServiceCEImpl implements AstServiceCE {

    private final CommonConfig commonConfig;

    private final InstanceConfig instanceConfig;

    @Override
    public Mono<List<String>> getPossibleReferencesFromDynamicBinding(String bindingValue, int evalVersion) {
        if (!StringUtils.hasLength(bindingValue)) {
            return Mono.empty();
        }

        // If RTS server is not accessible for this instance, it means that this is a slim container set up
        // Proceed with assuming that all words need to be processed as possible entity references
        if (Boolean.FALSE.equals(instanceConfig.getIsRtsAccessible())) {
            return Mono.just(new ArrayList<>(MustacheHelper.getPossibleParentsOld(bindingValue)));
        }

        // TODO: change this access path after AST restructure. DO NOT attempt to merge PR till this is done
        return WebClientUtils.create(commonConfig.getRtsBaseDomain() + "/rts-api/v1/ast/single-script-identifiers")
                .post()
                .body(BodyInserters.fromValue(Map.of("script", bindingValue, "evalVersion", evalVersion)))
                .retrieve()
                .bodyToMono(Map.class)
                .map(response -> (List<String>) response.get("data"));
        // TODO: add error handling scenario for when RTS is not accessible in fat container
    }
}
