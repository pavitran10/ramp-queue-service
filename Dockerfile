# Create image based on the official Node 6 image from the dockerhub
FROM node:14-alpine as development
# Create a directory where our app will be placed
RUN mkdir -p /ramp-up/queue/src/app
# Change directory so that our commands run inside this new directory
WORKDIR /ramp-up/queue/src/app
# Copy dependency definitions
COPY package.json /ramp-up/queue/src/app
# Install dependecies
RUN npm install
# Get all the code needed to run the app
COPY . /ramp-up/queue/src/app
# Expose the port the app runs in
EXPOSE 3001
# Serve the app
CMD ["npm", "start"]