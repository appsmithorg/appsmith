package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.DatasourceStorageStructure;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.server.helpers.ce.bridge.Bridge;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.appsmith.server.repositories.DatasourceStorageStructureRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import static com.appsmith.server.helpers.ce.bridge.Bridge.bridge;

@Component
public class CustomDatasourceStorageStructureRepositoryCEImpl
        extends BaseAppsmithRepositoryImpl<DatasourceStorageStructure>
        implements CustomDatasourceStorageStructureRepositoryCE {

    @SuppressWarnings("SpringJavaAutowiredFieldsWarningInspection") // Can't do lazy wiring in constructor params.
    @Autowired
    @Lazy
    DatasourceStorageStructureRepository repository;

    public CustomDatasourceStorageStructureRepositoryCEImpl(
            ReactiveMongoOperations mongoOperations,
            MongoConverter mongoConverter,
            CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }

    @Override
    public Mono<Void> updateStructure(String datasourceId, String environmentId, DatasourceStructure structure) {
        final Bridge criteria = bridge().equal(DatasourceStorageStructure.Fields.datasourceId, datasourceId)
                .equal(DatasourceStorageStructure.Fields.environmentId, environmentId);

        final Update update = Update.update(DatasourceStorageStructure.Fields.structure, structure);

        return queryBuilder().criteria(criteria).updateFirst(update).flatMap(count -> {
            if (count == 0) {
                DatasourceStorageStructure dss = new DatasourceStorageStructure();
                dss.setDatasourceId(datasourceId);
                dss.setEnvironmentId(environmentId);
                dss.setStructure(structure);
                return repository.save(dss).then();
            }
            return Mono.empty();
        });
    }
}
