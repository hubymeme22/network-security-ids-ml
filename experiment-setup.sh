#!/bin/bash
cd experiments
curl -L -o ./dataset/nslkdd.zip \
  https://www.kaggle.com/api/v1/datasets/download/hassan06/nslkdd

# unzip the dataset contents
cd dataset/ && unzip nslkdd.zip && rm -rf nsl-kdd/
