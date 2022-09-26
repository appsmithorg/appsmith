package com.appsmith.server.services;

import com.appsmith.server.repositories.TenantRepository;
import com.appsmith.server.services.ce.TenantServiceCEImpl;
import org.springframework.stereotype.Service;

@Service
public class TenantServiceImpl extends TenantServiceCEImpl implements TenantService{
    
    public TenantServiceImpl(TenantRepository tenantRepository) {
        super(tenantRepository);
    }
}
