package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.CustomPluginRepositoryCEImpl;
import org.springframework.stereotype.Component;

@Component
public class CustomPluginRepositoryImpl extends CustomPluginRepositoryCEImpl implements CustomPluginRepository {}
