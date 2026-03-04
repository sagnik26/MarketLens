#!/bin/bash

echo "Checking build for NODE_ENV: $NODE_ENV on branch: $VERCEL_GIT_COMMIT_REF"

# main
if [[ "$NODE_ENV" == "production" ]]; then
  if [[ "$VERCEL_GIT_COMMIT_REF" == "main" ]]; then
    echo "✅ Production project matches main branch. Building..."
    exit 1
  else
    echo "🛑 Production project ignoring branch: $VERCEL_GIT_COMMIT_REF"
    exit 0
  fi

# dev
elif [[ "$NODE_ENV" == "development" ]]; then
  if [[ "$VERCEL_GIT_COMMIT_REF" == "dev" ]]; then
    echo "✅ Dev project matches dev branch. Building..."
    exit 1
  else
    echo "🛑 Dev project ignoring branch: $VERCEL_GIT_COMMIT_REF"
    exit 0
  fi

else
  echo "🛑 NODE_ENV ($NODE_ENV) not recognized. Skipping."
  exit 0
fi
