package com.appsmith.server.repositories;

import com.appsmith.server.domains.Widget;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

@Repository
public interface WidgetRepository extends BaseRepository<Widget, String> {

    Mono<Widget> findByName(String name);
}
