FROM ubuntu:latest
RUN echo 'nameserver 8.8.8.8' >> /etc/resolv.conf
RUN apt-get update
RUN apt-get install -y python3-pip zip
RUN echo 'alias md5="md5sum"' >> ~/.bashrc