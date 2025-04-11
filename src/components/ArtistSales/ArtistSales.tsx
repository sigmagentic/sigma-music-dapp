import { useEffect, useState } from "react";
import { Loader } from "lucide-react";
import { fetchArtistSales } from "libs/utils/misc";
import { useAppStore } from "store/app";

interface ArtistSale {
  task: string;
  createdOn: number;
  albumId?: string;
}

interface ArtistSalesProps {
  creatorPaymentsWallet: string;
}

export default function ArtistSales({ creatorPaymentsWallet }: ArtistSalesProps) {
  const [artistSales, setArtistSales] = useState<ArtistSale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { albumMasterLookup } = useAppStore();

  useEffect(() => {
    const loadArtistSales = async () => {
      try {
        const data = await fetchArtistSales(creatorPaymentsWallet);
        setArtistSales(data);
      } catch (error) {
        console.error("Error fetching album sales:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadArtistSales();
  }, [creatorPaymentsWallet]);

  return (
    <>
      {isLoading ? (
        <div className="h-[100px] flex items-center justify-center">
          <Loader className="animate-spin" size={30} />
        </div>
      ) : (
        <div className="w-full mt-5">
          {artistSales.length === 0 && <div className="text-sm text-muted-foreground h-[100px] flex items-center justify-center">No sales yet</div>}
          {artistSales.length > 0 && (
            <div className="rounded-md border">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="py-3 px-6 text-left text-sm font-medium">Date</th>
                    <th className="py-3 px-6 text-left text-sm font-medium">Sale Item</th>
                  </tr>
                </thead>
                <tbody>
                  {artistSales.map((sale, index) => (
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
          )}
        </div>
      )}
    </>
  );
}
