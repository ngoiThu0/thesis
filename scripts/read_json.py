import json
import os
import glob
import pandas as pd
import numpy as np
import sys
from sklearn.preprocessing import LabelEncoder, MinMaxScaler
# Linear Models
from sklearn.linear_model import LogisticRegression
from typing import Tuple
from sklearn.base import BaseEstimator, TransformerMixin

from sklearn.model_selection import train_test_split





# package_ecosystem = "npm"
# package_name = "lodash"

if len(sys.argv) != 3:
    print("Usage: python read_json.py <package_name> <package_ecosystem>")
    sys.exit(1)

    package_name = sys.argv[1]
    package_ecosystem = sys.argv[2]

LOG_DIR = f"/tmp/results/{package_ecosystem}/{package_name}"

try:
    # List all files in the directory
    files = os.listdir(LOG_DIR)
    
    # Filter files that end with ".json"
    json_files = [file for file in files if file.endswith(".json")]
    
    # Print the list of JSON files
    print("JSON Files in Directory:")
    for json_file in json_files:
        print(json_file)
        
except FileNotFoundError:
    print(f"Directory '{folder_path}' not found.")
except Exception as e:
    print(f"An error occurred: {e}")

json_results = os.path.join(LOG_DIR, json_files[0])
with open(json_results, "r") as json_file:
    data = json.load(json_file)



df_npm = pd.DataFrame(columns=['sample_name', 'number_of_commands', 'number_of_domains', 'number_of_ips', 'label'])

sample_name = data['Package']['Name'] + '_' + data['Package']['Version']

# print(data['Analysis']['import'].keys())
# print([socket['Address'] for socket in data['Analysis']['import']['Sockets'] if len(socket['Address']) != 0])
# print([socket['Hostnames'][0] for socket in data['Analysis']['import']['Sockets'] if len(socket['Hostnames']) != 0])
# print([' '.join(cmd['Command']) for cmd in data['Analysis']['import']['Commands']])
# print(data['Analysis']['install'].keys())
# print([socket['Address'] for socket in data['Analysis']['install']['Sockets'] if len(socket['Address']) != 0])
# print([socket['Hostnames'][0] for socket in data['Analysis']['install']['Sockets'] if len(socket['Hostnames']) != 0])
# print([' '.join(cmd['Command']) for cmd in data['Analysis']['install']['Commands']])
# commands = [' '.join(cmd['Command']) for cmd in data['Analysis']['import']['Commands']] + [' '.join(cmd['Command']) for cmd in data['Analysis']['install']['Commands']]
# domains = [socket['Address'] for socket in data['Analysis']['import']['Sockets'] if len(socket['Address']) != 0] + [socket['Address'] for socket in data['Analysis']['install']['Sockets'] if len(socket['Address']) != 0]
# ips = [socket['Hostnames'][0] for socket in data['Analysis']['import']['Sockets'] if len(socket['Hostnames']) != 0] + [socket['Hostnames'][0] for socket in data['Analysis']['install']['Sockets'] if len(socket['Hostnames']) != 0]
import_commands = []
install_commands = []
import_domains = []
import_ips = []
install_domains = []
install_ips = []
if data['Analysis']['import']['Commands'] != None:
    import_commands = [' '.join(cmd['Command']) for cmd in data['Analysis']['import']['Commands']]
if data['Analysis']['install']['Commands'] != None:
    install_commands = [' '.join(cmd['Command']) for cmd in data['Analysis']['install']['Commands']]
if data['Analysis']['import']['Sockets'] != None:
    import_domains = [socket['Address'] for socket in data['Analysis']['import']['Sockets'] if len(socket['Address']) != 0]
    import_ips = [socket['Hostnames'][0] for socket in data['Analysis']['import']['Sockets'] if len(socket['Hostnames']) != 0]
if data['Analysis']['install']['Sockets'] != None:
    install_domains = [socket['Address'] for socket in data['Analysis']['install']['Sockets'] if len(socket['Address']) != 0]
    install_domains = [socket['Address'] for socket in data['Analysis']['install']['Sockets'] if len(socket['Hostnames']) != 0]

commands = import_commands + install_commands
domains = import_domains + install_domains
ips = import_ips + install_ips

