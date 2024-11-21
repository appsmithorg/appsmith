package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.PluginType;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomPluginRepository;
import jakarta.persistence.EntityManager;

import java.util.List;
import java.util.Optional;

public interface PluginRepositoryCE extends BaseRepository<Plugin, String>, CustomPluginRepository {
    Optional<Plugin> findByName(String name, EntityManager entityManager);

    List<Plugin> findByNameIn(Iterable<String> names, EntityManager entityManager);

    Optional<Plugin> findByPackageName(String packageName, EntityManager entityManager);

    List<Plugin> findByDefaultInstall(Boolean isDefaultInstall, EntityManager entityManager);

    List<Plugin> findByType(PluginType pluginType, EntityManager entityManager);
}
