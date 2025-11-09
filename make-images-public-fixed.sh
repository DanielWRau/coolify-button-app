#!/bin/bash

# Get GitHub token
TOKEN=$(gh auth token)
ORG_OR_USER="danielwrau"  # Lowercase username

echo "Making frontend image public..."
curl -L -X PATCH \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "https://api.github.com/users/${ORG_OR_USER}/packages/container/coolify-button-app-frontend/visibility" \
  -d '{"visibility":"public"}'

echo -e "\n\nMaking backend image public..."
curl -L -X PATCH \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "https://api.github.com/users/${ORG_OR_USER}/packages/container/coolify-button-app-backend/visibility" \
  -d '{"visibility":"public"}'

echo -e "\n\nDone! Check packages at:"
echo "https://github.com/${ORG_OR_USER}?tab=packages"
