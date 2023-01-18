package com.appsmith.server.repositories;

import com.appsmith.server.domains.UsagePulse;
import com.appsmith.server.repositories.ce.UsagePulseRepositoryCE;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

import java.time.Instant;

@Repository
public interface UsagePulseRepository extends UsagePulseRepositoryCE, CustomUsagePulseRepository {
    Flux<UsagePulse> findAllByCreatedAtAfter(Instant createdAt, Pageable pageable);
}
