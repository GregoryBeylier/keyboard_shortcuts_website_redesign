FROM node:22.12-alpine
WORKDIR /front
COPY package.json .
RUN npm i
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev"]