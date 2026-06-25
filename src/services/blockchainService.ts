import { ethers } from 'ethers';

// Contract ABI - only the functions we need
const CONTRACT_ABI = [
  "function issueCredit(address to, string memory actionType, uint256 amount) public returns (uint256)",
  "function transferCredit(uint256 creditId, address to) public",
  "function getCredit(uint256 creditId) public view returns (address owner, string memory actionType, uint256 amount, uint256 timestamp)",
  "event CreditIssued(uint256 indexed creditId, address indexed owner, string actionType, uint256 amount)",
  "event CreditTransferred(uint256 indexed creditId, address indexed from, address indexed to)"
];

// Contract address from environment
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '0x5Cba4C8aA25B6096F02c5a02246EebAE7f6BA5f7';
const RPC_URL = import.meta.env.VITE_RPC_URL || 'https://sepolia.infura.io/v3/4eec69489d774fc29fe29e0ea9cb0f6f';

export interface Credit {
  creditId: string;
  owner: string;
  actionType: string;
  amount: number;
  timestamp: number;
}

export interface TransactionResult {
  success: boolean;
  txHash?: string;
  creditId?: string;
  error?: string;
}

class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private contract: ethers.Contract;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(RPC_URL);
    this.contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, this.provider);
  }

  /**
   * Connect user's wallet (MetaMask)
   */
  async connectWallet(): Promise<{ address: string; signer: ethers.Signer }> {
    // No MetaMask (or any injected wallet) → tell the user exactly what to do.
    if (typeof window === 'undefined' || typeof window.ethereum === 'undefined') {
      throw new Error('No wallet detected. Install the MetaMask browser extension (metamask.io), then refresh and try again.');
    }

    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      console.log('[Blockchain] Wallet connected:', address);
      return { address, signer };
    } catch (error: any) {
      // surface the real reason (user rejected, locked wallet, wrong network, …)
      if (error?.code === 4001) throw new Error('Connection request was rejected in MetaMask.');
      throw new Error(error?.message || 'Could not connect wallet. Make sure MetaMask is unlocked.');
    }
  }

  /**
   * Get user's wallet address if connected
   */
  async getConnectedAddress(): Promise<string | null> {
    try {
      if (typeof window === 'undefined' || typeof window.ethereum === 'undefined') {
        return null;
      }

      // Add timeout protection for the request
      const accounts = await Promise.race([
        window.ethereum.request({ method: 'eth_accounts' }),
        new Promise<string[]>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 2000)
        )
      ]);
      
      return accounts.length > 0 ? accounts[0] : null;
    } catch (error) {
      console.error('[Blockchain] Failed to get connected address:', error);
      return null;
    }
  }

  /**
   * Issue a new credit (called after AI verification)
   */
  async issueCredit(
    to: string,
    actionType: string,
    amount: number,
    signer: ethers.Signer
  ): Promise<TransactionResult> {
    try {
      console.log('[Blockchain] Issuing credit:', { to, actionType, amount });

      // Connect contract with signer
      const contractWithSigner = this.contract.connect(signer) as any;

      // Send transaction
      const tx = await contractWithSigner.issueCredit(to, actionType, amount);
      console.log('[Blockchain] Transaction sent:', tx.hash);

      // Wait for confirmation
      const receipt = await tx.wait();
      console.log('[Blockchain] Transaction confirmed:', receipt.hash);

      // Extract creditId from event
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = this.contract.interface.parseLog(log);
          return parsed?.name === 'CreditIssued';
        } catch {
          return false;
        }
      });

      let creditId = 'unknown';
      if (event) {
        const parsed = this.contract.interface.parseLog(event);
        creditId = parsed?.args?.creditId?.toString() || 'unknown';
      }

      return {
        success: true,
        txHash: receipt.hash,
        creditId
      };
    } catch (error: any) {
      console.error('[Blockchain] Issue credit failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to issue credit'
      };
    }
  }

  /**
   * Transfer/Sell a credit to another address
   */
  async transferCredit(
    creditId: string,
    toAddress: string,
    signer: ethers.Signer
  ): Promise<TransactionResult> {
    try {
      console.log('[Blockchain] Transferring credit:', { creditId, toAddress });

      // Connect contract with signer
      const contractWithSigner = this.contract.connect(signer) as any;

      // Send transaction
      const tx = await contractWithSigner.transferCredit(creditId, toAddress);
      console.log('[Blockchain] Transaction sent:', tx.hash);

      // Wait for confirmation
      const receipt = await tx.wait();
      console.log('[Blockchain] Transaction confirmed:', receipt.hash);

      return {
        success: true,
        txHash: receipt.hash,
        creditId
      };
    } catch (error: any) {
      console.error('[Blockchain] Transfer credit failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to transfer credit'
      };
    }
  }

  /**
   * Get credit details by ID
   */
  async getCredit(creditId: string): Promise<Credit | null> {
    try {
      console.log('[Blockchain] Getting credit:', creditId);

      const result = await this.contract.getCredit(creditId);
      
      return {
        creditId,
        owner: result[0],
        actionType: result[1],
        amount: Number(result[2]),
        timestamp: Number(result[3])
      };
    } catch (error) {
      console.error('[Blockchain] Get credit failed:', error);
      return null;
    }
  }

  /**
   * Check if user owns a specific credit
   */
  async isOwner(creditId: string, userAddress: string): Promise<boolean> {
    try {
      const credit = await this.getCredit(creditId);
      return credit ? credit.owner.toLowerCase() === userAddress.toLowerCase() : false;
    } catch (error) {
      console.error('[Blockchain] Check ownership failed:', error);
      return false;
    }
  }

  /**
   * Get contract address
   */
  getContractAddress(): string {
    return CONTRACT_ADDRESS;
  }

  /**
   * Get Etherscan link for transaction
   */
  getEtherscanLink(txHash: string): string {
    return `https://sepolia.etherscan.io/tx/${txHash}`;
  }

  /**
   * Get Etherscan link for address
   */
  getAddressLink(address: string): string {
    return `https://sepolia.etherscan.io/address/${address}`;
  }

  /**
   * Get Etherscan link for contract
   */
  getContractLink(): string {
    return `https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`;
  }
}

// Export singleton instance
export const blockchainService = new BlockchainService();

// Type definition for window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}
