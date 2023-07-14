package com.appsmith.server.repositories;

import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.QUserGroup;
import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.dtos.PagedDomain;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.mongodb.client.result.UpdateResult;
import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static com.appsmith.server.constants.QueryParams.PROVISIONED_FILTER;
import static com.appsmith.server.helpers.RegexHelper.getStringsToRegex;
import static org.springframework.data.mongodb.core.query.Criteria.where;

@Component
public class CustomUserGroupRepositoryImpl extends BaseAppsmithRepositoryImpl<UserGroup>
        implements CustomUserGroupRepository {

    private final ReactiveMongoOperations reactiveMongoOperations;

    public CustomUserGroupRepositoryImpl(
            ReactiveMongoOperations mongoOperations,
            MongoConverter mongoConverter,
            CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
        this.reactiveMongoOperations = mongoOperations;
    }

    @Override
    public Flux<UserGroup> findAllByTenantId(
            String tenantId, MultiValueMap<String, String> filters, AclPermission aclPermission) {
        Criteria criteria = where(fieldName(QUserGroup.userGroup.tenantId)).is(tenantId);
        List<Criteria> criteriaListFromFilters = getCriteriaListFromFilters(filters);
        List<Criteria> allCriteria = new ArrayList<>();
        allCriteria.add(criteria);
        allCriteria.addAll(criteriaListFromFilters);
        return queryAll(allCriteria, aclPermission);
    }

    @Override
    public Flux<UserGroup> findAllByTenantIdWithoutPermission(String tenantId, List<String> includeFields) {
        Criteria criteria = where(fieldName(QUserGroup.userGroup.tenantId)).is(tenantId);
        return queryAll(List.of(criteria), includeFields, null, null, NO_RECORD_LIMIT);
    }

    @Override
    public Mono<UserGroup> findByIdAndTenantIdithoutPermission(String id, String tenantId) {
        Criteria idCriteria = where(fieldName(QUserGroup.userGroup.id)).is(id);
        Criteria tenantIdCriteria =
                where(fieldName(QUserGroup.userGroup.tenantId)).is(tenantId);

        Criteria andCriteria = new Criteria();
        andCriteria.andOperator(idCriteria, tenantIdCriteria, notDeleted());

        Query query = new Query();
        query.addCriteria(andCriteria);
        return mongoOperations.findOne(query, UserGroup.class);
    }

    @Override
    public Flux<UserGroup> findAllByIds(Set<String> ids, AclPermission aclPermission) {
        Criteria criteria = where(fieldName(QUserGroup.userGroup.id)).in(ids);
        return queryAll(List.of(criteria), aclPermission);
    }

    public Flux<UserGroup> findAllByUsersIn(Set<String> userIds, AclPermission aclPermission) {
        Criteria criteria = where(fieldName(QUserGroup.userGroup.users)).in(userIds);
        return queryAll(List.of(criteria), aclPermission);
    }

    @Override
    public Mono<UpdateResult> updateById(String id, Update updateObj) {
        if (id == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }
        Query query = new Query(Criteria.where("id").is(id));
        return mongoOperations.updateFirst(query, updateObj, this.genericDomain);
    }

    @Override
    public Mono<Long> countAllReadableUserGroups() {
        return count(List.of(), AclPermission.READ_USER_GROUPS);
    }

    @Override
    public Flux<UserGroup> getAllByUsersIn(
            Set<String> userIds, Optional<List<String>> includeFields, Optional<AclPermission> permission) {
        Criteria criteriaUserIdsIn =
                where(fieldName(QUserGroup.userGroup.users)).in(userIds);
        return queryAll(List.of(criteriaUserIdsIn), includeFields, permission, Optional.empty(), NO_RECORD_LIMIT);
    }

    @Override
    public Mono<PagedDomain<UserGroup>> findUserGroupsWithParamsPaginated(
            int count,
            int startIndex,
            List<String> groupNames,
            List<String> filterUserIds,
            Optional<AclPermission> aclPermission) {
        List<Criteria> criteriaList = new ArrayList<>();
        Sort sortWithEmail = Sort.by(Sort.Direction.ASC, fieldName(QUserGroup.userGroup.name));
        // Keeping this a case-insensitive, because provisioning clients require case-insensitive searches on group
        // names.
        if (CollectionUtils.isNotEmpty(groupNames)) {
            criteriaList.add(where(fieldName(QUserGroup.userGroup.name)).regex(getStringsToRegex(groupNames), "i"));
        }
        if (!Optional.ofNullable(filterUserIds).isEmpty() && filterUserIds.size() > 0) {
            criteriaList.add(where(fieldName(QUserGroup.userGroup.users)).in(filterUserIds));
        }
        Flux<UserGroup> userFlux =
                queryAll(criteriaList, Optional.empty(), aclPermission, sortWithEmail, count, startIndex);
        Mono<Long> countMono = count(criteriaList, aclPermission);
        return Mono.zip(countMono, userFlux.collectList()).map(pair -> {
            Long totalFilteredUserGroups = pair.getT1();
            List<UserGroup> userGroupsPage = pair.getT2();
            return new PagedDomain<>(userGroupsPage, userGroupsPage.size(), startIndex, totalFilteredUserGroups);
        });
    }

    @Override
    public Mono<Long> countAllUserGroupsByIsProvisioned(boolean isProvisioned, Optional<AclPermission> aclPermission) {
        Criteria criteriaIsProvisioned =
                Criteria.where(fieldName(QUserGroup.userGroup.isProvisioned)).is(isProvisioned);
        return count(List.of(criteriaIsProvisioned), aclPermission);
    }

    @Override
    public Flux<UserGroup> getAllUserGroupsByIsProvisioned(
            boolean isProvisioned, Optional<List<String>> includeFields, Optional<AclPermission> aclPermission) {
        Criteria criteriaIsProvisioned =
                Criteria.where(fieldName(QUserGroup.userGroup.isProvisioned)).is(isProvisioned);
        return queryAll(List.of(criteriaIsProvisioned), includeFields, aclPermission, Optional.empty());
    }

    @Override
    public Mono<Boolean> updateProvisionedUserGroupsPoliciesAndIsProvisionedWithoutPermission(
            Boolean isProvisioned, Set<Policy> policies) {
        Criteria criteriaIsProvisioned =
                Criteria.where(fieldName(QUserGroup.userGroup.isProvisioned)).is(true);
        Update updateGroup = new Update();
        updateGroup.set(fieldName(QUserGroup.userGroup.isProvisioned), isProvisioned);
        updateGroup.set(fieldName(QUserGroup.userGroup.policies), policies);
        return updateByCriteria(List.of(criteriaIsProvisioned), updateGroup).thenReturn(Boolean.TRUE);
    }

    private List<Criteria> getCriteriaListFromFilters(MultiValueMap<String, String> filters) {
        List<Criteria> criteriaList = new ArrayList<>();
        if (StringUtils.isNotEmpty(filters.getFirst(PROVISIONED_FILTER))) {
            String provisionValue = filters.getFirst(PROVISIONED_FILTER).toLowerCase();
            if (provisionValue.equals(Boolean.TRUE.toString())) {
                criteriaList.add(
                        where(fieldName(QUserGroup.userGroup.isProvisioned)).is(Boolean.TRUE));
            } else if (provisionValue.equals(Boolean.FALSE.toString())) {
                criteriaList.add(
                        where(fieldName(QUserGroup.userGroup.isProvisioned)).is(Boolean.FALSE));
            }
        }
        return criteriaList;
    }
}
