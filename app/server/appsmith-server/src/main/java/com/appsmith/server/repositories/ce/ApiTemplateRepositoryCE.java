/* Copyright 2019-2023 Appsmith */
package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.ApiTemplate;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomApiTemplateRepository;

public interface ApiTemplateRepositoryCE
        extends BaseRepository<ApiTemplate, String>, CustomApiTemplateRepository {}
