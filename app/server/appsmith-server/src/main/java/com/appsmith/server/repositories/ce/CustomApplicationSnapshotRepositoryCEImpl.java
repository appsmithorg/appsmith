package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.ApplicationSnapshot;
import com.appsmith.server.domains.QApplicationSnapshot;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Optional;

import static org.springframework.data.mongodb.core.query.Criteria.where;

@Slf4j
public class CustomApplicationSnapshotRepositoryCEImpl extends BaseAppsmithRepositoryImpl<ApplicationSnapshot> implements CustomApplicationSnapshotRepositoryCE {
    public CustomApplicationSnapshotRepositoryCEImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter, CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }

    @Override
    public Mono<ApplicationSnapshot> findByApplicationIdAndBranchName(String applicationId, String branchName, AclPermission permission) {
        Criteria applicationIdCriteria = where(fieldName(QApplicationSnapshot.applicationSnapshot.applicationId)).is(applicationId);
        Criteria branchNameCriteria = where(fieldName(QApplicationSnapshot.applicationSnapshot.branchName)).is(branchName);
        return queryOne(List.of(applicationIdCriteria, branchNameCriteria), null, Optional.ofNullable(permission));
    }
}
