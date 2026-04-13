# 1. Use the official lightweight image for your language
FROM node:20-slim 
# (Or python:3.11-slim, golang:1.21-alpine, etc.)

# 2. Create and change to the app directory.
WORKDIR /usr/src/app

# 3. Install dependencies.
# For Node:
COPY package*.json ./
RUN npm install --only=production
# For Python:
# COPY requirements.txt ./
# RUN pip install -r requirements.txt

# 4. Copy local code to the container image.
COPY . .

# 5. DO NOT hardcode the port. Cloud Run will fail.
# Use the PORT environment variable injected by Cloud Run.
ENV PORT 8080
EXPOSE 8080

# 6. Run the web service on container startup.
# For Node:
CMD [ "npm", "start" ]
# For Python (Gunicorn/Uvicorn):
# CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 0 main:app