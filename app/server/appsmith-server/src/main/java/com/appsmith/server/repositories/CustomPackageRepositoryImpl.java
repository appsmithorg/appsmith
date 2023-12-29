package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Package;
import com.appsmith.server.domains.QPackage;
import com.appsmith.server.dtos.ExportableModule;
import com.mongodb.client.result.UpdateResult;
import org.jetbrains.annotations.NotNull;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Update;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuples;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import static org.springframework.data.mongodb.core.query.Criteria.where;

public class CustomPackageRepositoryImpl extends BaseAppsmithRepositoryImpl<Package>
        implements CustomPackageRepository {

    public CustomPackageRepositoryImpl(
            ReactiveMongoOperations mongoOperations,
            MongoConverter mongoConverter,
            CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }

    @Override
    public Flux<Package> findAllUserPackages(AclPermission permission) {
        return queryAll(List.of(), Optional.ofNullable(permission));
    }

    @Override
    public Flux<Package> findAllConsumablePackages(String workspaceId, AclPermission permission) {
        return findAllSourcePackages(workspaceId, Optional.empty())
                .flatMap(sourcePackage -> Mono.just(Tuples.of(sourcePackage.getId(), sourcePackage.getVersion())))
                .collectList()
                .flatMapMany(allTuple2s -> {
                    if (allTuple2s.isEmpty()) {
                        return Flux.empty();
                    }
                    List<Criteria> allCriteria = allTuple2s.stream()
                            .map(tuple2 -> Criteria.where(fieldName(QPackage.package$.sourcePackageId))
                                    .is(tuple2.getT1())
                                    .and(fieldName(QPackage.package$.version))
                                    .is(tuple2.getT2()))
                            .collect(Collectors.toList());

                    Criteria finalCriteria = new Criteria().orOperator(allCriteria.toArray(new Criteria[0]));

                    return queryAll(List.of(finalCriteria), Optional.of(permission));
                });
    }

    @NotNull private Flux<Package> findAllSourcePackages(String workspaceId, Optional<AclPermission> permission) {
        Criteria sourcePackageCriteria = Criteria.where(fieldName(QPackage.package$.sourcePackageId))
                .is(null)
                .and(fieldName(QPackage.package$.lastPublishedAt))
                .ne(null)
                .and(fieldName(QPackage.package$.workspaceId))
                .is(workspaceId);

        return queryAll(List.of(sourcePackageCriteria), permission);
    }

    @Override
    public Mono<UpdateResult> update(String id, Update updateObj, AclPermission permission) {
        return updateById(id, updateObj, permission);
    }

    @Override
    public Mono<Package> findByBranchNameAndDefaultPackageId(
            String defaultPackageId,
            List<String> projectionFieldNames,
            String branchName,
            AclPermission aclPermission) {
        // TODO : Uncomment the below after git support
        //        String gitPackageMetadata = fieldName(QPackage.package$.gitPackageMetadata);
        //        Criteria defaultAppCriteria = where(gitPackageMetadata + "."
        //            + fieldName(QPackage.package$.gitPackageMetadata.defaultApplicationId))
        //            .is(defaultPackageId);
        //        Criteria branchNameCriteria = where(gitPackageMetadata + "."
        //            + fieldName(QPackage.package$.gitPackageMetadata.branchName))
        //            .is(branchName);
        //        return queryOne(List.of(defaultAppCriteria, branchNameCriteria), projectionFieldNames, aclPermission);
        return findById(defaultPackageId, projectionFieldNames, aclPermission);
    }

    @Override
    public Flux<Package> findAllByIds(List<String> packageIds, List<String> projectionFields) {
        Criteria idCriteria = where(fieldName(QPackage.package$.id)).in(packageIds);
        return queryAll(
                List.of(idCriteria),
                Optional.ofNullable(projectionFields),
                Optional.empty(),
                Optional.empty(),
                NO_RECORD_LIMIT);
    }

    @Override
    public Flux<Package> findAllPublishedByUniqueReference(
            String workspaceId, List<ExportableModule> packageList, Optional<AclPermission> aclPermission) {
        Criteria sourcePackageCriteria = Criteria.where(fieldName(QPackage.package$.sourcePackageId))
                .exists(true)
                .and(fieldName(QPackage.package$.workspaceId))
                .is(workspaceId);

        List<Criteria> criteriaList = packageList.stream()
                .map(aPackage -> {
                    return where(fieldName(QPackage.package$.packageUUID))
                            .is(aPackage.getPackageUUID())
                            .and(fieldName(QPackage.package$.version))
                            .is(aPackage.getVersion());
                })
                .toList();

        Criteria packageRefCriteria = new Criteria();
        if (!criteriaList.isEmpty()) {
            packageRefCriteria.orOperator(criteriaList);
        }

        return queryAll(List.of(sourcePackageCriteria, packageRefCriteria), aclPermission);
    }
}
