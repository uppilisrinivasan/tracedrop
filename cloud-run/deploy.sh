#!/bin/bash
# TraceDrop Cloud Run Deployment Script

set -e

PROJECT_ID="${GCP_PROJECT_ID:-tracedrop-project}"
REGION="${REGION:-asia-south1}"
SERVICE_NAME="tracedrop"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo "======================================"
echo "TraceDrop Cloud Run Deployment"
echo "======================================"
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "Image: $IMAGE_NAME"
echo ""

# Step 1: Build Docker image
echo "[1/4] Building Docker image..."
docker build -f Dockerfile.prod -t "$IMAGE_NAME:latest" .
docker tag "$IMAGE_NAME:latest" "$IMAGE_NAME:$(git rev-parse --short HEAD)"

# Step 2: Push to GCR
echo "[2/4] Pushing image to GCR..."
docker push "$IMAGE_NAME:latest"
docker push "$IMAGE_NAME:$(git rev-parse --short HEAD)"

# Step 3: Deploy to Cloud Run
echo "[3/4] Deploying to Cloud Run..."
gcloud run deploy "$SERVICE_NAME" \
  --image "$IMAGE_NAME:latest" \
  --platform managed \
  --region "$REGION" \
  --memory 512Mi \
  --cpu 1 \
  --timeout 60 \
  --max-instances 100

# Step 4: Get URL
echo "[4/4] Verifying deployment..."
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
  --platform managed \
  --region "$REGION" \
  --format 'value(status.url)')

echo ""
echo "Deployment Complete!"
echo "Service URL: $SERVICE_URL"
