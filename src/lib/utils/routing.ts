import { AlphaRouter, SwapOptionsSwapRouter02, SwapRoute, SwapType } from '@uniswap/smart-order-router';
import { TradeType, CurrencyAmount, Percent, Token, ChainId } from '@uniswap/sdk-core';
import { fromReadableAmount } from './conversion';
import { ethers } from 'ethers';
import { CurrentConfig } from '~app/common/config/config';
import { ERC20_ABI, MAX_FEE_PER_GAS, MAX_PRIORITY_FEE_PER_GAS, TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER, V3_SWAP_ROUTER_ADDRESS } from '~app/constants/constants';

export enum TransactionState {
  Failed = 'Failed',
  New = 'New',
  Rejected = 'Rejected',
  Sending = 'Sending',
  Sent = 'Sent'
}

const sleep = async (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Transacting with a wallet extension via a Web3 Provider
async function sendTransactionViaExtension(wallet: ethers.providers.Web3Provider, transaction: ethers.providers.TransactionRequest): Promise<TransactionState> {
  try {
    const txRes = await wallet.getSigner()?.sendTransaction(transaction);
    let receipt = null;

    while (receipt === null) {
      try {
        receipt = await wallet.getTransactionReceipt(txRes.hash);

        if (receipt === null || receipt.status !== 1) {
          await sleep(1000);
          continue;
        }
      } catch (e) {
        console.log(`Receipt error:`, e);
        break;
      }
    }

    if (receipt && receipt.status === 1) {
      return TransactionState.Sent;
    } else {
      return TransactionState.Failed;
    }
  } catch (e) {
    console.log(e);
    return TransactionState.Rejected;
  }
}

export async function generateRoute(provider: ethers.providers.JsonRpcProvider, walletAddress: string, amount: number): Promise<SwapRoute | null> {
  const router = new AlphaRouter({
    chainId: ChainId.MAINNET,
    provider
  });

  const options: SwapOptionsSwapRouter02 = {
    recipient: walletAddress,
    slippageTolerance: new Percent(50, 10_000),
    deadline: Math.floor(Date.now() / 1000 + 1800),
    type: SwapType.SWAP_ROUTER_02
  };

  const route = await router.route(
    CurrencyAmount.fromRawAmount(CurrentConfig.tokens.out, fromReadableAmount(amount, CurrentConfig.tokens.out.decimals).toString()),
    CurrentConfig.tokens.in,
    TradeType.EXACT_OUTPUT,
    options
  );

  return route;
}

export async function executeRoute(
  provider: ethers.providers.JsonRpcProvider,
  walletAddress: string,
  wallet: ethers.providers.Web3Provider,
  route: SwapRoute,
  afterApprove?: () => void
): Promise<TransactionState> {
  if (!walletAddress || !provider) {
    throw new Error('Cannot execute a trade without a connected wallet');
  }

  const tokenApproval = await getTokenTransferApproval(provider, walletAddress, wallet, CurrentConfig.tokens.in);

  // Fail if transfer approvals do not go through
  if (tokenApproval !== TransactionState.Sent) {
    return TransactionState.Failed;
  }
  afterApprove && afterApprove();

  const res = await sendTransactionViaExtension(wallet, {
    data: route.methodParameters?.calldata,
    to: V3_SWAP_ROUTER_ADDRESS,
    value: route?.methodParameters?.value,
    from: walletAddress,
    maxFeePerGas: MAX_FEE_PER_GAS,
    maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS
  });

  return res;
}

export async function getTokenTransferApproval(
  provider: ethers.providers.JsonRpcProvider,
  walletAddress: string,
  wallet: ethers.providers.Web3Provider,
  token: Token
): Promise<TransactionState> {
  if (!provider || !walletAddress) {
    console.log('No Provider Found');
    return TransactionState.Failed;
  }

  try {
    const tokenContract = new ethers.Contract(token.address, ERC20_ABI, provider);

    const transaction = await tokenContract.populateTransaction.approve(
      V3_SWAP_ROUTER_ADDRESS,
      fromReadableAmount(TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER, token.decimals).toString()
    );

    return sendTransactionViaExtension(wallet, {
      ...transaction,
      from: walletAddress
    });
  } catch (e) {
    console.error(e);
    return TransactionState.Failed;
  }
}
