# Dynamic Analysis of Open-Source Packages and Applying Machine Learning for Malicious Open-Source Packages Detection



This repository contains the source code and data for the thesis titled **"Dynamic Analysis of Open-Source Packages and Applying Machine Learning for Malicious Open-Source Packages Detection."** The objective of this thesis is to provide data analysis through dynamic analysis using an open-source package named `package-analysis`. The dataset is available in Google BigQuery. Furthermore, this thesis aims to create a methodology to obtain malicious and benign packages and apply machine learning to automatically classify malicious open-source packages.

## Table of Contents

- [Objective](##objective)
- [Contents](##contents)
- [Installation](##installation)
- [Usage](##usage)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgements](#acknowledgements)

## Objective

The objective of this thesis is to:
1. Perform dynamic analysis using the `package-analysis` open-source package.
2. Obtain and analyze datasets from Google BigQuery.
3. Create a methodology to distinguish between malicious and benign packages.
4. Apply machine learning techniques to automatically classify malicious open-source packages.

## Contents

In this repository, you can find:

- **Thesis Reports:**
  - Detailed documentation and findings of the thesis.
- **Web Application:**
  - A web application to automatically classify malicious npm packages based on results provided by `package-analysis` tools.
- **Colab Notebook:**
  - A Colab notebook for training and evaluating machine learning models.
- **Dataset:**
  - Datasets for malicious and benign packages.

## Installation

To get started with this project, follow these steps:

1. Clone the repository:
    ```sh
    https://github.com/ngoiThu0/thesis.git
    cd thesis
    ```

2. Install the required dependencies:
    ```sh
    npm install

    node resource/index.js
    ```

## Usage

### Running the Web Application

To run the web application for classifying npm packages:

```sh
cd cd thesis
node resource/index.js
