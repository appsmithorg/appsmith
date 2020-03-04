package com.appsmith.server.repositories;

import com.appsmith.server.domains.Application;
import com.appsmith.server.services.AclEntity;
import org.springframework.data.domain.Example;
import org.springframework.data.repository.NoRepositoryBean;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
@AclEntity("applications")
public interface ApplicationRepository extends BaseRepository<Application, String>, CustomApplicationRepository {

}
