package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.dtos.CustomJSLibContextDTO;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.helpers.ce.bridge.Bridge.bridge;

public class CustomJSLibRepositoryCEImpl extends BaseAppsmithRepositoryImpl<CustomJSLib>
        implements CustomJSLibRepositoryCE {

    public CustomJSLibRepositoryCEImpl(
            ReactiveMongoOperations mongoOperations,
            MongoConverter mongoConverter,
            CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }

    @Override
    public Optional<CustomJSLib> findUniqueCustomJsLib(CustomJSLib customJSLib) {
        return queryBuilder()
                .criteria(bridge().equal(CustomJSLib.Fields.uidString, customJSLib.getUidString()))
                .one();
    }

    @Override
    public List<CustomJSLib> findCustomJsLibsInContext(Set<CustomJSLibContextDTO> customJSLibContextDTOS) {

        Set<String> uidStrings = customJSLibContextDTOS.stream()
                .map(CustomJSLibContextDTO::getUidString)
                .collect(Collectors.toSet());

        return queryBuilder()
                .criteria(bridge().in(CustomJSLib.Fields.uidString, uidStrings))
                .all();
    }
}
