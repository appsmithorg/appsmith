package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.UsagePulse;
import com.appsmith.server.repositories.BaseRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UsagePulseRepositoryCE extends BaseRepository<UsagePulse, String>, CustomUsagePulseRepositoryCE {}
