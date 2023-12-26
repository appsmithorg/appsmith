package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.ApiTemplate;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomApiTemplateRepository;
import java.util.List;
import java.util.Optional;

public interface ApiTemplateRepositoryCE extends BaseRepository<ApiTemplate, String>, CustomApiTemplateRepository {}
