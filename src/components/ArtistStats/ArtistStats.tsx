import { useEffect, useState } from "react";
import { Loader } from "lucide-react";
import { fetchArtistSalesViaAPI, fetchStreamsLeaderboardByArtistViaAPI } from "libs/utils/misc";
import { useAppStore } from "store/app";

interface ArtistSale {
  task: string;
  createdOn: number;
  albumId?: string;
  amount: string;
}

interface StreamData {
  alid: string;
  streams: number;
}

interface ArtistStatsProps {
  creatorPaymentsWallet: string;
  showAmounts?: boolean;
  artistId: string;
}

interface SalesSummary {
  totalCount: number;
  totalAmount: number;
  last7Days: { count: number; amount: number };
  last30Days: { count: number; amount: number };
  last3Months: { count: number; amount: number };
}

export default function ArtistStats({ creatorPaymentsWallet, showAmounts = false, artistId }: ArtistStatsProps) {
  const [artistStats, setArtistSales] = useState<ArtistSale[]>([]);
  const [streamsData, setStreamsData] = useState<StreamData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { albumMasterLookup } = useAppStore();

  const calculateSummary = (sales: ArtistSale[], task: string): SalesSummary => {
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const threeMonthsAgo = now - 90 * 24 * 60 * 60 * 1000;

    const filteredSales = sales.filter((sale) => sale.task === task);

    return {
      totalCount: filteredSales.length,
      totalAmount: filteredSales.reduce((sum, sale) => sum + parseFloat(sale.amount), 0),
      last7Days: {
        count: filteredSales.filter((sale) => sale.createdOn >= sevenDaysAgo).length,
        amount: filteredSales.filter((sale) => sale.createdOn >= sevenDaysAgo).reduce((sum, sale) => sum + parseFloat(sale.amount), 0),
      },
      last30Days: {
        count: filteredSales.filter((sale) => sale.createdOn >= thirtyDaysAgo).length,
        amount: filteredSales.filter((sale) => sale.createdOn >= thirtyDaysAgo).reduce((sum, sale) => sum + parseFloat(sale.amount), 0),
      },
      last3Months: {
        count: filteredSales.filter((sale) => sale.createdOn >= threeMonthsAgo).length,
        amount: filteredSales.filter((sale) => sale.createdOn >= threeMonthsAgo).reduce((sum, sale) => sum + parseFloat(sale.amount), 0),
      },
    };
  };

  useEffect(() => {
    const loadArtistData = async () => {
      try {
        const [salesData, streamsData] = await Promise.all([fetchArtistSalesViaAPI(creatorPaymentsWallet), fetchStreamsLeaderboardByArtistViaAPI(artistId)]);
        setArtistSales(salesData);
        setStreamsData(streamsData);
      } catch (error) {
        console.error("Error fetching artist data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadArtistData();
  }, [creatorPaymentsWallet]);

  const albumSalesSummary = calculateSummary(artistStats, "buyAlbum");
  const fanClubSalesSummary = calculateSummary(artistStats, "joinFanClub");

  return (
    <>
      {isLoading ? (
        <div className="h-[100px] flex items-center justify-center">
          <Loader className="animate-spin" size={30} />
        </div>
      ) : (
        <>
          <div className="streams-leaderboard-container">
            <h1 className="!text-3xl font-bold mb-2 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent text-center md:text-left mt-5">
              Music Streams Insights
            </h1>
            {streamsData.length === 0 ? (
              <p className="text-xl mb-10 text-center md:text-left opacity-50">No music streams data yet</p>
            ) : (
              <div className="relative">
                <div className="overflow-x-auto pb-4 mt-5 max-w-[calc(3*16rem)]">
                  <div className="flex space-x-4 min-w-max">
                    {streamsData.map((stream, index) => (
                      <div key={stream.alid} className="flex-shrink-0 w-64 h-48 bg-muted/50 rounded-lg p-6 flex flex-col justify-between relative">
                        <div className="absolute top-2 left-4 text-2xl font-bold text-orange-500">#{index + 1}</div>
                        <div className="absolute top-2 right-4 text-4xl">
                          {index === 0 && <span>🥇</span>}
                          {index === 1 && <span>🥈</span>}
                          {index === 2 && <span>🥉</span>}
                        </div>
                        <div className="text-center mt-6">
                          <div className="text-lg font-semibold mb-4">{stream.alid}</div>
                          <div className="text-3xl font-bold text-orange-500">{stream.streams}</div>
                          <div className="text-sm text-muted-foreground mb-2">Streams</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {streamsData.length > 3 && (
                  <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent pointer-events-none" />
                )}
              </div>
            )}
          </div>

          <div className="sales-insights-container">
            <h1 className="!text-3xl font-bold mb-2 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent text-center md:text-left mt-5">
              Sales Insights
            </h1>
            {artistStats.length === 0 && <p className="text-xl mb-10 text-center md:text-left opacity-50">No sales data yet</p>}
            {artistStats.length > 0 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 mt-5">
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-3 text-orange-500">Album Sales Summary</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Total Sales:</span>
                        <span className="font-medium">
                          {albumSalesSummary.totalCount}
                          {showAmounts && ` (${albumSalesSummary.totalAmount.toFixed(2)} SOL)`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Last 7 Days:</span>
                        <span className="font-medium">
                          {albumSalesSummary.last7Days.count}
                          {showAmounts && ` (${albumSalesSummary.last7Days.amount.toFixed(2)} SOL)`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Last 30 Days:</span>
                        <span className="font-medium">
                          {albumSalesSummary.last30Days.count}
                          {showAmounts && ` (${albumSalesSummary.last30Days.amount.toFixed(2)} SOL)`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Last 3 Months:</span>
                        <span className="font-medium">
                          {albumSalesSummary.last3Months.count}
                          {showAmounts && ` (${albumSalesSummary.last3Months.amount.toFixed(2)} SOL)`}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-3 text-orange-500">Fan Club Memberships</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Total Members:</span>
                        <span className="font-medium">
                          {fanClubSalesSummary.totalCount}
                          {showAmounts && ` (${fanClubSalesSummary.totalAmount.toFixed(2)} SOL)`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Last 7 Days:</span>
                        <span className="font-medium">
                          {fanClubSalesSummary.last7Days.count}
                          {showAmounts && ` (${fanClubSalesSummary.last7Days.amount.toFixed(2)} SOL)`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Last 30 Days:</span>
                        <span className="font-medium">
                          {fanClubSalesSummary.last30Days.count}
                          {showAmounts && ` (${fanClubSalesSummary.last30Days.amount.toFixed(2)} SOL)`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Last 3 Months:</span>
                        <span className="font-medium">
                          {fanClubSalesSummary.last3Months.count}
                          {showAmounts && ` (${fanClubSalesSummary.last3Months.amount.toFixed(2)} SOL)`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="rounded-md border mt-5">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="py-3 px-6 text-left text-sm font-medium">Date</th>
                        <th className="py-3 px-6 text-left text-sm font-medium">Sale Item</th>
                      </tr>
                    </thead>
                    <tbody>
                      {artistStats.map((sale, index) => (
                        <tr key={index} className="border-t">
                          <td className="py-4 px-6 text-sm">
                            {new Date(sale.createdOn).toLocaleString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="py-4 px-6 text-sm">
                            {sale.albumId && <span className="font-bold text-orange-500">{albumMasterLookup[sale.albumId]?.title} Album</span>}{" "}
                            {sale.task === "joinFanClub" && <span className="font-bold text-orange-500">Fan Membership</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </>
  );
}
