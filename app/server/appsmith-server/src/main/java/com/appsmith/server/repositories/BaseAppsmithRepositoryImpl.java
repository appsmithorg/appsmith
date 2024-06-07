package com.appsmith.server.repositories;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public abstract class BaseAppsmithRepositoryImpl<T extends BaseDomain> extends BaseAppsmithRepositoryCEImpl<T> {}
