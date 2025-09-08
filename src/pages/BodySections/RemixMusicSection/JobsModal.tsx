import React from "react";
import { RefreshCcw } from "lucide-react";
import { toast } from "react-hot-toast";

export const JobsModal = ({ isOpen, onClose, jobs, onRefresh }: { isOpen: boolean; onClose: () => void; jobs: Array<any>; onRefresh: () => void }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50">
      <div className="bg-[#1A1A1A] rounded-lg p-6 max-w-4xl w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold mr-auto">Your Jobs History</h3>
          <div
            className={`cursor-pointer flex items-center gap-2 text-sm mr-5`}
            onClick={() => {
              onRefresh();
            }}>
            <>
              <RefreshCcw className="w-5 h-5" />
              Refresh
            </>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-full text-xl transition-colors">
            ✕
          </button>
        </div>

        <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left p-2">Date</th>
                <th className="text-left p-2">Amount</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Receipt</th>
                <th className="text-left p-2">Job</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job, index) => (
                <tr key={index} className="border-b border-gray-700/50 hover:bg-white/5">
                  <td className="p-2">{new Date(job.createdOn).toLocaleDateString()}</td>
                  <td className="p-2">{job.amount} XP</td>
                  <td className="p-2">
                    {job.paymentStatus === "new" || job.paymentStatus === "async_processing" ? (
                      <span className="bg-yellow-900 text-yellow-300 px-2 py-1 rounded-md">Pending AI Remix...</span>
                    ) : (
                      job.paymentStatus.charAt(0).toUpperCase() + job.paymentStatus.slice(1)
                    )}
                  </td>
                  <td className="p-2 text-xs">
                    <div className="relative group">
                      <button
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(job.tx);
                            toast.success("Transaction hash copied to clipboard!");
                          } catch (err) {
                            console.error("Failed to copy: ", err);
                            toast.error("Failed to copy to clipboard");
                          }
                        }}
                        className="text-yellow-300 hover:text-yellow-200 hover:underline cursor-pointer transition-colors">
                        {job.tx.slice(0, 4)}...{job.tx.slice(-4)}
                      </button>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                        Click to Copy
                      </div>
                    </div>
                  </td>

                  <td className="p-2">Remix Track: {job.promptParams?.refTrack_alId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
