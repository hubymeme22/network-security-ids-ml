from app.background.sniffer_worker import nsl_kdd_packet_parser
from app.background.sniffer_worker import nsl_kdd_features_to_array

from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import VotingClassifier
from scapy.all import sniff
from scapy.layers.inet import IP

import pickle

scaler = None
with open("../../experiments/scaler/scaler.pkl", "rb") as fp:
    scaler: StandardScaler = pickle.load(fp)
    fp.close()

ml_model = None
with open("../../experiments/ml_models/voting_classifier.pkl", "rb") as fp:
    ml_model: VotingClassifier = pickle.load(fp)

def poc(array: list):
    return scaler.fit_transform([array])


def packet_handler(packet):
    if packet.haslayer(IP):
        features = nsl_kdd_packet_parser(packet)
        features = nsl_kdd_features_to_array(features)

        scaled = poc(features)
        print(ml_model.predict(scaled))

if __name__ == "__main__":
    sniff(filter="ip", prn=packet_handler, store=0)
