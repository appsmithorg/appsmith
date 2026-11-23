package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.CustomMcpKeyRepositoryCEImpl;
import org.springframework.stereotype.Component;

@Component
public class CustomMcpKeyRepositoryImpl extends CustomMcpKeyRepositoryCEImpl implements CustomMcpKeyRepository {}
