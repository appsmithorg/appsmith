package com.appsmith.server.services;

import reactor.core.publisher.Mono;

public interface CaptchaService {
  Mono<Boolean> verify(String recaptchaResponse);
}
