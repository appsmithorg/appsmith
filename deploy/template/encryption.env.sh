#!/bin/sh

if [ ! -f encryption.env ]; then
    touch encryption.env
fi

cat >| encryption.env  << EOF
APPSMITH_ENCRYPTION_PASSWORD=$user_encryption_password
APPSMITH_ENCRYPTION_SALT=$user_encryption_salt

EOF
