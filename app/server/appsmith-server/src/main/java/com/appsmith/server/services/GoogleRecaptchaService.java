package com.appsmith.server.services;

public interface GoogleRecaptchaService {
  boolean verify(String recaptchaResp);
}
