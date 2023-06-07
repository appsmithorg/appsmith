/* Copyright 2019-2023 Appsmith */
package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.PluginRepositoryCE;

import org.springframework.stereotype.Repository;

@Repository
public interface PluginRepository extends PluginRepositoryCE, CustomPluginRepository {}
