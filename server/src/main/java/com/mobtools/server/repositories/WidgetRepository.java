package com.mobtools.server.repositories;

import com.mobtools.server.domains.Widget;
import org.springframework.stereotype.Repository;

@Repository
public interface WidgetRepository extends BaseRepository<Widget, Long> {

    Widget findByName(String name);
}
