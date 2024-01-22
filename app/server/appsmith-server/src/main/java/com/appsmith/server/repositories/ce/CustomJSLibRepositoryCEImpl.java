package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.QCustomJSLib;
import com.appsmith.server.dtos.CustomJSLibContextDTO;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import static org.springframework.data.mongodb.core.query.Criteria.where;

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
        Criteria criteria = where(fieldName(QCustomJSLib.customJSLib.uidString)).is(customJSLib.getUidString());

        return this.queryOne(List.of(criteria));
    }

    @Override
    public Flux<CustomJSLib> findCustomJsLibsInContext(Set<CustomJSLibContextDTO> customJSLibContextDTOS) {

        Set<String> uidStrings = customJSLibContextDTOS.stream()
                .map(CustomJSLibContextDTO::getUidString)
                .collect(Collectors.toSet());

        Criteria criteria =
                Criteria.where(fieldName(QCustomJSLib.customJSLib.uidString)).in(uidStrings);

        return this.queryAll(List.of(criteria), Optional.empty());
    }
}
