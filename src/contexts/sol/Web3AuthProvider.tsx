import React, { createContext, useContext, useEffect, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from "@web3auth/base";
import { Web3Auth } from "@web3auth/modal";
import { SolanaPrivateKeyProvider, SolanaWallet } from "@web3auth/solana-provider";

interface Web3AuthContextType {
  web3auth: Web3Auth | null;
  isLoading: boolean;
  isConnected: boolean;
  publicKey: PublicKey | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signMessageViaWeb3Auth: (message: Uint8Array) => Promise<Uint8Array>;
}

const Web3AuthContext = createContext<Web3AuthContextType>({
  web3auth: null,
  isLoading: true,
  isConnected: false,
  publicKey: null,
  connect: async () => {},
  disconnect: async () => {},
  signMessageViaWeb3Auth: async () => new Uint8Array(),
});

export const useWeb3Auth = () => useContext(Web3AuthContext);

const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.SOLANA,
  chainId: "0x1", // Mainnet
  rpcTarget: import.meta.env.VITE_ENV_SOLANA_NETWORK_RPC || "https://rpc.ankr.com/solana",
  displayName: "Solana Mainnet",
  blockExplorerUrl: "https://explorer.solana.com",
  ticker: "SOL",
  tickerName: "Solana",
  logo: "https://images.toruswallet.io/solana.svg",
};

export const Web3AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [web3auth, setWeb3auth] = useState<Web3Auth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const privateKeyProvider = new SolanaPrivateKeyProvider({
          config: { chainConfig },
        });

        const web3authInstance = new Web3Auth({
          clientId: import.meta.env.VITE_WEB3AUTH_CLIENT_ID || "",
          web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
          chainConfig,
          privateKeyProvider,
          enableLogging: false,
          uiConfig: {
            appName: "Sigma Music",
            loginMethodsOrder: ["email_passwordless"],
            defaultLanguage: "en",
            modalZIndex: "2147483647",
            loginGridCol: 3,
            mode: "dark",
          },
        });

        await web3authInstance.initModal();
        setWeb3auth(web3authInstance);

        if (web3authInstance.connected) {
          const provider = web3authInstance.provider;
          if (provider) {
            const publicKeyBytes = await provider.request({ method: "solanaPublicKey" });
            if (publicKeyBytes) {
              setPublicKey(new PublicKey(publicKeyBytes as string));
              setIsConnected(true);
            }
          }
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Error initializing Web3Auth:", error);
        setIsLoading(false);
      }
    };

    init();
  }, []);

  const connect = async () => {
    if (!web3auth) {
      console.error("Web3Auth not initialized");
      return;
    }
    try {
      const provider = await web3auth.connect();
      if (!provider) {
        throw new Error("Failed to connect to Web3Auth");
      }

      // Get the public key
      const publicKeyBytes = await provider.request({ method: "solanaPublicKey" });
      if (publicKeyBytes) {
        setPublicKey(new PublicKey(publicKeyBytes as string));
      }

      setIsConnected(true);
    } catch (error) {
      console.error("Error connecting to Web3Auth:", error);
    }
  };

  const disconnect = async () => {
    if (!web3auth) {
      console.error("Web3Auth not initialized");
      return;
    }
    try {
      await web3auth.logout();
      setIsConnected(false);
      setPublicKey(null);
    } catch (error) {
      console.error("Error disconnecting from Web3Auth:", error);
    }
  };

  const signMessageViaWeb3Auth = async (message: Uint8Array) => {
    if (!web3auth?.provider) {
      throw new Error("Web3Auth not initialized");
    }

    const solanaWallet = new SolanaWallet(web3auth.provider);
    return await solanaWallet.signMessage(message);
  };

  return (
    <Web3AuthContext.Provider
      value={{
        web3auth,
        isLoading,
        isConnected,
        publicKey,
        connect,
        disconnect,
        signMessageViaWeb3Auth,
      }}>
      {children}
    </Web3AuthContext.Provider>
  );
};
