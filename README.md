[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)


# Palmy Protocol

This repository contains the smart contracts source code and markets configuration for Palmy Protocol. The repository uses Docker Compose and Hardhat as development enviroment for compilation, testing and deployment tasks.

## What is Palmy?

Palmy is a decentralized non-custodial liquidity markets protocol where users can participate as depositors or borrowers. Depositors provide liquidity to the market to earn a passive income, while borrowers are able to borrow in an overcollateralized (perpetually) or undercollateralized (one-block liquidity) fashion.

## Documentation

The documentation of Palmy is in the following [Palmy documentation](https://docs.palmy.finance/) link. At the documentation you can learn more about the protocol, see the contract interfaces, integration guides and audits.

For getting the latest contracts addresses, please check the [Deployed contracts](https://docs.palmy.finance/deployed-contracts/deployed-contracts) page at the documentation to stay up to date.


## Audits

Under construction

## Connect with the community

You can join at the [Discord](TODO:DISCORD_URL) channel for asking questions about the protocol or talk about Palmy with other peers.

## Getting Started

You can install `@palmy/palmy-protocol` as an NPM package in your Hardhat, Buidler or Truffle project to import the contracts and interfaces:

`npm install @palmy/palmy-protocol`

Import at Solidity files:

```
import {ILendingPool} from "@palmy/palmy-protocol/contracts/interfaces/ILendingPool.sol";

contract Misc {

  function deposit(address pool, address token, address user, uint256 amount) public {
    ILendingPool(pool).deposit(token, amount, user, 0);
    {...}
  }
}
```

The JSON artifacts with the ABI and Bytecode are also included into the bundled NPM package at `artifacts/` directory.

Import JSON file via Node JS `require`:

```
const LendingPoolV2Artifact = require('@palmy/palmy-protocol/artifacts/contracts/protocol/lendingpool/LendingPool.sol/LendingPool.json');

// Log the ABI into console
console.log(LendingPoolV2Artifact.abi)
```

## Setup

The repository uses Docker Compose to manage sensitive keys and load the configuration. Prior any action like test or deploy, you must run `docker-compose up` to start the `contracts-env` container, and then connect to the container console via `docker-compose exec contracts-env bash`.

Follow the next steps to setup the repository:

- Install `docker` and `docker-compose`
- Create an enviroment file named `.env` and fill the next enviroment variables

```
# Mnemonic, only first address will be used
MNEMONIC=""

# Add Alchemy or Infura provider keys, alchemy takes preference at the config level
ALCHEMY_KEY=""
INFURA_KEY=""


# Optional Etherscan key, for automatize the verification of the contracts at Etherscan
ETHERSCAN_KEY=""

```

## Markets configuration

The configurations related with the Palmy Markets are located at `markets` directory. You can follow the `IPalmyConfiguration` interface to create new Markets configuration or extend the current Palmy configuration.

Each market should have his own Market configuration file, and their own set of deployment tasks, using the Palmy market config and tasks as a reference.

## Test

You can run the full test suite with the following commands:

```
# In one terminal
docker-compose up

# Open another tab or terminal
docker-compose exec contracts-env bash

# A new Bash terminal is prompted, connected to the container
npm run test
```

## Deployments

For deploying Palmy-protocol, you can use the available scripts located at `package.json`. For a complete list, run `npm run` to see all the tasks.

### Shiden deployment

Shiden is development and testing environment.

```
# In one terminal
docker-compose up

# Open another tab or terminal
docker-compose exec contracts-env bash

# A new Bash terminal is prompted, connected to the container
npm run palmy:shiden:full:migration
```

# ElectroLend - Lending Protocol on Electroneum

ElectroLend is a decentralized lending protocol built on the Electroneum blockchain, allowing users to deposit, borrow, and earn interest on their crypto assets.

## Features

- Deposit assets to earn interest
- Borrow assets using your deposits as collateral
- Variable interest rates based on market demand
- Non-custodial - you always control your funds
- Modern and intuitive user interface

## Supported Assets

- ETN (Electroneum)
- USDC (USD Coin)
- USDT (Tether)

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MetaMask or another Ethereum-compatible wallet

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/electrolend.git
cd electrolend
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Smart Contracts

The lending protocol is powered by smart contracts deployed on the Electroneum testnet. The main contract addresses are:

- Lending Contract: `0x09308a46cb03915a530Cf4365078a3688ec90682`
- ETN Token: `0x154c9fD7F006b92b6afa746098d8081A831DC1FC`
- USDC Token: `0x9a110A3Ecc8704e93Bd4FA1bA44D5CF93327202B`
- USDT Token: `0x02FeC8c559fB598762df8D033bD7A3Df9b374771`

## Project Structure

```
electrolend/
├── public/              # Static assets
├── src/
│   ├── app/             # Next.js app router pages
│   ├── components/      # React components
│   ├── context/         # React context providers
│   └── utils/           # Utility functions
├── package.json         # Project dependencies
└── README.md            # Project documentation
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by Aave and other DeFi lending protocols
- Built for the Electroneum blockchain ecosystem
