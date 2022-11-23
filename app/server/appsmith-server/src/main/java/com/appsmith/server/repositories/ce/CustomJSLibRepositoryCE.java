package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.repositories.AppsmithRepository;
import com.appsmith.server.repositories.BaseRepository;
import org.springframework.data.repository.NoRepositoryBean;
import reactor.core.publisher.Mono;

public interface CustomJSLibRepositoryCE extends AppsmithRepository<CustomJSLib> {
    Mono<CustomJSLib> findByAccessorString(String accessorString);
}