row_data = {
    'sample_name': sample_name,
    'number_of_commands': len(set(commands)),
    'number_of_domains': len(set(domains)),
    'number_of_ips': len(set(ips)),
    'label': 'benign'
}

# Appending row_data to the DataFrame
df_npm = pd.concat([df_npm, pd.DataFrame([row_data])], ignore_index=True)

print(df_npm)


#train model 

df = pd.read_csv("/home/kali/thesis/thesis/scripts/dataset_df.csv")

df = df.reindex(np.random.permutation(df.index)) # shuffle the training set

# A list of feature names
feature_cols = ['number_of_commands', 'number_of_domains', 'number_of_ips']
# Split the dataset to training (80%) and test set (20%)
train, test = train_test_split(df, test_size=0.2, random_state=42)
# We want all rows, and the feature_cols' columns
X_train = train.loc[:, feature_cols]
# now we want to create our response vector
Y_train = train.label
# Now create a test set
X_test = test.loc[:, feature_cols]
# now we want to create our response vector
Y_test = test.label
le = LabelEncoder()
Y_train = le.fit_transform(Y_train)
Y_test = le.transform(Y_test)





def find_boxplot_boundaries(
    col: pd.Series, whisker_coeff: float = 1.5
) -> Tuple[float, float]:
    """Findx minimum and maximum in boxplot.

    Args:
        col: a pandas serires of input.
        whisker_coeff: whisker coefficient in box plot
    """
    Q1 = col.quantile(0.25)
    Q3 = col.quantile(0.75)
    IQR = Q3 - Q1
    lower = Q1 - whisker_coeff * IQR
    upper = Q3 + whisker_coeff * IQR
    return lower, upper


class BoxplotOutlierClipper(BaseEstimator, TransformerMixin):
    def __init__(self, whisker_coeff: float = 1.5):
        self.whisker = whisker_coeff
        self.lower = None
        self.upper = None

    def fit(self, X: pd.Series):
        self.lower, self.upper = find_boxplot_boundaries(X, self.whisker)
        return self

    def transform(self, X):
        return X.clip(self.lower, self.upper)

# handle outliers
clipper_commands = BoxplotOutlierClipper(whisker_coeff=1.5)
clipper_domains = BoxplotOutlierClipper(whisker_coeff=1.5)
clipper_ips = BoxplotOutlierClipper(whisker_coeff=1.5)

# Fit the clipper to the specified columns
clipper_commands.fit(X_train['number_of_commands'])
clipper_domains.fit(X_train['number_of_domains'])
clipper_ips.fit(X_train['number_of_ips'])

# Transform the specified columns
X_train['number_of_commands'] = clipper_commands.transform(X_train['number_of_commands'])
X_train['number_of_domains'] = clipper_domains.transform(X_train['number_of_domains'])
X_train['number_of_ips'] = clipper_ips.transform(X_train['number_of_ips'])

X_test['number_of_commands'] = clipper_commands.transform(X_test['number_of_commands'])
X_test['number_of_domains'] = clipper_domains.transform(X_test['number_of_domains'])
X_test['number_of_ips'] = clipper_ips.transform(X_test['number_of_ips'])

#normalization using min-max scaler
scaler = MinMaxScaler()

scaler.fit_transform(X_train)
X_train = scaler.transform(X_train)
X_test = scaler.transform(X_test)

# Let's try a very simple machine learning model called LogisticRegression
# 2. instantiate model

logreg = LogisticRegression()



# # 3. fit

logreg.fit(X_train, Y_train)


# predict npm packages

X_test_npm = df_npm.loc[:, feature_cols]
Y_test_npm = df_npm.label


#handle outlier 
X_test_npm['number_of_commands'] = clipper_commands.transform(X_test_npm['number_of_commands'])
X_test_npm['number_of_domains'] = clipper_domains.transform(X_test_npm['number_of_domains'])
X_test_npm['number_of_ips'] = clipper_ips.transform(X_test_npm['number_of_ips'])
# normalization using min-max scaler
X_test_npm = scaler.transform(X_test_npm)

Y_test_npm = le.fit_transform(Y_test_npm)

y_pred_proba = logreg.predict_proba(X_test_npm)

prob_class_0 = y_pred_proba[0][0]

# Convert to percentage
percentage_class_0 = prob_class_0 * 100

# Print the result
print(f"The probability of the sample being in class 0 is {percentage_class_0:.2f}%")