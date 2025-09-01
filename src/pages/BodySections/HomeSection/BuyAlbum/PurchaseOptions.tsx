import React, { useState } from "react";
import { Loader } from "lucide-react";
import storyProtocolIpOpen from "assets/img/story-protocol-ip-open.png";
import { APP_NETWORK, LICENSE_TERMS_MAP, DISABLE_COMMERCIAL_LICENSE_BUY_OPTION, ONE_USD_IN_XP } from "config";
import { Button } from "libComponents/Button";
import { Switch } from "libComponents/Switch";
import { Album, AlbumSaleTypeOption } from "libs/types";

interface PurchaseOptionsProps {
  isPaymentsDisabled?: boolean;
  buyNowMeta: Album["_buyNowMeta"];
  disableActions?: boolean;
  payWithXP: boolean;
  albumSaleTypeOption: string;
  handlePaymentAndMint: (albumSaleTypeOption: string) => void;
  handleShowLargeSizeTokenImg: (tokenImg: string | null) => void;
  handlePayWithXP: (payWithXP: boolean) => void;
}

export const PurchaseOptions: React.FC<PurchaseOptionsProps> = ({
  isPaymentsDisabled,
  buyNowMeta,
  disableActions = false,
  payWithXP,
  albumSaleTypeOption,
  handlePaymentAndMint,
  handleShowLargeSizeTokenImg,
  handlePayWithXP,
}) => {
  const isOptionAvailable = (option: "priceOption1" | "priceOption2" | "priceOption3" | "priceOption4") => {
    if (option === "priceOption1") {
      return buyNowMeta?.[option]?.priceInUSD && buyNowMeta[option]?.priceInUSD !== "";
    } else if (option === "priceOption4") {
      // this is the pure commercial license option, but it depends on if iptoken exits on priceOption3 as well as that is where the main IP is
      return buyNowMeta?.[option]?.priceInUSD && buyNowMeta[option]?.priceInUSD !== "" && buyNowMeta?.["priceOption3"]?.IpTokenId;
    } else if (DISABLE_COMMERCIAL_LICENSE_BUY_OPTION === "1" && option === "priceOption3") {
      return false;
    } else {
      return buyNowMeta?.[option]?.priceInUSD && buyNowMeta[option]?.priceInUSD !== "" && buyNowMeta[option]?.canBeMinted;
    }
  };

  const renderOption = ({
    option,
    title,
    description,
    license,
    licenseUrl,
    price,
    ipTokenId,
    tokenImg,
  }: {
    option: "priceOption1" | "priceOption2" | "priceOption3" | "priceOption4";
    title: string;
    description: string;
    license: string;
    licenseUrl: string;
    price: string | null;
    ipTokenId?: string | null;
    tokenImg?: string | null;
  }) => {
    const available = isOptionAvailable(option);

    return (
      <div className="relative">
        {!available && (
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <span className="bg-white text-black px-4 py-2 rounded-lg font-semibold shadow-lg">
              {DISABLE_COMMERCIAL_LICENSE_BUY_OPTION === "1" && option === "priceOption3" ? "Currently Offline" : "Currently Not Offered"}
            </span>
          </div>
        )}

        <div className={`bg-black rounded-lg p-4 pb-8 relative ${!available ? "opacity-20 pointer-events-none" : ""}`}>
          {/* Rarity and Max Mints Badge */}
          {option !== "priceOption1" && option !== "priceOption4" && available && buyNowMeta?.priceOption2?.canBeMinted && (
            <div className={`absolute bottom-[-7px] right-0 z-10 ${buyNowMeta?.rarityGrade === "Common" ? "opacity-50" : ""}`}>
              <div className="relative inline-block overflow-hidden rounded-tl-lg">
                <div className="relative px-3 py-1.5 rounded-tl-lg font-semibold text-sm border border-orange-400 text-orange-400">
                  <span className="flex items-center gap-1 text-xs">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
                    <span className="font-bold text-yellow-400">{buyNowMeta?.rarityGrade}</span> Collectible •{" "}
                    {buyNowMeta?.maxMints && buyNowMeta?.maxMints > 0 ? `only ${buyNowMeta?.maxMints} available` : "Unlimited"}
                    {buyNowMeta?.rarityGrade !== "Common" && buyNowMeta?.rarityGrade !== "Uncommon" && <span className="text-yellow-400 pulse">🔥</span>}
                  </span>
                </div>
              </div>
            </div>
          )}
          <div
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            onMouseEnter={() => {
              handleShowLargeSizeTokenImg(tokenImg || null);
            }}>
            {/* Details (left) */}
            <div className="flex-1 space-y-2">
              <h4 className="!text-xl font-semibold">{title}</h4>
              <p className="text-xs text-gray-300">{description}</p>
              <p className="text-xs text-gray-300">
                License: {license} -{" "}
                <a href={licenseUrl} target="_blank" rel="noopener noreferrer" className="text-yellow-300 hover:underline">
                  {licenseUrl.includes("by-nc-nd") ? "CC BY-NC-ND 4.0" : "CC BY 4.0"}
                </a>
              </p>
              {ipTokenId && (
                <>
                  <div
                    className="w-[112px] h-[25px] rounded-md overflow-hidden mt-2 hover:scale-105 transition-all duration-300"
                    onClick={() => {
                      window.open(
                        APP_NETWORK === "devnet" ? `https://aeneid.explorer.story.foundation/ipa/${ipTokenId}` : `https://www.ipontop.com/ip/${ipTokenId}`,
                        "_blank"
                      );
                    }}
                    style={{
                      backgroundImage: `url(${storyProtocolIpOpen})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      backgroundRepeat: "no-repeat",
                    }}></div>
                </>
              )}
            </div>
            {/* Price & Button (right) */}
            <div className="flex flex-col items-end min-w-[110px] md:pl-4">
              {price && !payWithXP && <span className="text-3xl font-extrabold text-yellow-300 mb-2">${price}</span>}
              {price && payWithXP && (
                <span className="text-3xl font-extrabold text-yellow-300 mb-2">{(Number(price) * ONE_USD_IN_XP).toLocaleString()} XP</span>
              )}
              <Button
                onClick={() => handlePaymentAndMint(option)}
                className="w-full md:w-auto bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold py-2 px-6 rounded-lg hover:opacity-90 transition-opacity"
                disabled={isPaymentsDisabled || !available || disableActions}>
                {disableActions ? (
                  <>
                    {albumSaleTypeOption === option ? (
                      <>
                        <Loader className="animate-spin mr-2" size={15} />
                        Working
                      </>
                    ) : (
                      "Please Wait"
                    )}
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
      <div className="flex flex-row gap-2 justify-between">
        <h3 className="!text-2xl font-bold mb-4 hidden md:block">Purchase Options</h3>

        <div className="flex flex-col gap-2 mr-10">
          <div className="flex items-center space-x-2">
            <Switch checked={payWithXP} onCheckedChange={handlePayWithXP} />
            <span className="text-xs text-gray-600">Pay with XP</span>
          </div>
        </div>
      </div>

      {isPaymentsDisabled && (
        <div className="flex gap-4 bg-red-500 p-4 rounded-lg text-sm">
          <p className="text-white">Payments are currently disabled. Please try again later.</p>
        </div>
      )}

      <div className="flex flex-col gap-4 max-h-[calc(100vh-200px)] overflow-y-auto md:pr-5">
        {renderOption({
          option: "priceOption1",
          title: "Digital Album Only",
          description: "You Get: Streams + MP3 downloads incl. bonus tracks",
          license: LICENSE_TERMS_MAP[AlbumSaleTypeOption.priceOption1].shortDescription,
          licenseUrl: LICENSE_TERMS_MAP[AlbumSaleTypeOption.priceOption1].urlToLicense,
          price: buyNowMeta?.priceOption1?.priceInUSD || null,
        })}

        {renderOption({
          option: "priceOption4",
          title: "Album + Commercial License",
          description: "You Get: Digital Album + commercial use license",
          license: LICENSE_TERMS_MAP[AlbumSaleTypeOption.priceOption4].shortDescription,
          licenseUrl: LICENSE_TERMS_MAP[AlbumSaleTypeOption.priceOption4].urlToLicense,
          price: buyNowMeta?.priceOption4?.priceInUSD || null,
          ipTokenId: buyNowMeta?.priceOption3?.IpTokenId || null,
        })}

        {renderOption({
          option: "priceOption2",
          title: "Album + Fan Collectible (NFT)",
          description: "You Get: Everything above + limited edition digital collectible",
          license: LICENSE_TERMS_MAP[AlbumSaleTypeOption.priceOption2].shortDescription,
          licenseUrl: LICENSE_TERMS_MAP[AlbumSaleTypeOption.priceOption2].urlToLicense,
          price: buyNowMeta?.priceOption2?.priceInUSD || null,
          tokenImg: buyNowMeta?.priceOption2?.tokenImg || null,
        })}

        {renderOption({
          option: "priceOption3",
          title: "Album + Fan Collectible + Commercial License",
          description: "You Get: Everything above + commercial use",
          license: LICENSE_TERMS_MAP[AlbumSaleTypeOption.priceOption3].shortDescription,
          licenseUrl: LICENSE_TERMS_MAP[AlbumSaleTypeOption.priceOption3].urlToLicense,
          price: buyNowMeta?.priceOption3?.priceInUSD || null,
          ipTokenId: buyNowMeta?.priceOption3?.IpTokenId || null,
          tokenImg: buyNowMeta?.priceOption3?.tokenImg || null,
        })}
      </div>
    </div>
  );
};

export default PurchaseOptions;
