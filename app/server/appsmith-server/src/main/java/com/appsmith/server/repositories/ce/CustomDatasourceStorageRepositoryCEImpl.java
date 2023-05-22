/* Copyright 2019-2023 Appsmith */
package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.external.models.QDatasourceStorage;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import java.util.List;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public class CustomDatasourceStorageRepositoryCEImpl
    extends BaseAppsmithRepositoryImpl<DatasourceStorage>
    implements CustomDatasourceStorageRepositoryCE {

  private final ReactiveMongoOperations mongoOperations;

  public CustomDatasourceStorageRepositoryCEImpl(
      ReactiveMongoOperations mongoOperations,
      MongoConverter mongoConverter,
      CacheableRepositoryHelper cacheableRepositoryHelper) {

    super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    this.mongoOperations = mongoOperations;
  }

  /*
  static helper methods
   */

  private static Criteria datasourceIdCriterion(String datasourceId) {
    return Criteria.where(fieldName(QDatasourceStorage.datasourceStorage.datasourceId))
        .is(datasourceId);
  }

  private static Criteria datasourceIdsCriterion(List<String> datasourceids) {
    return Criteria.where(fieldName(QDatasourceStorage.datasourceStorage.datasourceId))
        .in(datasourceids);
  }

  /*
  Implementations of the interface
   */

  @Override
  public Flux<DatasourceStorage> findByDatasourceId(String datasourceId) {
    return queryMany(List.of(notDeleted(), datasourceIdCriterion(datasourceId)));
  }

  @Override
  public Flux<DatasourceStorage> findAllByDatasourceIds(List<String> datasourceIds) {
    return queryMany(List.of(notDeleted(), datasourceIdsCriterion(datasourceIds)));
  }

  @Override
  public Mono<DatasourceStorage> findOneByDatasourceId(String datasourceId) {
    return queryOne(List.of(notDeleted(), datasourceIdCriterion(datasourceId)));
  }
}
