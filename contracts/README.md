# ⛓️ CarbonCredit smart contract (Solidity)

`CarbonCredit.sol` is an ERC-721 contract for **tamper-proof issuance and retirement**
of verified carbon credits on Ethereum. Each token records its action type, CO₂
amount, and retirement status.

- `issueCredit(to, actionType, co2Grams)` — owner-only mint for AI-verified actions
- `retire(tokenId)` — holder permanently claims the offset
- `isRetired`, `totalIssued`, plus `CreditIssued` / `CreditRetired` events

## Deploy to Sepolia (free testnet)

**Easiest — Remix:**
1. Open [remix.ethereum.org](https://remix.ethereum.org), create `CarbonCredit.sol`, paste the contract (Remix auto-resolves the OpenZeppelin imports).
2. Compile with Solidity `0.8.20+`.
3. Deploy tab → environment **"Injected Provider - MetaMask"** (MetaMask on Sepolia, funded from a free faucet) → Deploy.
4. Copy the deployed address.

**Or Hardhat:**
```bash
npm i -D hardhat @openzeppelin/contracts
npx hardhat init
# put CarbonCredit.sol in contracts/, add a Sepolia network + deploy script, then:
npx hardhat run scripts/deploy.js --network sepolia
```

## Wire it into the app
Set these in `server/.env` (and your deploy env):
```
RPC_URL=https://sepolia.infura.io/v3/<key>
CONTRACT_ADDRESS=0x<deployed address>
PRIVATE_KEY=<platform wallet key>     # only if the server issues credits
```
The backend's `services/blockchain.js` then verifies on-chain transactions against
this contract/chain before trusting any blockchain hash a client submits.
