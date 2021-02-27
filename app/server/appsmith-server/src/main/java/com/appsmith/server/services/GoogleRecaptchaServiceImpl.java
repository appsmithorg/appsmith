package com.appsmith.server.services;

import javax.crypto.SecretKey;

import com.appsmith.server.configurations.GoogleRecaptchaConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class GoogleRecaptchaServiceImpl implements GoogleRecaptchaService {
  private final GoogleRecaptchaConfig googleRecaptchaConfig;

  private final String secretKey;

  @Autowired
  public GoogleRecaptchaServiceImpl(GoogleRecaptchaConfig googleRecaptchaConfig) {
      this.googleRecaptchaConfig = googleRecaptchaConfig;
      this.secretKey = googleRecaptchaConfig.getSecretKey();
  }

  @Override
  public boolean verify(String recaptchaResp){
    // TODO: Implement verification using google api.
    // Docs: https://developers.google.com/recaptcha/docs/v3
    return true;
  }
}
