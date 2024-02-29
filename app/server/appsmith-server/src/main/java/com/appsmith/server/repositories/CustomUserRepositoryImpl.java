package com.appsmith.server.repositories;

import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.LoginSource;
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
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Pattern;

import static com.appsmith.server.constants.QueryParams.PROVISIONED_FILTER;
import static com.appsmith.server.constants.QueryParams.SEARCH_TERM;
import static com.appsmith.server.constants.QueryParams.SORT;
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
        query.addCriteria(where(User.Fields.tenantId).is(defaultTenantId));
        query.fields().include(User.Fields.email);
        return mongoOperations.find(query, User.class).map(User::getEmail);
    }

    @Override
    public Flux<User> getAllUserObjectsWithEmail(
            String defaultTenantId,
            MultiValueMap<String, String> filters,
            int startIndex,
            int pageLimit,
            Optional<AclPermission> aclPermission) {
        List<Criteria> criteriaList = new ArrayList<>();
        Criteria tenantIdCriteria = where(User.Fields.tenantId).is(defaultTenantId);
        criteriaList.add(tenantIdCriteria);
        List<String> includedFields = List.of(User.Fields.email, User.Fields.isProvisioned, User.Fields.policies);
        List<Criteria> criteriaListFromFilters = getCriteriaListFromFilters(filters);
        criteriaList.addAll(criteriaListFromFilters);

        Sort.Direction sortDirection = Sort.Direction.ASC;
        if (StringUtils.hasLength(filters.getFirst(SORT))) {
            try {
                sortDirection = Sort.Direction.fromString(filters.getFirst(SORT));
            } catch (IllegalArgumentException e) {
                log.debug("Invalid sort direction provided: {}", filters.getFirst(SORT));
                // Reset to default in case of error :
                sortDirection = Sort.Direction.ASC;
            }
        }
        Sort sort = Sort.by(sortDirection, User.Fields.email);

        return queryBuilder()
                .criteria(criteriaList)
                .fields(includedFields)
                .permission(aclPermission.orElse(null))
                .sort(sort)
                .limit(pageLimit)
                .skip(startIndex)
                .all();
    }

    @Override
    public Mono<PagedDomain<User>> getUsersWithParamsPaginated(
            int count, int startIndex, List<String> filterEmails, Optional<AclPermission> aclPermission) {
        List<Criteria> criteriaList = new ArrayList<>();
        Sort sortWithEmail = Sort.by(Sort.Direction.ASC, User.Fields.email);
        // Keeping this a case-insensitive, because provisioning clients require case-insensitive searches on emails.
        if (CollectionUtils.isNotEmpty(filterEmails)) {
            criteriaList.add(where(User.Fields.email).regex(getStringsToRegex(filterEmails), "i"));
        }
        Flux<User> userFlux = queryBuilder()
                .criteria(criteriaList)
                .permission(aclPermission.orElse(null))
                .sort(sortWithEmail)
                .limit(count)
                .skip(startIndex)
                .all();
        Mono<Long> countMono = queryBuilder()
                .criteria(criteriaList)
                .permission(aclPermission.orElse(null))
                .count();
        return Mono.zip(countMono, userFlux.collectList()).map(pair -> {
            Long totalFilteredUsers = pair.getT1();
            List<User> usersPage = pair.getT2();
            return new PagedDomain<>(usersPage, usersPage.size(), startIndex, totalFilteredUsers);
        });
    }

    @Override
    public Flux<String> getUserEmailsByIdsAndTenantId(
            List<String> userIds, String tenantId, Optional<AclPermission> aclPermission) {
        Criteria criteriaUserIds = Criteria.where(User.Fields.id).in(userIds);
        Criteria criteriaTenantId = Criteria.where(User.Fields.tenantId).is(tenantId);
        List<String> includeFields = List.of(User.Fields.email);
        return queryBuilder()
                .criteria(criteriaUserIds, criteriaTenantId)
                .fields(includeFields)
                .permission(aclPermission.orElse(null))
                .all()
                .map(User::getEmail);
    }

    @Override
    public Mono<Long> countAllUsersByIsProvisioned(boolean isProvisioned, Optional<AclPermission> aclPermission) {
        Criteria criteriaIsProvisioned =
                Criteria.where(User.Fields.isProvisioned).is(isProvisioned);
        return queryBuilder()
                .criteria(criteriaIsProvisioned)
                .permission(aclPermission.orElse(null))
                .count();
    }

    @Override
    public Mono<Boolean> updateUserPoliciesAndIsProvisionedWithoutPermission(
            String id, Boolean isProvisioned, Set<Policy> policies) {
        Update updateUser = new Update();
        updateUser.set(User.Fields.isProvisioned, isProvisioned);
        updateUser.set(User.Fields.policies, policies);
        return queryBuilder().byId(id).updateFirst(updateUser).thenReturn(Boolean.TRUE);
    }

    @Override
    public Flux<User> getAllUsersByIsProvisioned(
            boolean isProvisioned, Optional<List<String>> includeFields, Optional<AclPermission> aclPermission) {
        Criteria criteriaIsProvisioned =
                Criteria.where(User.Fields.isProvisioned).is(isProvisioned);
        return queryBuilder()
                .criteria(criteriaIsProvisioned)
                .fields(includeFields.orElse(null))
                .permission(aclPermission.orElse(null))
                .all();
    }

    private List<Criteria> getCriteriaListFromFilters(MultiValueMap<String, String> filters) {
        List<Criteria> criteriaList = new ArrayList<>();
        if (StringUtils.hasLength(filters.getFirst(PROVISIONED_FILTER))) {
            String provisionValue = filters.getFirst(PROVISIONED_FILTER).toLowerCase();
            if (provisionValue.equals(Boolean.TRUE.toString())) {
                criteriaList.add(where(User.Fields.isProvisioned).is(Boolean.TRUE));
            } else if (provisionValue.equals(Boolean.FALSE.toString())) {
                criteriaList.add(where(User.Fields.isProvisioned).is(Boolean.FALSE));
            }
        }
        if (StringUtils.hasLength(filters.getFirst(SEARCH_TERM))) {
            criteriaList.add(Criteria.where(User.Fields.email)
                    .regex(".*" + Pattern.quote(filters.getFirst(SEARCH_TERM)) + ".*", "i"));
        }
        return criteriaList;
    }

    @Override
    public Mono<Boolean> makeUserPristineBasedOnLoginSourceAndTenantId(LoginSource loginSource, String tenantId) {
        List<Criteria> criterias = new ArrayList<>();
        Criteria criteriaLoginSource = where(User.Fields.source).is(loginSource);
        Criteria tenantIdCriteria = where(User.Fields.tenantId).is(tenantId);
        criterias.add(tenantIdCriteria);
        criterias.add(criteriaLoginSource);

        Update update = new Update();
        update.set(User.Fields.source, LoginSource.FORM);
        update.set(User.Fields.isEnabled, false);
        return queryBuilder().criteria(criterias).updateAll(update).map(count -> count > 0);
    }

    @Override
    public Mono<Long> countAllUsers(MultiValueMap<String, String> queryParams, AclPermission aclPermission) {
        List<Criteria> criteriaList = getCriteriaListFromFilters(queryParams);
        return queryBuilder().criteria(criteriaList).permission(aclPermission).count();
    }
}
