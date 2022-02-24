package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.QPlugin;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import reactor.core.publisher.Flux;

import java.util.List;

public class CustomPluginRepositoryCEImpl extends BaseAppsmithRepositoryImpl<Plugin> implements CustomPluginRepositoryCE {

    public CustomPluginRepositoryCEImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter) {
        super(mongoOperations, mongoConverter);
    }

    @Override
    public Flux<Plugin> findDefaultPluginIcons() {
        Criteria criteria = Criteria.where(fieldName(QPlugin.plugin.defaultInstall)).is(Boolean.TRUE);
        List<String> projections = List.of(
                fieldName(QPlugin.plugin.name),
                fieldName(QPlugin.plugin.packageName),
                fieldName(QPlugin.plugin.iconLocation)
        );
        return this.queryAll(List.of(criteria), projections, null, null);
    }
}
