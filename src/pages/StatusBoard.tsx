import { useEffect, useState } from "react";
import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { SolAddressLink } from "components/SolAddressLink";
import { MINTER_WALLET, SOLANA_NETWORK_RPC } from "../config";

interface MintTransaction {
  signature: string;
  timestamp: number;
  status: "success" | "failed";
  mintAddress?: string;
}

export const StatusBoard = () => {
  const [minterBalance, setMinterBalance] = useState<number | null>(null);
  const [recentMints, setRecentMints] = useState<MintTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMinterData = async () => {
      try {
        const connection = new Connection(SOLANA_NETWORK_RPC);

        // Fetch balance
        const balance = await connection.getBalance(new PublicKey(MINTER_WALLET));
        setMinterBalance(balance / LAMPORTS_PER_SOL);

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
      } catch (error) {
        console.error("Error fetching minter data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMinterData();
  }, []);

  const explorerUrl = SOLANA_NETWORK_RPC.includes("devnet") ? "https://explorer.solana.com/?cluster=devnet" : "https://explorer.solana.com";

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">App Status</h1>

      <div className="space-y-8">
        <section className="bg-black text-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">Minting</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Minter Wallet Balance:</span>
              <span className="font-mono">{minterBalance !== null ? `${minterBalance.toFixed(4)} SOL` : "Loading..."}</span>
            </div>
            <div className="text-sm text-gray-400">
              Wallet: <SolAddressLink address={MINTER_WALLET} explorerAddress={explorerUrl} />
            </div>

            <div className="mt-6">
              <h3 className="text-xl font-semibold mb-3">Recent Mint Transactions</h3>
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
