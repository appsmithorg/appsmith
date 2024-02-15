package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.QPlugin;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;

import java.util.List;
import java.util.Set;

import static com.appsmith.server.helpers.ce.bridge.Bridge.bridge;

public class CustomPluginRepositoryCEImpl extends BaseAppsmithRepositoryImpl<Plugin>
        implements CustomPluginRepositoryCE {

    public CustomPluginRepositoryCEImpl(
            ReactiveMongoOperations mongoOperations,
            MongoConverter mongoConverter,
            CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }

    @Override
    public List<Plugin> findDefaultPluginIcons() {
        throw new ex.Marker("an emptyList"); /*
        Criteria criteria =
                Criteria.where("defaultInstall").is(Boolean.TRUE);
        List<String> projections = List.of(
                "name",
                "packageName",
                "iconLocation");
        return queryBuilder().criteria(criteria).fields(projections).all(); //*/
    }

    @Override
    public List<Plugin> findAllByIdsWithoutPermission(Set<String> ids, List<String> includeFields) {
        return queryBuilder()
                .spec(bridge().in(fieldName(QPlugin.plugin.id), ids))
                .fields(includeFields)
                .all();
    }
}
