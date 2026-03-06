#!/bin/bash

echo "Checking build for NODE_ENV: $PROJECT_ENV on branch: $VERCEL_GIT_COMMIT_REF"

# main
if [[ "$PROJECT_ENV" == "production" ]]; then
  if [[ "$VERCEL_GIT_COMMIT_REF" == "main" ]]; then
    echo "✅ Production project matches main branch. Building..."
    exit 1
  else
    echo "🛑 Production project ignoring branch: $VERCEL_GIT_COMMIT_REF"
    exit 0
  fi

# dev
elif [[ "$PROJECT_ENV" == "development" ]]; then
  if [[ "$VERCEL_GIT_COMMIT_REF" == "dev" ]]; then
    echo "✅ Dev project matches dev branch. Building..."
    exit 1
  else
    echo "🛑 Dev project ignoring branch: $VERCEL_GIT_COMMIT_REF"
    exit 0
  fi

else
  echo "🛑 PROJECT_ENV ($PROJECT_ENV) not recognized. Skipping."
  exit 0
fi
