FROM node:18-alpine

WORKDIR /app

# Copy backend files
COPY backend/package*.json ./backend/
RUN cd backend && npm install

# Copy backend source
COPY backend/src ./backend/src

WORKDIR /app/backend

EXPOSE 3001

CMD ["npm", "start"]
