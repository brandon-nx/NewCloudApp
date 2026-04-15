FROM node:20-slim

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy everything else
COPY . .

# Ensure the port is set
ENV PORT 8080
EXPOSE 8080

# IMPORTANT: Make sure 'npm start' points to the right file in package.json
# If your main file is inside a folder, use: CMD ["node", "src/index.js"] 
CMD [ "npm", "start" ]