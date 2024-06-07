package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.CustomActionCollectionRepositoryCEImpl;
import org.springframework.stereotype.Component;

@Component
public class CustomActionCollectionRepositoryImpl extends CustomActionCollectionRepositoryCEImpl
        implements CustomActionCollectionRepository {}
