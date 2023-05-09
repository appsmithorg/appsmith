package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.ConfigurationStorage;
import com.appsmith.external.models.QConfigurationStorage;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

public class CustomConfigurationStorageRepositoryCEImpl
        extends BaseAppsmithRepositoryImpl<ConfigurationStorage>
        implements CustomConfigurationStorageRepositoryCE {

    private final ReactiveMongoOperations mongoOperations;
    public CustomConfigurationStorageRepositoryCEImpl(ReactiveMongoOperations mongoOperations,
                                                      MongoConverter mongoConverter,
                                                      CacheableRepositoryHelper cacheableRepositoryHelper) {

        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
        this.mongoOperations = mongoOperations;
    }

    /*
    static helper methods
     */

    private static Query getQuery(List<Criteria> criteria) {
        Query query = new Query();
        criteria.forEach(query::addCriteria);
        return query;
    }

    private static Criteria datasourceIdCriterion(String datasourceId) {
        return Criteria.where(fieldName(QConfigurationStorage.configurationStorage.datasourceId)).is(datasourceId);
    }

    private static Criteria datasourceIdsCriterion(List<String> datasourceids) {
        return Criteria.where(fieldName(QConfigurationStorage.configurationStorage.datasourceId)).in(datasourceids);
    }

    /*
    Db query methods
     */
    
    private Mono<ConfigurationStorage> queryOne(List<Criteria> criteria) {
        return mongoOperations.findOne(getQuery(criteria), ConfigurationStorage.class);
    }

    private Flux<ConfigurationStorage> queryMany(List<Criteria> criteria) {
        return mongoOperations.find(getQuery(criteria), ConfigurationStorage.class);
    }

    /*
    Implementations of the interface
     */

    @Override
    public Flux<ConfigurationStorage> findByDatasourceId(String datasourceId) {
        return queryMany(List.of(notDeleted(), datasourceIdCriterion(datasourceId)));
    }

    @Override
    public Flux<ConfigurationStorage> findAllByDatasourceIds(List<String> datasourceIds) {
        return queryMany(List.of(notDeleted(), datasourceIdsCriterion(datasourceIds)));
    }

    @Override
    public Mono<ConfigurationStorage> findOneByDatasourceId(String datasourceId) {
        return queryOne(List.of(notDeleted(), datasourceIdCriterion(datasourceId)));
    }
}
