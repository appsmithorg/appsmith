package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.UsagePulseRepositoryCE;
import org.springframework.stereotype.Repository;

@Repository
public interface UsagePulseRepository extends UsagePulseRepositoryCE, CustomUsagePulseRepository {}
