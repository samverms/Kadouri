#!/bin/bash

if [ "$APP_TYPE" = "api" ]; then
    cd apps/api && npm start
elif [ "$APP_TYPE" = "web" ]; then
    cd apps/web && npm start
else
    echo "APP_TYPE not set. Please set to 'api' or 'web'"
    exit 1
fi
