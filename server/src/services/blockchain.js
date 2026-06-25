const { ethers } = require('ethers');
const env = require('../config/env');
const logger = require('../config/logger');

let provider = null;
function getProvider() {
  if (!provider && env.rpcUrl) provider = new ethers.JsonRpcProvider(env.rpcUrl);
  return provider;
}

function isConfigured() {
  return Boolean(env.rpcUrl);
}

// Verify a client-supplied tx hash actually exists on-chain, succeeded, and was
// mined on the expected chain. Optionally check it touched our contract / wallet.
// Returns { ok, reason, receipt } — callers must NOT trust a hash without this.
async function verifyTransaction(txHash, { from, to } = {}) {
  if (!isConfigured()) {
    return { ok: false, reason: 'blockchain_not_configured' };
  }
  if (!/^0x([A-Fa-f0-9]{64})$/.test(txHash || '')) {
    return { ok: false, reason: 'invalid_hash_format' };
  }

  try {
    const p = getProvider();
    const receipt = await p.getTransactionReceipt(txHash);
    if (!receipt) return { ok: false, reason: 'tx_not_found_or_pending' };
    if (receipt.status !== 1) return { ok: false, reason: 'tx_reverted' };

    const net = await p.getNetwork();
    if (Number(net.chainId) !== env.chainId) {
      return { ok: false, reason: 'wrong_chain' };
    }
    if (to && receipt.to && receipt.to.toLowerCase() !== to.toLowerCase()) {
      return { ok: false, reason: 'unexpected_contract' };
    }
    if (from && receipt.from && receipt.from.toLowerCase() !== from.toLowerCase()) {
      return { ok: false, reason: 'unexpected_sender' };
    }
    return { ok: true, receipt: { blockNumber: receipt.blockNumber, from: receipt.from, to: receipt.to } };
  } catch (err) {
    logger.error({ err: err.message, txHash }, 'Blockchain verification error');
    return { ok: false, reason: 'rpc_error' };
  }
}

module.exports = { verifyTransaction, isConfigured };
