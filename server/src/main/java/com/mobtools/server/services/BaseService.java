package com.mobtools.server.services;

import lombok.RequiredArgsConstructor;
import reactor.core.scheduler.Scheduler;

@RequiredArgsConstructor
public abstract class BaseService {

    final Scheduler scheduler;
}