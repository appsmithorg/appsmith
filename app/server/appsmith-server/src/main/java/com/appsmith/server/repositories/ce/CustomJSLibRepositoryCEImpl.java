package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.dtos.CustomJSLibContextDTO;
import com.appsmith.server.helpers.ce.bridge.Bridge;
import com.appsmith.server.helpers.ce.bridge.BridgeQuery;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Set;
import java.util.stream.Collectors;

public class CustomJSLibRepositoryCEImpl extends BaseAppsmithRepositoryImpl<CustomJSLib>
        implements CustomJSLibRepositoryCE {

    public CustomJSLibRepositoryCEImpl(
            ReactiveMongoOperations mongoOperations,
            MongoConverter mongoConverter,
            CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }

    @Override
    public Mono<CustomJSLib> findUniqueCustomJsLib(CustomJSLib customJSLib) {
        BridgeQuery<CustomJSLib> bridgeQuery = Bridge.equal(CustomJSLib.Fields.uidString, customJSLib.getUidString());

        return queryBuilder().criteria(bridgeQuery).one();
    }

    @Override
    public Flux<CustomJSLib> findCustomJsLibsInContext(Set<CustomJSLibContextDTO> customJSLibContextDTOS) {

        Set<String> uidStrings = customJSLibContextDTOS.stream()
                .map(CustomJSLibContextDTO::getUidString)
                .collect(Collectors.toSet());

        BridgeQuery<CustomJSLib> bridgeQuery = Bridge.in(CustomJSLib.Fields.uidString, uidStrings);

        return queryBuilder().criteria(bridgeQuery).all();
    }
}
