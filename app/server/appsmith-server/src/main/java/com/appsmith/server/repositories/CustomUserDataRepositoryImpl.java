package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.CustomUserDataRepositoryCEImpl;
import org.springframework.stereotype.Component;

@Component
public class CustomUserDataRepositoryImpl extends CustomUserDataRepositoryCEImpl implements CustomUserDataRepository {}
