import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useWeb3Auth } from "./Web3AuthProvider";

interface SolanaWalletState {
  publicKey: PublicKey | null;
  isConnected: boolean;
  isLoading: boolean;
  connect: (a?: any) => Promise<void>;
  disconnect: () => Promise<void>;
  walletType: "phantom" | "web3auth" | null;
}

export const useSolanaWallet = (): SolanaWalletState => {
  const { publicKey: phantomPublicKey, connected: phantomConnected, select, wallets } = useWallet();
  const { publicKey: web3authPublicKey, isConnected: web3authConnected, isLoading, connect: web3authConnect, disconnect: web3authDisconnect } = useWeb3Auth();

  // Determine which wallet is active
  const walletType = phantomConnected ? "phantom" : web3authConnected ? "web3auth" : null;

  // Use the appropriate public key based on which wallet is connected
  const publicKey = phantomConnected ? phantomPublicKey : web3authPublicKey;
  const isConnected = phantomConnected || web3authConnected;

  // Connect function that handles both wallet types
  const connect = async ({ useWeb3AuthConnect }: { useWeb3AuthConnect: boolean }) => {
    if (phantomConnected || web3authConnected) return;

    // If Phantom wallet is available, use it by default
    if (wallets.length > 0 && !useWeb3AuthConnect) {
      select(wallets[0].adapter.name);
    } else {
      // Fallback to Web3Auth
      await web3authConnect();
    }
  };

  // Disconnect function that handles both wallet types
  const disconnect = async () => {
    if (phantomConnected) {
      // Phantom wallet doesn't have a direct disconnect method
      // It will disconnect automatically when the user disconnects in their wallet
      return;
    }
    if (web3authConnected) {
      await web3authDisconnect();
    }
  };

  return {
    publicKey,
    isConnected,
    isLoading,
    connect,
    disconnect,
    walletType,
  };
};
