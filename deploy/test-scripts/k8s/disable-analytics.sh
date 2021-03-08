#!/bin/bash

chmod +x $INSTALL_DIR/config-template/appsmith-configmap.yaml
echo '  APPSMITH_SEGMENT_CE_KEY: ""' >>$INSTALL_DIR/config-template/appsmith-configmap.yaml
