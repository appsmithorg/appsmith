package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.QPlugin;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import reactor.core.publisher.Flux;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.springframework.data.mongodb.core.query.Criteria.where;

public class CustomPluginRepositoryCEImpl extends BaseAppsmithRepositoryImpl<Plugin>
        implements CustomPluginRepositoryCE {

    public CustomPluginRepositoryCEImpl(
            ReactiveMongoOperations mongoOperations,
            MongoConverter mongoConverter,
            CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }

    @Override
    public Flux<Plugin> findDefaultPluginIcons() {
        Criteria criteria =
                Criteria.where(fieldName(QPlugin.plugin.defaultInstall)).is(Boolean.TRUE);
        List<String> projections = List.of(
                fieldName(QPlugin.plugin.name),
                fieldName(QPlugin.plugin.packageName),
                fieldName(QPlugin.plugin.iconLocation));
        return this.queryAll(List.of(criteria), projections, null, null);
    }

    @Override
    public Flux<Plugin> findAllByIdsWithoutPermission(Set<String> ids, List<String> includeFields) {
        Criteria idCriteria = where(fieldName(QPlugin.plugin.id)).in(ids);
        return queryAll(
                List.of(idCriteria),
                Optional.ofNullable(includeFields),
                Optional.empty(),
                Optional.empty(),
                NO_RECORD_LIMIT);
    }
}
