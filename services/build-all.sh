#!/bin/bash
# build-all.sh — Build all microservices in dependency order.
# Run from the services/ directory.
set -e

echo "==> Installing shared-lib..."
(cd shared-lib && mvn install -DskipTests -q)

echo "==> Building api-gateway..."
(cd api-gateway && mvn package -DskipTests -q)

for svc in auth-service user-service question-service execution-service test-service proctoring-service integrity-service notification-service; do
  echo "==> Building $svc..."
  (cd "$svc" && mvn package -DskipTests -q)
done

echo "✅  All services built successfully."
