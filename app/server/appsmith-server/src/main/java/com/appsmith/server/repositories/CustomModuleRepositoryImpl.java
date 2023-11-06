package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Module;
import com.appsmith.server.domains.QModule;
import com.mongodb.client.result.UpdateResult;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Update;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Optional;

import static org.springframework.data.mongodb.core.query.Criteria.where;

public class CustomModuleRepositoryImpl extends BaseAppsmithRepositoryImpl<Module> implements CustomModuleRepository {

    public CustomModuleRepositoryImpl(
            ReactiveMongoOperations mongoOperations,
            MongoConverter mongoConverter,
            CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }

    @Override
    public Flux<Module> getAllModulesByPackageId(String packageId, AclPermission permission) {
        Criteria packageCriteria = where(fieldName(QModule.module.packageId)).is(packageId);

        return queryAll(List.of(packageCriteria), permission);
    }

    @Override
    public Flux<Module> getAllConsumableModulesByPackageIds(List<String> packageIds, AclPermission permission) {
        Criteria packageIdInCriteria =
                where(fieldName(QModule.module.packageId)).in(packageIds);
        return queryAll(List.of(packageIdInCriteria), Optional.of(permission));
    }

    @Override
    public Mono<UpdateResult> update(String id, Update updateObj, AclPermission permission) {
        return updateById(id, updateObj, permission);
    }
}
