package com.appsmith.server.repositories;

import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.QUser;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.PagedDomain;
import com.appsmith.server.repositories.ce.CustomUserRepositoryCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections.CollectionUtils;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static com.appsmith.server.helpers.RegexHelper.getStringsToRegex;
import static org.springframework.data.mongodb.core.query.Criteria.where;

@Component
@Slf4j
public class CustomUserRepositoryImpl extends CustomUserRepositoryCEImpl implements CustomUserRepository {

    public CustomUserRepositoryImpl(
            ReactiveMongoOperations mongoOperations,
            MongoConverter mongoConverter,
            CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }

    @Override
    protected Set<String> getSystemGeneratedUserEmails() {
        Set<String> systemGeneratedUserEmails = super.getSystemGeneratedUserEmails();
        systemGeneratedUserEmails.add(FieldName.PROVISIONING_USER);
        return systemGeneratedUserEmails;
    }

    @Override
    public Flux<String> getAllUserEmail(String defaultTenantId) {
        Query query = new Query();
        query.addCriteria(where(fieldName(QUser.user.tenantId)).is(defaultTenantId));
        query.fields().include(fieldName(QUser.user.email));
        return mongoOperations.find(query, User.class).map(User::getEmail);
    }

    @Override
    public Flux<User> getAllUserObjectsWithEmail(String defaultTenantId, Optional<AclPermission> aclPermission) {
        Criteria tenantIdCriteria = where(fieldName(QUser.user.tenantId)).is(defaultTenantId);
        List<String> includedFields = List.of(fieldName(QUser.user.email));
        return queryAll(
                List.of(tenantIdCriteria),
                Optional.of(includedFields),
                aclPermission,
                Optional.empty(),
                NO_RECORD_LIMIT);
    }

    @Override
    public Mono<PagedDomain<User>> getUsersWithParamsPaginated(
            int count, int startIndex, List<String> filterEmails, Optional<AclPermission> aclPermission) {
        List<Criteria> criteriaList = new ArrayList<>();
        Sort sortWithEmail = Sort.by(Sort.Direction.ASC, fieldName(QUser.user.email));
        // Keeping this a case-insensitive, because provisioning clients require case-insensitive searches on emails.
        if (CollectionUtils.isNotEmpty(filterEmails)) {
            criteriaList.add(where(fieldName(QUser.user.email)).regex(getStringsToRegex(filterEmails), "i"));
        }
        Flux<User> userFlux = queryAll(criteriaList, Optional.empty(), aclPermission, sortWithEmail, count, startIndex);
        Mono<Long> countMono = count(criteriaList, aclPermission);
        return Mono.zip(countMono, userFlux.collectList()).map(pair -> {
            Long totalFilteredUsers = pair.getT1();
            List<User> usersPage = pair.getT2();
            return new PagedDomain<>(usersPage, usersPage.size(), startIndex, totalFilteredUsers);
        });
    }

    @Override
    public Flux<String> getUserEmailsByIdsAndTenantId(
            List<String> userIds, String tenantId, Optional<AclPermission> aclPermission) {
        Criteria criteriaUserIds = Criteria.where(fieldName(QUser.user.id)).in(userIds);
        Criteria criteriaTenantId =
                Criteria.where(fieldName(QUser.user.tenantId)).is(tenantId);
        List<String> includeFields = List.of(fieldName(QUser.user.email));
        return queryAll(
                        List.of(criteriaUserIds, criteriaTenantId),
                        Optional.of(includeFields),
                        aclPermission,
                        Optional.empty())
                .map(User::getEmail);
    }

    @Override
    public Mono<Long> countAllUsersByIsProvisioned(boolean isProvisioned, Optional<AclPermission> aclPermission) {
        Criteria criteriaIsProvisioned =
                Criteria.where(fieldName(QUser.user.isProvisioned)).is(isProvisioned);
        return count(List.of(criteriaIsProvisioned), aclPermission);
    }

    @Override
    public Mono<Boolean> updateUserPoliciesAndIsProvisionedWithoutPermission(
            String id, Boolean isProvisioned, Set<Policy> policies) {
        Update updateUser = new Update();
        updateUser.set(fieldName(QUser.user.isProvisioned), isProvisioned);
        updateUser.set(fieldName(QUser.user.policies), policies);
        return updateById(id, updateUser, Optional.empty()).thenReturn(Boolean.TRUE);
    }

    @Override
    public Flux<User> getAllUsersByIsProvisioned(
            boolean isProvisioned, Optional<List<String>> includeFields, Optional<AclPermission> aclPermission) {
        Criteria criteriaIsProvisioned =
                Criteria.where(fieldName(QUser.user.isProvisioned)).is(isProvisioned);
        return queryAll(List.of(criteriaIsProvisioned), includeFields, aclPermission, Optional.empty());
    }
}
