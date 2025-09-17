import { useEffect, useState } from "react";
import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { SolAddressLink } from "components/SolAddressLink";
import { MINTER_WALLET, SOLANA_NETWORK_RPC, APP_NETWORK } from "../config";

interface MintTransaction {
  signature: string;
  timestamp: number;
  status: "success" | "failed";
  mintAddress?: string;
}

export const StatusBoard = () => {
  const [minterBalance, setMinterBalance] = useState<number | null>(null);
  const [recentMints, setRecentMints] = useState<MintTransaction[]>([]);
  const [showRecentMints, setShowRecentMints] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [storyMinterBalance, setStoryMinterBalance] = useState<number | null>(null);

  useEffect(() => {
    const fetchMinterData = async () => {
      try {
        const connection = new Connection(SOLANA_NETWORK_RPC);

        // Fetch balance
        const balance = await connection.getBalance(new PublicKey(MINTER_WALLET));
        setMinterBalance(balance / LAMPORTS_PER_SOL);
      } catch (error) {
        console.error("Error fetching minter data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMinterData();
  }, []);

  useEffect(() => {
    /*
    based on if we are in devnet or mainnet, make an GET API call as follows:
    devnet: https://aeneid.storyscan.io/api/v2/addresses/0x8Fe1213aC1353639e961Dfdd6F84AAf838492260
    mainnet: https://storyscan.io/api/v2/addresses/0x8Fe1213aC1353639e961Dfdd6F84AAf838492260

    the response will be in the following format:
    {
      "block_number_balance_updated_at": 9021236,
      "coin_balance": "4527028247600097466",
      "creation_status": null,
      "creation_transaction_hash": null,
      "creator_address_hash": null,
      "ens_domain_name": null,
      "exchange_rate": null,
      "has_beacon_chain_withdrawals": false,
      "has_logs": false,
      "has_token_transfers": true,
      "has_tokens": true,
      "has_validated_blocks": false,
      "hash": "0x8Fe1213aC1353639e961Dfdd6F84AAf838492260",
      "implementations": [],
      "is_contract": false,
      "is_scam": false,
      "is_verified": false,
      "metadata": null,
      "name": null,
      "private_tags": [],
      "proxy_type": null,
      "public_tags": [],
      "token": null,
      "watchlist_address_id": null,
      "watchlist_names": []
    }

    coin_balance is the balance we are after for storyMinterBalance. But not that its a 18 decimal coin so we need to divide by 10^18 to get the balance in IP.
   */
    const fetchStoryMinterData = async () => {
      const response = await fetch(
        APP_NETWORK === "devnet"
          ? "https://aeneid.storyscan.io/api/v2/addresses/0x8Fe1213aC1353639e961Dfdd6F84AAf838492260"
          : "https://www.storyscan.io/api/v2/addresses/0x8Fe1213aC1353639e961Dfdd6F84AAf838492260"
      );
      const data = await response.json();
      setStoryMinterBalance(data.coin_balance / 10 ** 18);
    };
    fetchStoryMinterData();
  }, []);

  useEffect(() => {
    const fetchRecentMints = async () => {
      const connection = new Connection(SOLANA_NETWORK_RPC);
      // Fetch recent transactions
      const signatures = await connection.getSignaturesForAddress(new PublicKey(MINTER_WALLET), { limit: 20 });

      // Fetch transaction details
      const transactions = await Promise.all(
        signatures.map(async (sig) => {
          const tx = await connection.getParsedTransaction(sig.signature, {
            maxSupportedTransactionVersion: 0,
          });
          return {
            signature: sig.signature,
            timestamp: sig.blockTime ? sig.blockTime * 1000 : 0,
            status: sig.err ? ("failed" as const) : ("success" as const),
            mintAddress: tx?.meta?.postTokenBalances?.[0]?.mint,
          };
        })
      );

      setRecentMints(transactions);
    };

    if (showRecentMints && recentMints.length === 0) {
      fetchRecentMints();
    }
  }, [showRecentMints, recentMints]);

  const explorerUrl = SOLANA_NETWORK_RPC.includes("devnet") ? "https://explorer.solana.com/?cluster=devnet" : "https://explorer.solana.com";

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">App Status</h1>

      <div className="space-y-8">
        <section className="bg-black text-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">Story Protocol Network</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Minter Wallet Balance:</span>
              <span className="font-mono">{storyMinterBalance !== null ? `${storyMinterBalance.toFixed(4)} IP` : "Loading..."}</span>
            </div>
          </div>
        </section>

        <section className="bg-black text-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">Solana Network</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Minter Wallet Balance:</span>
              <span className="font-mono">{minterBalance !== null ? `${minterBalance.toFixed(4)} SOL` : "Loading..."}</span>
            </div>
            <div className="text-sm text-gray-400">
              Wallet: <SolAddressLink address={MINTER_WALLET} explorerAddress={explorerUrl} />
            </div>

            <div className="mt-6">
              <h3 className="text-xl font-semibold mb-3">Recent Transactions</h3>
              {!showRecentMints && (
                <button className="my-5 bg-blue-500 text-white px-4 py-2 rounded-md" onClick={() => setShowRecentMints(!showRecentMints)}>
                  Show Recent Mint Transactions
                </button>
              )}
              {isLoading ? (
                <div className="text-gray-400">Loading transactions...</div>
              ) : recentMints.length > 0 ? (
                <div className="space-y-2">
                  {recentMints.map((tx) => (
                    <div key={tx.signature} className="bg-gray-800 rounded p-3">
                      <div className="flex justify-between items-center">
                        <SolAddressLink address={tx.signature} explorerAddress={explorerUrl} />
                        <span className={`px-2 py-1 rounded text-sm ${tx.status === "success" ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"}`}>
                          {tx.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-400 mt-1">{new Date(tx.timestamp).toLocaleString()}</div>
                      {tx.mintAddress && (
                        <div className="text-sm text-gray-400 mt-1">
                          Mint: <SolAddressLink address={tx.mintAddress} explorerAddress={explorerUrl} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-400">No recent mint transactions found</div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
