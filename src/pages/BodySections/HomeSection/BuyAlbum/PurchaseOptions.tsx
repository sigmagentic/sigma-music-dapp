import React from "react";
import { Loader } from "lucide-react";
import { LICENSE_TERMS_MAP } from "config";
import { Button } from "libComponents/Button";
import { Album, AlbumSaleTypeOption } from "libs/types";

interface PurchaseOptionsProps {
  isPaymentsDisabled?: boolean;
  buyNowMeta: Album["_buyNowMeta"];
  disableActions?: boolean;
  handlePaymentAndMint: (albumSaleTypeOption: string) => void;
}

export const PurchaseOptions: React.FC<PurchaseOptionsProps> = ({ isPaymentsDisabled, buyNowMeta, disableActions = false, handlePaymentAndMint }) => {
  const isOptionAvailable = (option: "priceOption1" | "priceOption2" | "priceOption3") => {
    if (option === "priceOption1") {
      return buyNowMeta?.[option]?.priceInUSD && buyNowMeta[option]?.priceInUSD !== "";
    } else {
      return buyNowMeta?.[option]?.priceInUSD && buyNowMeta[option]?.priceInUSD !== "" && buyNowMeta[option]?.canBeMinted;
    }
  };

  const renderOption = (
    option: "priceOption1" | "priceOption2" | "priceOption3",
    title: string,
    description: string,
    license: string,
    licenseUrl: string,
    price: string | null
  ) => {
    const available = isOptionAvailable(option);

    return (
      <div className="relative">
        {!available && (
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <span className="bg-white text-black px-4 py-2 rounded-lg font-semibold shadow-lg">Currently Not Offered</span>
          </div>
        )}
        <div className={`bg-black rounded-lg p-4 relative ${!available ? "opacity-20 pointer-events-none" : ""}`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Details (left) */}
            <div className="flex-1 space-y-2">
              <h4 className="text-lg font-semibold">{title}</h4>
              <p className="text-sm text-gray-300">{description}</p>
              <p className="text-sm text-gray-300">
                License: {license} -{" "}
                <a href={licenseUrl} target="_blank" rel="noopener noreferrer" className="text-yellow-400 hover:underline">
                  {licenseUrl.includes("by-nc-nd") ? "CC BY-NC-ND 4.0" : "CC BY 4.0"}
                </a>
              </p>
            </div>
            {/* Price & Button (right) */}
            <div className="flex flex-col items-end min-w-[110px] md:pl-4">
              {price && <span className="text-3xl font-extrabold text-yellow-400 mb-2">${price}</span>}
              <Button
                onClick={() => handlePaymentAndMint(option)}
                className="w-full md:w-auto bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold py-2 px-6 rounded-lg hover:opacity-90 transition-opacity"
                disabled={isPaymentsDisabled || !available || disableActions}>
                {disableActions ? (
                  <>
                    <Loader className="animate-spin mr-2" size={15} />
                    Working
                  </>
                ) : (
                  "Buy Now"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold mb-4">Purchase Options</h3>

      {isPaymentsDisabled && (
        <div className="flex gap-4 bg-red-500 p-4 rounded-lg text-sm">
          <p className="text-white">Payments are currently disabled. Please try again later.</p>
        </div>
      )}

      {renderOption(
        "priceOption1",
        "Digital Album",
        "You Get: Stream + MP3 downloads incl. bonus tracks",
        LICENSE_TERMS_MAP[AlbumSaleTypeOption.priceOption1].shortDescription,
        LICENSE_TERMS_MAP[AlbumSaleTypeOption.priceOption1].urlToLicense,
        buyNowMeta?.priceOption1?.priceInUSD || null
      )}

      {renderOption(
        "priceOption2",
        "Album + Fan Collectible (NFT)",
        "You Get: Everything above + limited edition digital collectible",
        LICENSE_TERMS_MAP[AlbumSaleTypeOption.priceOption2].shortDescription,
        LICENSE_TERMS_MAP[AlbumSaleTypeOption.priceOption2].urlToLicense,
        buyNowMeta?.priceOption2?.priceInUSD || null
      )}

      {renderOption(
        "priceOption3",
        "Album + Fan Collectible + Commercial License",
        "You Get: Everything above + commercial use",
        LICENSE_TERMS_MAP[AlbumSaleTypeOption.priceOption3].shortDescription,
        LICENSE_TERMS_MAP[AlbumSaleTypeOption.priceOption3].urlToLicense,
        buyNowMeta?.priceOption3?.priceInUSD || null
      )}
    </div>
  );
};

export default PurchaseOptions;
