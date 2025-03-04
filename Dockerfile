FROM ubuntu:noble
ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update
RUN apt-get upgrade -y
RUN apt-get update
RUN apt-get upgrade -y

RUN apt-get remove -y python3.12
RUN apt-get install -y software-properties-common
RUN add-apt-repository ppa:deadsnakes/ppa -y
RUN apt-get update -y
RUN apt-get install -y python3.11
RUN python3 --version
RUN apt-get install -y python3-pip


#utils
RUN mkdir -p /usr/utils
COPY utils/ /usr/utils


# web service
RUN mkdir -p /usr/src/app/src
RUN mkdir -p /usr/temp

#install Node.js
WORKDIR /usr/src/app
RUN apt-get install -y curl
RUN curl -sL https://deb.nodesource.com/setup_22.x | bash -
RUN apt-get install -y nodejs

#copy app bin
COPY src/ /usr/src/app/src
COPY package-lock.json/ /usr/src/app
COPY package.json/ /usr/src/app
COPY tsconfig.json/ /usr/src/app
WORKDIR /usr/src/app
RUN npm install
RUN npm install -g ts-node

# run
EXPOSE 3335

ENV TEMP_RUN_FOLDERS="/usr/temp"
ENV PROPERTY_CHECKER="/usr/utils/property_plan_checker/main.py"
ENV VAL="/usr/utils/property_plan_checker/validate"

WORKDIR /usr/src/app/
CMD npm start
