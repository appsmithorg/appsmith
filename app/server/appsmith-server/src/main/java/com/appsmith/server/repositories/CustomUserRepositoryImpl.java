package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.CustomUserRepositoryCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class CustomUserRepositoryImpl extends CustomUserRepositoryCEImpl implements CustomUserRepository {}
