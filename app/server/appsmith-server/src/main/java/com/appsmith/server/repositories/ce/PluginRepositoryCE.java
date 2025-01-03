package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.PluginType;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomPluginRepository;

import java.util.List;
import java.util.Optional;

public interface PluginRepositoryCE extends BaseRepository<Plugin, String>, CustomPluginRepository {
    Optional<Plugin> findByName(String name);

    List<Plugin> findByNameIn(Iterable<String> names);

    Optional<Plugin> findByPackageName(String packageName);

    List<Plugin> findByDefaultInstall(Boolean isDefaultInstall);

    List<Plugin> findByType(PluginType pluginType);
}
