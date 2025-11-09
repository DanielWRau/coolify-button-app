#!/bin/bash

# Get GitHub token
TOKEN=$(gh auth token)

echo "Making frontend image public..."
curl -L -X PATCH \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  https://api.github.com/user/packages/container/coolify-button-app-frontend \
  -d '{"visibility":"public"}'

echo -e "\n\nMaking backend image public..."
curl -L -X PATCH \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  https://api.github.com/user/packages/container/coolify-button-app-backend \
  -d '{"visibility":"public"}'

echo -e "\n\nDone!"
