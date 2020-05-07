package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.QUser;
import com.appsmith.server.domains.User;
import com.appsmith.server.helpers.PolicyUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.List;

import static org.springframework.data.mongodb.core.query.Criteria.where;

@Component
@Slf4j
public class CustomUserRepositoryImpl extends BaseAppsmithRepositoryImpl<User> implements CustomUserRepository {

    private final PolicyUtils policyUtils;

    public CustomUserRepositoryImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter, PolicyUtils policyUtils) {
        super(mongoOperations, mongoConverter, policyUtils);
        this.policyUtils = policyUtils;
    }

    @Override
    public Mono<User> findByEmail(String email, AclPermission aclPermission) {
        log.debug("Going to find user by email: {}", email);
        Criteria emailCriterita = where(fieldName(QUser.user.email)).is(email);

        return queryOne(List.of(emailCriterita), aclPermission);
    }
}
