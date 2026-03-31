# 🚀 Token Airdrop Tool dApp (Soroban + Stellar)

## 📌 Project Description

The **Token Airdrop Tool dApp** is a decentralized application built using the **Soroban smart contract platform** on the Stellar network. It enables users to distribute tokens efficiently to multiple recipients in a single transaction through an easy-to-use web interface.

This project combines a **Soroban smart contract (backend)** with a **user-friendly frontend (built using Stellar Lab / Stellar IDE)** to provide a seamless experience for bulk token distribution. It eliminates the need for repetitive manual transfers and reduces transaction overhead, making token distribution faster, cheaper, and more reliable.

---

🌐 Live dApp

👉 Access the Application:
🔗 https://token-airdrop-app.vercel.app/


<img width="1210" height="1448" alt="token-airdrop-app vercel app_new" src="https://github.com/user-attachments/assets/8967eaa5-1dd3-4b3d-8ea8-ee91792b57c3" />


<img width="1882" height="866" alt="Screenshot 2026-03-20 152357" src="https://github.com/user-attachments/assets/30e7f09e-f352-4ccb-a101-c7cf2e389eb6" />


![Desktop2026 03 27-21 19 50 01-ezgif com-optimize](https://github.com/user-attachments/assets/fd08523c-13b5-4f11-afe4-300d9a760fcc)

## 🎯 Problem Statement

Distributing tokens manually to multiple users is:

* Time-consuming
* Error-prone
* Inefficient

This dApp solves these issues by enabling **batch token transfers in one click**.

---

## ⚡ What it does

* Allows users to connect their wallet
* Accepts a list of recipient addresses and token amounts
* Executes batch token transfers using a Soroban smart contract
* Displays transaction results through the UI

---

## ✨ Features

* 🔗 **Wallet Integration** (Freighter / Stellar Wallet)
* 📤 **Batch Token Airdrop** via smart contract
* 🔐 **Secure Authorization** using Soroban
* ⚡ **Single Transaction Execution**
* 🖥️ **User-Friendly Interface (Stellar IDE UI)**
* 🔁 **Single Transfer Option**
* 📊 **Real-time Interaction with Blockchain**

---

## 🏗️ Architecture

### 🔹 Smart Contract (Backend)

* Written in **Rust using Soroban SDK**
* Handles:

  * Authorization
  * Token transfers
  * Batch processing

### 🔹 Frontend (dApp UI)

* Built using **React + typeScript + Next.js**
* Interacts with contract using:

  * Contract address
  * Function calls (`airdrop`, `single_transfer`)

---

## 🛠️ Tech Stack

* **Smart Contract:** Rust + Soroban SDK
* **Frontend:** Stellar Lab / Stellar IDE
* **Blockchain:** Stellar Network (Testnet/Mainnet)
* **Wallet:** Freighter

---

## 🧠 How it Works

1. User connects wallet
2. Enters:

   * Token contract address
   * Recipient addresses
   * Token amounts
3. Frontend sends request to smart contract
4. Contract:

   * Verifies authorization
   * Executes transfers
5. Tokens are distributed instantly

---

## 📄 Smart Contract Functions

### 🔹 `airdrop`

Batch transfer tokens to multiple recipients

### 🔹 `single_transfer`

Transfer tokens to a single recipient

---

## ⚙️ Setup & Installation

```bash
# Clone repository
git clone https://github.com/ArijitDebnath069/airdrop-dapp

# Go to project folder
cd airdrop-dapp

# Build smart contract
soroban contract build
```

---

## 🚀 Deployment

```bash
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/airdrop_contract.wasm \
  --source YOUR_ACCOUNT \
  --network testnet
```

---

## 🌐 Deployed dApp & Contract

* **Contract Address:** CBXY7ICF7XCUX72PPZYXEATHVIFJFSXTMUGKKCXPT5URXK5SNATFXIEY
* **Network:** Stellar Testnet 
* **Explorer:** https://stellar.expert/explorer/testnet/contract/CBXY7ICF7XCUX72PPZYXEATHVIFJFSXTMUGKKCXPT5URXK5SNATFXIEY

<img width="1886" height="866" alt="Screenshot 2026-03-20 145225" src="https://github.com/user-attachments/assets/9d7d39b2-0280-4687-84ad-5b61a9ff1ab3" />


---

## 👤 Author

* **Name:** ARIJIT DEBNATH
* **GitHub:** https://github.com/ArijitDebnath069
* **Email:** arijitdebnath008@gmail.com

---

## 🧪 Future Improvements

* 📦 Merkle Airdrop (claim-based system)
* 📊 Dashboard with analytics
* ⏳ Scheduled airdrops
* 📁 CSV upload for bulk recipients
* 🌐 Better UI/UX design

---

## 🤝 Contributing

Contributions are welcome! Feel free to fork this repository and submit pull requests.

---

## 📜 License

This project is licensed under the **MIT License**.

---

## ⭐ Acknowledgment

Built using **Soroban (Stellar Smart Contracts)** and Stellar development tools to enable scalable decentralized applications.
