import React, { useState } from "react";
import { Route, Routes, useSearchParams } from "react-router-dom";
import { Layout } from "components";
import { SolContextProvider } from "contexts/sol/SolContextProvider";
import { PageNotFound, Login, PaymentSuccess, StatusBoard, FAQ } from "pages";
import { HomeSection } from "pages/BodySections/HomeSection";
import { Legal } from "pages/Legal";
import { routeNames } from "routes";
import { Web3AuthProvider } from "./contexts/sol/Web3AuthProvider";
import { ThemeProvider } from "./contexts/ThemeProvider";
import { StoreProvider } from "./store/StoreProvider";

export const App = () => {
  const [homeMode, setHomeMode] = useState<string>("home");
  const [triggerToggleRadioPlayback, setTriggerToggleRadioPlayback] = useState<string>("");
  const [searchParams, setSearchParams] = useSearchParams();

  // S: deep section navigation states
  const [campaignCodeFilter, setCampaignCodeFilter] = useState<string | undefined>(undefined);
  const [featuredArtistDeepLinkSlug, setFeaturedArtistDeepLinkSlug] = useState<string | undefined>();
  // E: deep section navigation states

  const navigateToDeepAppView = ({
    artistCampaignCode,
    artistSubGroup1Code,
    artistSubGroup2Code,
    artistSlug,
    albumId,
    artistProfileTab,
  }: {
    artistCampaignCode?: string;
    artistSubGroup1Code?: string;
    artistSubGroup2Code?: string;
    artistSlug?: string;
    albumId?: string;
    artistProfileTab?: string;
  }) => {
    /*
    routes we support navigation to:
    campaign=wsb&country=phl&team=mrw&tab=fan&artist=wsb-phl-mrw-aira
    campaign=wsb&country=phl&team=mrw
    campaign=wsb
    */

    navigateToDeepAppViewLogic();

    function navigateToDeepAppViewLogic() {
      let artistSlugStateUpdateLogicAlreadyDone = false;

      // we do this logic hee and reuse it below, the idea being that we keep all the state update logic together for the if logic blocks
      function artistSlugStateUpdateLogic() {
        if (artistSlug) {
          let slugToUse = artistSlug;

          if (albumId) {
            slugToUse = `${artistSlug}~${albumId}`;
          }

          setFeaturedArtistDeepLinkSlug(slugToUse);
        }

        artistSlugStateUpdateLogicAlreadyDone = true;
      }

      if (artistCampaignCode) {
        if (artistCampaignCode === "wsb") {
          if (artistSubGroup1Code && artistSubGroup2Code) {
            // e.g. campaign=wsb&country=phl&team=mrw

            const currentParams = Object.fromEntries(searchParams.entries());

            // remove all other first
            delete currentParams["artist"];
            delete currentParams["tab"];
            delete currentParams["action"];
            delete currentParams["country"];
            delete currentParams["team"];
            delete currentParams["campaign"];
            delete currentParams["section"];

            currentParams["campaign"] = artistCampaignCode;
            currentParams["country"] = artistSubGroup1Code;
            currentParams["team"] = artistSubGroup2Code;

            setSearchParams(currentParams);
            setCampaignCodeFilter(artistCampaignCode + "-" + artistSubGroup1Code + "-" + artistSubGroup2Code);
            artistSlugStateUpdateLogic();
          } else if (artistSubGroup1Code) {
            // e.g. campaign=wsb&country=phl

            const currentParams = Object.fromEntries(searchParams.entries());

            // remove all other first
            delete currentParams["artist"];
            delete currentParams["tab"];
            delete currentParams["action"];
            delete currentParams["country"];
            delete currentParams["team"];
            delete currentParams["campaign"];
            delete currentParams["section"];

            currentParams["campaign"] = artistCampaignCode;
            currentParams["country"] = artistSubGroup1Code;

            setSearchParams(currentParams);
            setCampaignCodeFilter(artistCampaignCode + "-" + artistSubGroup1Code);
            artistSlugStateUpdateLogic();
          } else {
            // e.g. campaign=wsb

            const currentParams = Object.fromEntries(searchParams.entries());

            // remove all other first
            delete currentParams["artist"];
            delete currentParams["tab"];
            delete currentParams["action"];
            delete currentParams["country"];
            delete currentParams["team"];
            delete currentParams["campaign"];
            delete currentParams["section"];

            currentParams["campaign"] = artistCampaignCode;

            setSearchParams(currentParams);
            setCampaignCodeFilter(artistCampaignCode);
            artistSlugStateUpdateLogic();
          }

          setTimeout(() => {
            setHomeMode(`campaigns-wsb-${new Date().getTime()}`);
          }, 100);
        }

        // if we are ONLY changing to artist / album, and have not already handled the artist/album logic above then do it here
        if (!artistSlugStateUpdateLogicAlreadyDone) {
          artistSlugStateUpdateLogic();
        }

        // TODO: ideally also group this logic like above artistSlugStateUpdateLogic state update grouping
        // if (artistProfileTab) {
        //   const currentParams = Object.fromEntries(searchParams.entries());
        //   currentParams["tab"] = artistProfileTab;
        //   setSearchParams(currentParams);
        // }
      }
    }
  };

  const removeDeepSectionParamsFromUrl = () => {
    const currentParams = Object.fromEntries(searchParams.entries());
    delete currentParams["artist"];
    delete currentParams["tab"];
    delete currentParams["action"];
    delete currentParams["country"];
    delete currentParams["team"];
    delete currentParams["campaign"];
    delete currentParams["section"];
    setSearchParams(currentParams);
  };

  return (
    // <Router>
    <Web3AuthProvider>
      <SolContextProvider>
        <StoreProvider>
          <ThemeProvider defaultTheme="dark" storageKey="explorer-ui-theme">
            <Layout
              homeMode={homeMode}
              setHomeMode={(newHomeMode) => setHomeMode(newHomeMode)}
              setTriggerToggleRadioPlayback={setTriggerToggleRadioPlayback}
              removeDeepSectionParamsFromUrl={removeDeepSectionParamsFromUrl}>
              <Routes>
                <Route path={routeNames.login} element={<Login />} />
                <Route
                  path={routeNames.home}
                  element={
                    <HomeSection
                      homeMode={homeMode}
                      setHomeMode={setHomeMode}
                      triggerToggleRadioPlayback={triggerToggleRadioPlayback}
                      campaignCodeFilter={campaignCodeFilter}
                      featuredArtistDeepLinkSlug={featuredArtistDeepLinkSlug}
                      setFeaturedArtistDeepLinkSlug={setFeaturedArtistDeepLinkSlug}
                      setCampaignCodeFilter={setCampaignCodeFilter}
                      navigateToDeepAppView={navigateToDeepAppView}
                    />
                  }
                />
                <Route path={routeNames.paymentSuccess} element={<PaymentSuccess />} />
                <Route path={routeNames.faq} element={<FAQ />} />
                <Route path={routeNames.legal} element={<Legal />} />
                <Route path={routeNames.whitepaper} element={<FAQ />} />
                <Route path={routeNames.statusBoard} element={<StatusBoard />} />
                <Route path="*" element={<PageNotFound />} />
              </Routes>
            </Layout>
          </ThemeProvider>
        </StoreProvider>
      </SolContextProvider>
    </Web3AuthProvider>
    // </Router>
  );
};

export default App;
