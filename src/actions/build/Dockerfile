FROM ubuntu:latest
RUN echo '5' > /v.txt

RUN apt-get update --fix-missing
RUN DEBIAN_FRONTEND="noninteractive" TZ="Europe/London" apt-get install -y python3-pip zip nodejs npm python3.7
RUN echo 'alias md5="md5sum"' >> ~/.bashrc
RUN echo 'alias python3.7="python3"' >> ~/.bashrc