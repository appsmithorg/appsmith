package com.appsmith.server.repositories;

import com.appsmith.server.domains.NewPage;
import com.appsmith.server.repositories.ce.CustomNewPageRepositoryCE;
import reactor.core.publisher.Flux;

import java.util.List;

public interface CustomNewPageRepository extends CustomNewPageRepositoryCE {

    Flux<NewPage> findAllByApplicationIdsWithoutPermission(List<String> applicationId, List<String> includeFields);
}
