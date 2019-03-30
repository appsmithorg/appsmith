package com.mobtools.server.repositories;

import com.mobtools.server.domains.Plugin;
import org.springframework.stereotype.Repository;

@Repository
public interface PluginRepository extends BaseRepository<Plugin, String> {
}
