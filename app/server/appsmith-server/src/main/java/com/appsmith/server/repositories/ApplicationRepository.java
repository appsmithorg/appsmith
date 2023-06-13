/* Copyright 2019-2023 Appsmith */
package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.ApplicationRepositoryCE;
import org.springframework.stereotype.Repository;

@Repository
public interface ApplicationRepository extends ApplicationRepositoryCE, CustomApplicationRepository {}
