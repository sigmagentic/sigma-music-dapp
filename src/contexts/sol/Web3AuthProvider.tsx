import React, { createContext, useContext, useEffect, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from "@web3auth/base";
import { Web3Auth } from "@web3auth/modal";
import { SolanaPrivateKeyProvider, SolanaWallet } from "@web3auth/solana-provider";
import { useLocation } from "react-router-dom";
import { IS_DEVNET } from "appsConfig";
import { routeNames } from "routes";

interface Web3AuthContextType {
  web3auth: Web3Auth | null;
  isLoading: boolean;
  isConnected: boolean;
  publicKey: PublicKey | null;
  userInfo: {
    email: string | null;
    name: string | null;
    profileImage: string | null;
    verifier: string | null;
    verifierId: string | null;
    typeOfLogin: string | null;
    dappShare: string | null;
    idToken: string | null;
    oAuthIdToken: string | null;
    oAuthAccessToken: string | null;
  };
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signMessageViaWeb3Auth: (message: Uint8Array) => Promise<Uint8Array>;
}

const Web3AuthContext = createContext<Web3AuthContextType>({
  web3auth: null,
  isLoading: true,
  isConnected: false,
  publicKey: null,
  userInfo: {
    email: null,
    name: null,
    profileImage: null,
    verifier: null,
    verifierId: null,
    typeOfLogin: null,
    dappShare: null,
    idToken: null,
    oAuthIdToken: null,
    oAuthAccessToken: null,
  },
  connect: async () => {},
  disconnect: async () => {},
  signMessageViaWeb3Auth: async () => new Uint8Array(),
});

export const useWeb3Auth = () => useContext(Web3AuthContext);

const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.SOLANA,
  chainId: "0x1", // Mainnet
  rpcTarget: import.meta.env.VITE_ENV_SOLANA_NETWORK_RPC,
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
  const location = useLocation();
  const [userInfo, setUserInfo] = useState<Web3AuthContextType["userInfo"]>({
    email: null,
    name: null,
    profileImage: null,
    verifier: null,
    verifierId: null,
    typeOfLogin: null,
    dappShare: null,
    idToken: null,
    oAuthIdToken: null,
    oAuthAccessToken: null,
  });

  useEffect(() => {
    const init = async () => {
      try {
        const privateKeyProvider = new SolanaPrivateKeyProvider({
          config: { chainConfig },
        });

        // https://web3auth.io/docs/sdk/pnp/web/modal/initialize
        const web3authInstance = new Web3Auth({
          clientId: import.meta.env.VITE_WEB3AUTH_CLIENT_ID || "",
          web3AuthNetwork: IS_DEVNET ? WEB3AUTH_NETWORK.SAPPHIRE_DEVNET : WEB3AUTH_NETWORK.SAPPHIRE_MAINNET,
          chainConfig,
          privateKeyProvider,
          enableLogging: false,
          // uiConfig: {
          //   appName: "Sigma Music",
          //   loginMethodsOrder: ["email_passwordless"],
          //   defaultLanguage: "en",
          //   modalZIndex: "2147483647",
          //   loginGridCol: 3,
          //   mode: "dark",
          //   primaryButton: "emailLogin",
          //   theme: {
          //     primary: "#ffffff", // Primary button color
          //   },
          // },
        });

        await web3authInstance.initModal();
        setWeb3auth(web3authInstance);

        // Only auto-connect if we're not on the login page
        if (web3authInstance.connected && location.pathname !== routeNames.login) {
          const provider = web3authInstance.provider;

          if (provider) {
            const publicKeyBytes = await provider.request({ method: "solanaPublicKey" });
            if (publicKeyBytes) {
              setPublicKey(new PublicKey(publicKeyBytes as string));
              setIsConnected(true);
            }

            // Get all user info
            const _userInfo = await web3authInstance.getUserInfo();
            if (_userInfo) {
              setUserInfo({
                email: userInfo.email || null,
                name: userInfo.name || null,
                profileImage: userInfo.profileImage || null,
                verifier: userInfo.verifier || null,
                verifierId: userInfo.verifierId || null,
                typeOfLogin: userInfo.typeOfLogin || null,
                dappShare: userInfo.dappShare || null,
                idToken: userInfo.idToken || null,
                oAuthIdToken: userInfo.oAuthIdToken || null,
                oAuthAccessToken: userInfo.oAuthAccessToken || null,
              });
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
  }, [location.pathname]);

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

      // Get all user info
      const userInfo = await web3auth.getUserInfo();

      if (userInfo) {
        setUserInfo({
          email: userInfo.email || null,
          name: userInfo.name || null,
          profileImage: userInfo.profileImage || null,
          verifier: userInfo.verifier || null,
          verifierId: userInfo.verifierId || null,
          typeOfLogin: userInfo.typeOfLogin || null,
          dappShare: userInfo.dappShare || null,
          idToken: userInfo.idToken || null,
          oAuthIdToken: userInfo.oAuthIdToken || null,
          oAuthAccessToken: userInfo.oAuthAccessToken || null,
        });
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
      setUserInfo({
        email: null,
        name: null,
        profileImage: null,
        verifier: null,
        verifierId: null,
        typeOfLogin: null,
        dappShare: null,
        idToken: null,
        oAuthIdToken: null,
        oAuthAccessToken: null,
      });
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
        userInfo,
        connect,
        disconnect,
        signMessageViaWeb3Auth,
      }}>
      {children}
    </Web3AuthContext.Provider>
  );
};
