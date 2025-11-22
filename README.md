
# 🎰 Casino — Web3 Gaming Platform

A decentralized casino platform built on Polygon featuring provably fair games, instant payouts, and true digital ownership.

## 🚀 Features

- **♠️ Texas Hold'em Poker** — Multiplayer poker with real-time betting
- **🎯 Slot Machines** — Classic slots with progressive jackpots
- **🃏 Blackjack** — Beat the dealer with strategic gameplay
- **👤 Player Profiles** — Soulbound tokens and achievement system
- **🏆 Leaderboards** — Competitive rankings and tournaments
- **💰 Instant Payouts** — Direct MATIC transfers on Polygon

## 🛠 Tech Stack

### Smart Contracts
- **Solidity** ^0.8.19
- **Hardhat** — Development framework
- **OpenZeppelin** — Security and standard libraries
- **Polygon Amoy** — Testnet deployment

### Frontend
- **React 18** — UI framework
- **Vite** — Build tool
- **Ethers.js** — Web3 interactions
- **Lucide React** — Icon library
- **Framer Motion** — Animations

## 📦 Quick Start

### Prerequisites
- Node.js 16+
- MetaMask wallet
- Polygon Amoy testnet MATIC

### Installation

#### 1. Clone the repository

```bash
git clone <repository-url>
cd casino
```

#### 2. Install dependencies

```bash
# Contract dependencies
cd contracts
npm install

# Frontend dependencies
cd ../frontend
npm install
```

#### 3. Configure environment

```bash
cd contracts
cp .env.example .env
```

Edit `.env` and add:

```
PRIVATE_KEY=your_wallet_private_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key
MUMBAI_RPC_URL=https://rpc-amoy.polygon.technology
```

#### 4. Deploy contracts

```bash
cd contracts
npx hardhat run scripts/deploy-all-games.js --network amoy
```

#### 5. Run frontend

```bash
cd ../frontend
npm run dev
```

The app will launch at:
**http://localhost:3000**

## 🔗 Contract Addresses

Update:

`frontend/src/contexts/Web3Context.jsx`

```javascript
const CONTRACT_ADDRESSES = {
  paymentProcessor: "0x...",
  pokerGame: "0x...",
  slotMachine: "0x...",
  blackjack: "0x...",
  soulboundToken: "0x..."
};
```

## 🎯 Getting Test MATIC

1. Visit Polygon Faucet
2. Select **Amoy** network
3. Connect your wallet
4. Request test MATIC

## 🧪 Contract Development

Install dependencies:

```bash
npm install
```

Compile:

```bash
npx hardhat compile
```

Run tests:

```bash
npx hardhat test
```

Deploy to Amoy:

```bash
npx hardhat run scripts/deploy-all-games.js --network amoy
```
