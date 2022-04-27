package com.appsmith.server.services.ce;

import com.appsmith.server.domains.UsagePulse;
import com.appsmith.server.repositories.ce.UsagePulseRepositoryCE;
import com.appsmith.server.services.SessionUserService;
import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Mono;

@RequiredArgsConstructor
public class UsagePulseServiceCEImpl implements UsagePulseServiceCE {

    private final UsagePulseRepositoryCE repository;

    private final SessionUserService sessionUserService;

    @Override
    public Mono<Void> createPulse() {
        return sessionUserService.getCurrentUser()
                .flatMap(user -> repository.save(new UsagePulse(user.getEmail())))
                .then();
    }

}
