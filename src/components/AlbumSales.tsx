import { useEffect, useState } from "react";
// import { format } from "date-fns";
import { getApiWeb2Apps } from "libs/utils/misc";

interface AlbumSale {
  createdOn: number;
  albumId: string;
}

interface AlbumSalesProps {
  creatorWallet: string;
}

export default function AlbumSales({ creatorWallet }: AlbumSalesProps) {
  const [albumSales, setAlbumSales] = useState<AlbumSale[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAlbumSales = async () => {
      try {
        const response = await fetch(
          `${getApiWeb2Apps()}/datadexapi/sigma/paymentsByCreatorSales?creatorWallet=${creatorWallet}&byCreatorSalesStatusFilter=success`
        );
        if (response.ok) {
          const data = await response.json();
          setAlbumSales(data);
        }
      } catch (error) {
        console.error("Error fetching album sales:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlbumSales();
  }, [creatorWallet]);

  return (
    <div className="w-full">
      <div className="rounded-md border">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="py-3 px-6 text-left text-sm font-medium">Date</th>
              <th className="py-3 px-6 text-left text-sm font-medium">Album ID</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? // Skeleton loading state
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="border-t">
                    <td className="py-4 px-6">
                      <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                    </td>
                    <td className="py-4 px-6">
                      <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                    </td>
                  </tr>
                ))
              : albumSales.map((sale, index) => (
                  <tr key={index} className="border-t">
                    {/* <td className="py-4 px-6 text-sm">{format(sale.createdOn, "MMM d, yyyy HH:mm")}</td> */}
                    <td className="py-4 px-6 text-sm">{sale.createdOn}</td>
                    <td className="py-4 px-6 text-sm">{sale.albumId}</td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
