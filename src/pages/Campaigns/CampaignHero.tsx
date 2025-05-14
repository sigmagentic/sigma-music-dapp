import React, { useEffect, useState } from "react";
import { Loader } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import CAMPAIGN_WSB_HERO from "assets/img/campaigns/campaign-wsb-hero.png";
import { COUNTRIES } from "libs/constants/countries";
import { TEAMS } from "libs/constants/teams";
import { formatFriendlyDate } from "libs/utils/ui";
import { useAppStore } from "store/app";

// Featured teams configuration
const FEATURED_TEAMS = [
  {
    teamName: "Monster Rockwell",
    country: "Philippines",
    countryCode: "phl",
    teamCode: "mrw",
    image: "https://i.ytimg.com/vi/HmtlYFhyBSk/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLAg0PCZ4M8cKzAUyGrSboyKYJgZZA",
    description: "The Philippines' Hottest Dance Crew",
  },
  {
    teamName: "V-Unbeatables",
    country: "India",
    countryCode: "ind",
    teamCode: "vub",
    image: "https://c.files.bbci.co.uk/17DBB/production/_110932779_1.png",
    description: "America's Got Talent winner, India's Dance Sensation",
  },
];

type CampaignHeroProps = {
  filterByArtistCampaignCode?: string | undefined;
  handleCampaignCodeFilterChange: (campaignCode: string | undefined) => void;
};

