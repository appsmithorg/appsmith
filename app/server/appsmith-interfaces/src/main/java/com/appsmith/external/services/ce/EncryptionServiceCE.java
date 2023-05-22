/* Copyright 2019-2023 Appsmith */
package com.appsmith.external.services.ce;

public interface EncryptionServiceCE {

  String encryptString(String plaintext);

  String decryptString(String encryptedText);
}
