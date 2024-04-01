package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.CustomConfigRepositoryCEImpl;
import org.springframework.stereotype.Component;

@Component
public class CustomConfigRepositoryImpl extends CustomConfigRepositoryCEImpl implements CustomConfigRepository {}