export const CampaignHero = (props: CampaignHeroProps) => {
  const { handleCampaignCodeFilterChange } = props;
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCountry, setSelectedCountry] = useState<string | null>(searchParams.get("country"));
  const [selectedTeam, setSelectedTeam] = useState<string | null>(searchParams.get("team"));
  const { tileDataCollectionLoadingInProgress, mintsLeaderboard } = useAppStore();

  useEffect(() => {
    handleCampaignCodeFilterChange("wsb");

    return () => {
      handleCampaignCodeFilterChange(undefined);
      // Clear URL parameters when component unmounts
      const currentParams = Object.fromEntries(searchParams.entries());
      delete currentParams["campaign"];
      delete currentParams["country"];
      delete currentParams["team"];
      setSearchParams(currentParams);
    };
  }, []);

  // onpage load we can have a URL paramters like "campaign=wsb&country=phl&team=mrw", we need to detect this and use handleCampaignCodeFilterChange accordingly
  useEffect(() => {
    const campaign = searchParams.get("campaign");
    const country = searchParams.get("country");
    const team = searchParams.get("team");

    if (campaign && country) {
      if (team) {
        handleCampaignCodeFilterChange(campaign + "-" + country + "-" + team);
      } else {
        handleCampaignCodeFilterChange(campaign + "-" + country);
      }
    }
  }, []);

  const showFeaturedTeams = !selectedCountry && !selectedTeam && !location.search.includes("artist=");

  return (
    <>
      <div className="w-full mt-5">
        <div className="flex flex-col md:flex-row justify-center items-center xl:items-start w-[100%] h-[100%] md:h-[350px]">
          <div className="flex flex-col w-full md:w-1/2 h-full">
            <div
              className="campaign-wsb-banner h-[350px] md:h-full rounded-lg md:rounded-l-lg rounded-r-none bg-left md:bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${CAMPAIGN_WSB_HERO})`, backgroundSize: "cover" }}
            />
          </div>
          <div className="flex flex-col w-full md:w-1/2 h-full p-6 bg-black">
            <h1 className="!text-3xl font-bold mb-4 !text-yellow-400">
              WSB Collectibles <span className="ml-1">{tileDataCollectionLoadingInProgress && <Loader className="w-4 h-4 animate-spin inline-block" />}</span>
            </h1>
            {!selectedCountry ? (
              <>
                <h2 className="!text-2xl font-bold mb-4">Countries Battling</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {COUNTRIES.map((country) => (
                    <button
                      key={country.code}
                      disabled={tileDataCollectionLoadingInProgress}
                      onClick={() => {
                        setSelectedCountry(country.code);
                        const currentParams = Object.fromEntries(searchParams.entries());
                        currentParams["country"] = country.code;
                        setSearchParams(currentParams);
                        handleCampaignCodeFilterChange("wsb-" + country.code);
                      }}
                      className={`${tileDataCollectionLoadingInProgress ? "opacity-30" : ""} flex items-center space-x-2 p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors`}>
                      <span className="text-sm md:text-md">
                        <span className="mr-2 text-2xl">{country.emoji}</span>
                        {country.label}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            ) : !selectedTeam ? (
              <>
                <div className="flex flex-col-reverse md:flex-row justify-between mb-4 items-baseline">
                  <h2 className="!text-2xl font-bold mt-5 md:mt-0">Teams from {COUNTRIES.find((c) => c.code === selectedCountry)?.label}</h2>
                  <button
                    disabled={tileDataCollectionLoadingInProgress}
                    onClick={() => {
                      setSelectedCountry(null);
                      const currentParams = Object.fromEntries(searchParams.entries());
                      delete currentParams["country"];
                      setSearchParams(currentParams);
                      handleCampaignCodeFilterChange("wsb");
                    }}
                    className={`${tileDataCollectionLoadingInProgress ? "opacity-30" : ""} !text-black font-bold px-4 py-2 text-sm rounded-lg bottom-1.5 bg-gradient-to-r from-yellow-300 to-orange-500 transition ease-in-out delay-150 duration-300 mx-2 cursor-pointer`}>
                    Back to Countries
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {TEAMS[selectedCountry]?.map((team) => (
                    <button
                      key={team.teamCode}
                      disabled={tileDataCollectionLoadingInProgress}
                      onClick={() => {
                        setSelectedTeam(team.teamCode);
                        const currentParams = Object.fromEntries(searchParams.entries());
                        currentParams["team"] = team.teamCode;
                        setSearchParams(currentParams);
                        handleCampaignCodeFilterChange("wsb-" + selectedCountry + "-" + team.teamCode);
                      }}
                      className={`${tileDataCollectionLoadingInProgress ? "opacity-30" : ""} flex items-center space-x-2 p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors`}>
                      <span className="text-sm md:text-lg">{team.teamName}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col-reverse md:flex-row justify-between mb-4 items-baseline">
                  <h2 className="text-3xl xl:text-5xl font-bold w-[250px] mt-5 md:mt-0">
                    Team{" "}
                    <span className="text-left font-[Clash-Medium] text-3xl xl:text-5xl bg-gradient-to-r from-yellow-300 via-orange-500 to-yellow-300 animate-text-gradient inline-block text-transparent bg-clip-text transition-transform cursor-default">
                      {TEAMS[selectedCountry]?.find((t) => t.teamCode === selectedTeam)?.teamName}
                    </span>
                  </h2>
                  <button
                    disabled={tileDataCollectionLoadingInProgress}
                    onClick={() => {
                      setSelectedTeam(null);
                      const currentParams = Object.fromEntries(searchParams.entries());
                      delete currentParams["team"];
                      setSearchParams(currentParams);
                      handleCampaignCodeFilterChange("wsb-" + selectedCountry);
                    }}
                    className={`${tileDataCollectionLoadingInProgress ? "opacity-30" : ""} !text-black font-bold px-4 py-2 text-sm rounded-lg bottom-1.5 bg-gradient-to-r from-yellow-300 to-orange-500 transition ease-in-out delay-150 duration-300 mx-2 cursor-pointer`}>
                    Back to Teams from {COUNTRIES.find((c) => c.code === selectedCountry)?.label}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {showFeaturedTeams && (
        <div className=" w-full">
          <div className="w-full mt-5">
            <h1 className="!text-2xl font-bold mb-4 !text-yellow-400 text-center md:text-left">Featured Teams</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {FEATURED_TEAMS.map((team) => (
                <div
                  key={team.teamCode}
                  className="relative group overflow-hidden rounded-xl bg-gradient-to-br from-gray-900 to-black border border-gray-800 hover:border-yellow-400 transition-all duration-300">
                  <div
                    className="absolute inset-0 bg-cover bg-center opacity-30 group-hover:opacity-50 transition-opacity duration-300"
                    style={{ backgroundImage: `url(${team.image})` }}
                  />
                  <div className="relative p-6 flex flex-col h-[300px] justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-yellow-400 mb-2">{team.teamName}</h3>
                      <p className="mb-4 font-bold">{team.description}</p>
                      <div className="flex items-center">
                        <span className="mr-2">{COUNTRIES.find((c) => c.code === team.countryCode)?.emoji}</span>
                        <span>{team.country}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        handleCampaignCodeFilterChange("wsb-" + team.countryCode + "-" + team.teamCode);
                        setSelectedCountry(team.countryCode);
                        setSelectedTeam(team.teamCode);
                        const currentParams = Object.fromEntries(searchParams.entries());
                        currentParams["country"] = team.countryCode;
                        currentParams["team"] = team.teamCode;
                        setSearchParams(currentParams);
                      }}
                      className="w-[200px] bg-gradient-to-r from-yellow-300 to-orange-500 text-black font-bold py-3 px-6 rounded-lg hover:from-yellow-400 hover:to-orange-600 transition-all duration-300 transform hover:scale-[1.02]">
                      View Team
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="w-full mt-[80px]">
            <h1 className="!text-2xl font-bold mb-8 !text-yellow-400 text-center md:text-left">Top 3 Dancers By Collectibles Sold</h1>
            {mintsLeaderboard
              .filter((item) => item.nftType === "fan")
              .filter((item) => {
                const { artistLookupEverything } = useAppStore.getState();
                const artistInfo = artistLookupEverything[item.arId];
                return artistInfo && artistInfo.artistCampaignCode === "wsb";
              })
              .slice(0, 3).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10">
                <div className="flex space-x-8 mb-4 animate-pulse">
                  <div className="w-36 h-48 bg-gradient-to-t from-yellow-400 to-yellow-200 rounded-3xl flex flex-col items-center justify-end shadow-2xl">
                    <span className="text-6xl">🥇</span>
                  </div>
                  <div className="w-32 h-40 bg-gradient-to-t from-gray-400 to-gray-200 rounded-3xl flex flex-col items-center justify-end shadow-2xl">
                    <span className="text-5xl">🥈</span>
                  </div>
                  <div className="w-28 h-36 bg-gradient-to-t from-orange-400 to-orange-200 rounded-3xl flex flex-col items-center justify-end shadow-2xl">
                    <span className="text-4xl">🥉</span>
                  </div>
                </div>
                <div className="text-yellow-300 text-xl font-bold text-center">Leaderboard loading... Who's going to take gold? 🏅</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 justify-items-center items-center mt-8">
                {mintsLeaderboard
                  .filter((item) => item.nftType === "fan")
                  .filter((item) => {
                    const { artistLookupEverything } = useAppStore.getState();
                    const artistInfo = artistLookupEverything[item.arId];
                    return artistInfo && artistInfo.artistCampaignCode === "wsb";
                  })
                  .slice(0, 3)
                  .map((item, idx) => {
                    const { artistLookupEverything } = useAppStore.getState();
                    const artistInfo = artistLookupEverything[item.arId];
                    const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉";
                    const boxHeight = idx === 0 ? "h-[420px]" : idx === 1 ? "h-[370px]" : "h-[340px]";
                    const boxWidth = idx === 0 ? "w-[320px]" : idx === 1 ? "w-[270px]" : "w-[240px]";
                    const fontSize = idx === 0 ? "text-3xl" : idx === 1 ? "text-2xl" : "text-xl";
                    const imgUrl =
                      item.nftType === "fan" && artistInfo?.fanToken3DGifTeaser && artistInfo.fanToken3DGifTeaser !== ""
                        ? `https://api.itheumcloud.com/app_nftunes/assets/token_img/${artistInfo.fanToken3DGifTeaser}.gif`
                        : artistInfo?.img;
                    return (
                      <div
                        key={item.mintTemplatePrefix}
                        className={`relative flex flex-col items-center justify-center rounded-[2.5rem] shadow-2xl ${boxHeight} ${boxWidth} p-4 group hover:scale-105 transition-transform duration-300`}
                        style={{
                          minWidth: 220,
                          background: "#18181b",
                          borderColor: idx === 0 ? "#FFD700" : idx === 1 ? "#C0C0C0" : "#cd7f32",
                          borderWidth: "5px",
                          borderStyle: "solid",
                        }}>
                        <div className="absolute top-3 right-4 z-10 text-5xl drop-shadow-lg">{medal}</div>
                        <div className="flex-1 w-full flex items-center justify-center mb-2">
                          <img
                            src={imgUrl}
                            alt={artistInfo?.name || "Artist"}
                            className="object-contain cursor-pointer"
                            style={{ width: "95%", height: idx === 0 ? "200px" : idx === 1 ? "150px" : "120px", maxHeight: "80%" }}
                            onClick={() => {
                              if (artistInfo?.slug) {
                                if (item.nftType === "album") {
                                  // Not expected for this leaderboard, but fallback
                                  window.location.href = `?artist=${artistInfo.slug}`;
                                } else {
                                  const campaign = artistInfo?.artistCampaignCode;
                                  const country = artistInfo?.artistSubGroup1Code;
                                  const team = artistInfo?.artistSubGroup2Code;
                                  let url = `?tab=fan&artist=${artistInfo.slug}`;
                                  if (campaign && country) {
                                    if (team) {
                                      url += `&campaign=${campaign}&country=${country}&team=${team}`;
                                    } else {
                                      url += `&campaign=${campaign}&country=${country}`;
                                    }
                                  }
                                  window.location.href = url;
                                }
                              }
                            }}
                          />
                        </div>
                        <div className={`font-bold text-center text-white ${fontSize} mb-2`}>{artistInfo?.name || "Unknown"}</div>
                        <div className="text-yellow-300 font-extrabold text-2xl mb-1 flex items-center justify-center">
                          <span className="mr-1">{item.mints}</span>
                          <span className="text-xs font-bold text-yellow-200">sold</span>
                        </div>
                        <div className="text-xs text-white/80 font-semibold mb-1">Last Sold: {item.lastBought ? formatFriendlyDate(item.lastBought) : "-"}</div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          <div className="w-full mt-[40px] relative top-[35px]">
            <h1 className="!text-2xl font-bold mb-4 !text-yellow-400 text-center md:text-left">Discover Dancers</h1>
          </div>
        </div>
      )}
    </>
  );
};
