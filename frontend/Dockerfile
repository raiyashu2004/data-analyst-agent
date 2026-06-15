FROM node:20-alpine

WORKDIR /app

# Install dependencies first for caching
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

# Expose the Vite development port
EXPOSE 3000

# Command to run the application, binding to 0.0.0.0 so it is accessible outside the container
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
