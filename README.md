# Application of ML for Intrusion Detection System
My collection of research for application of Machine Learning and Deeplearning Technologies for implementing Intrusion Detection Systems. The goal of this research is to experiment with different approaches and patterns and apply different models potentially making the detection to either have a better accuracy and/or implement a much faster approach when detecting network anomalies.

The dataset used in this research is called [NSL-KDD](https://www.kaggle.com/datasets/hassan06/nslkdd).

## Experiment Setup
To install the dataset from kaggle and extract, simply execute the following: 
```bash

# pulls the dataset from kaggle to the experiments folder
cd experiments
curl -L -o ./dataset/nslkdd.zip \
  https://www.kaggle.com/api/v1/datasets/download/hassan06/nslkdd

# unzip the dataset contents
cd dataset/ && unzip nslkdd.zip && rm -rf nsl-kdd/
```

This will pull the dataset from kaggle and extracts the contents of nsl-kdd dataset to the `dataset` folder.
