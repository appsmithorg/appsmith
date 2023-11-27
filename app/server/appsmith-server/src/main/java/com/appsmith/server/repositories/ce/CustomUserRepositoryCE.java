package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.User;
import com.appsmith.server.repositories.AppsmithRepository;
import com.querydsl.core.types.dsl.StringPath;
import org.springframework.data.domain.Sort;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Optional;
import java.util.Set;
import java.util.List;

public interface CustomUserRepositoryCE extends AppsmithRepository<User> {

    Optional<User> findByEmail(String email, AclPermission aclPermission);

    List<User> findAllByEmails(Set<String> emails);

    Optional<User> findByCaseInsensitiveEmail(String email);

    Optional<User> findByEmailAndTenantId(String email, String tenantId);

    Optional<Boolean> isUsersEmpty();

    List<User> getAllByEmails(
            Set<String> emails,
            Optional<AclPermission> aclPermission,
            int limit,
            int skip,
            StringPath sortKey,
            Sort.Direction sortDirection);
}
