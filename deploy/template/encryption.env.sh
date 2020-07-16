#!/bin/sh

if [ -f encryption.env ]
  then
    echo "file encryption.env already exists"
  else
    touch encryption.env
fi

cat > encryption.env  << EOF
APPSMITH_ENCRYPTION_PASSWORD=$user_encryption_password
APPSMITH_ENCRYPTION_SALT=$user_encryption_salt

EOF