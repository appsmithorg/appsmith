package com.mobtools.server.repositories;

import com.mobtools.server.domains.Widget;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

@Repository
public interface WidgetRepository extends BaseRepository<Widget, Long> {

    Mono<Widget> findByName(String name);
}
