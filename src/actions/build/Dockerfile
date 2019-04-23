FROM ubuntu:latest
RUN echo 'nameserver 8.8.8.8' >> /etc/resolv.conf
RUN echo '4' > /v.txt
RUN apt-get update --fix-missing
RUN apt-get install -y python3-pip zip nodejs npm python3.7
RUN echo 'alias md5="md5sum"' >> ~/.bashrc