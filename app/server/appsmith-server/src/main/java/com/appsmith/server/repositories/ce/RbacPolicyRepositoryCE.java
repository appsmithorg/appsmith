package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.RbacPolicy;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomRbacPolicyRepository;
import reactor.core.publisher.Mono;

public interface RbacPolicyRepositoryCE extends BaseRepository<RbacPolicy, String>, CustomRbacPolicyRepository {

    Mono<RbacPolicy> findByUserId(String id);

}
