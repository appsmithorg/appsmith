package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.CustomApplicationSnapshotRepositoryCEImpl;
import org.springframework.stereotype.Component;

@Component
public class CustomApplicationSnapshotRepositoryImpl extends CustomApplicationSnapshotRepositoryCEImpl
        implements CustomApplicationSnapshotRepository {}
