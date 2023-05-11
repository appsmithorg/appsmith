package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.DatasourceConfigurationStorage;
import com.appsmith.external.models.QDatasourceConfigurationStorage;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

public class CustomDatasourceConfigurationStorageRepositoryCEImpl
        extends BaseAppsmithRepositoryImpl<DatasourceConfigurationStorage>
        implements CustomDatasourceConfigurationStorageRepositoryCE {

    private final ReactiveMongoOperations mongoOperations;
    public CustomDatasourceConfigurationStorageRepositoryCEImpl(ReactiveMongoOperations mongoOperations,
                                                                MongoConverter mongoConverter,
                                                                CacheableRepositoryHelper cacheableRepositoryHelper) {

        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
        this.mongoOperations = mongoOperations;
    }

    /*
    static helper methods
     */

    private static Criteria datasourceIdCriterion(String datasourceId) {
        return Criteria.where(fieldName(QDatasourceConfigurationStorage.datasourceConfigurationStorage.datasourceId))
                .is(datasourceId);
    }

    private static Criteria datasourceIdsCriterion(List<String> datasourceids) {
        return Criteria.where(fieldName(QDatasourceConfigurationStorage.datasourceConfigurationStorage.datasourceId))
                .in(datasourceids);
    }

    /*
    Implementations of the interface
     */

    @Override
    public Flux<DatasourceConfigurationStorage> findByDatasourceId(String datasourceId) {
        return queryMany(List.of(notDeleted(), datasourceIdCriterion(datasourceId)));
    }

    @Override
    public Flux<DatasourceConfigurationStorage> findAllByDatasourceIds(List<String> datasourceIds) {
        return queryMany(List.of(notDeleted(), datasourceIdsCriterion(datasourceIds)));
    }

    @Override
    public Mono<DatasourceConfigurationStorage> findOneByDatasourceId(String datasourceId) {
        return queryOne(List.of(notDeleted(), datasourceIdCriterion(datasourceId)));
    }
}
