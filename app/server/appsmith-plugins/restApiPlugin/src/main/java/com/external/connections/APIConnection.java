package com.external.connections;

import org.springframework.web.reactive.function.client.ExchangeFilterFunction;

// Parent type for all API connections that need to be created during datasource create method.
public abstract class APIConnection implements ExchangeFilterFunction {
}