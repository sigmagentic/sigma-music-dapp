import React, { useEffect, useState } from "react";
import { Loader } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import CAMPAIGN_WSB_HERO from "assets/img/campaigns/campaign-wsb-hero.png";
import { COUNTRIES } from "libs/constants/countries";
import { TEAMS } from "libs/constants/teams";
import { useAppStore } from "store/app";

type CampaignHeroProps = {
  filterByArtistCampaignCode?: string | undefined;
  handleCampaignCodeFilterChange: (campaignCode: string | undefined) => void;
};

export const CampaignHero = (props: CampaignHeroProps) => {
  const { handleCampaignCodeFilterChange } = props;
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCountry, setSelectedCountry] = useState<string | null>(searchParams.get("country"));
  const [selectedTeam, setSelectedTeam] = useState<string | null>(searchParams.get("team"));
  const { tileDataCollectionLoadingInProgress } = useAppStore();

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

  return (
    <>
      <div className="w-full mt-5">
        <div className="flex flex-col md:flex-row justify-center items-center xl:items-start w-[100%] h-[100%] md:h-[350px]">
          <div className="flex flex-col w-full md:w-1/2 h-full">
            <div
              className="campaign-wsb-banner h-[350px] md:h-full rounded-lg md:rounded-l-lg rounded-r-none bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${CAMPAIGN_WSB_HERO})`, backgroundSize: "cover" }}
            />
          </div>
          <div className="flex flex-col w-full md:w-1/2 h-full p-6 bg-black">
            <h1 className="text-2xl font-bold mb-4 !text-yellow-400">
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
                    <span className="text-center md:text-left font-[Clash-Medium] text-3xl xl:text-5xl bg-gradient-to-r from-yellow-300 via-orange-500 to-yellow-300 animate-text-gradient inline-block text-transparent bg-clip-text transition-transform cursor-default">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{/* Add your artists list here */}</div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
