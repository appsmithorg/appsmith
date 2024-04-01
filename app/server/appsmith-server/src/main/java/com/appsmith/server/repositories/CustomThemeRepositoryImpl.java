package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.CustomThemeRepositoryCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class CustomThemeRepositoryImpl extends CustomThemeRepositoryCEImpl implements CustomThemeRepository {}
