package com.appsmith.server.services;

import reactor.core.publisher.Mono;

public interface GoogleRecaptchaService {
  Mono<Boolean> verify(String recaptchaResponse);
}
