# Dockerfile with intentional issues for Hadolint testing

# DL3006: Always tag the version of an image explicitly
FROM ubuntu

# DL3008: Pin versions in apt-get install
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    python3 \
    nodejs

# DL3003: Use WORKDIR instead of cd
RUN cd /app && mkdir data

# DL3009: Delete apt-get lists after installing
# (Missing: && rm -rf /var/lib/apt/lists/*)

# DL3020: Use COPY instead of ADD for files
ADD ./app /app

# DL3025: Use JSON notation for CMD
CMD python3 app.py

# DL4006: Set SHELL option -o pipefail
RUN curl -sSL https://example.com/install.sh | bash

# DL3015: Avoid additional packages with apt-get install
# (Missing --no-install-recommends)

# Running as root (no USER instruction)
# DL3002: Last user should not be root

EXPOSE 8080

# DL3045: COPY with more than 2 arguments requires destination ending with /
COPY file1.txt file2.txt /app

# Multiple consecutive RUN instructions (should be combined)
RUN echo "step 1"
RUN echo "step 2"
RUN echo "step 3"
