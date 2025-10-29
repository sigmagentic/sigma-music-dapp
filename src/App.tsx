import React, { useState } from "react";
import { Route, Routes, useSearchParams } from "react-router-dom";
import { Layout } from "components";
import { SolContextProvider } from "contexts/sol/SolContextProvider";
import { PageNotFound, Login, PaymentSuccess, StatusBoard, FAQ } from "pages";
import { HomeSection } from "pages/BodySections/HomeSection";
import { Legal } from "pages/Legal";
import { MUI } from "pages/MUI";
import { routeNames } from "routes";
import { Web3AuthProvider } from "./contexts/sol/Web3AuthProvider";
import { ThemeProvider } from "./contexts/ThemeProvider";
import { StoreProvider } from "./store/StoreProvider";

export const App = () => {
  const [homeMode, setHomeMode] = useState<string>("home");
  const [triggerTogglePlaylistPlayback] = useState<string>("");
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
    toSection,
    toView,
    toAction,
    toTrackIdForDeepLink,
  }: {
    artistCampaignCode?: string;
    artistSubGroup1Code?: string;
    artistSubGroup2Code?: string;
    artistSlug?: string;
    albumId?: string;
    artistProfileTab?: string;
    toSection?: string;
    toView?: string;
    toAction?: string;
    toTrackIdForDeepLink?: string;
  }) => {
    /*
    routes we support navigation to:
    ?campaign=wsb&country=phl&team=mrw&tab=fan&artist=wsb-phl-mrw-aira
    ?campaign=wsb&country=phl&team=mrw
    ?campaign=wsb
    ?campaign=wsb&artist=wsb-phl-mrw-loonyo
    ?artist=7g0strike&tab=fan

    ?artist=masterloopz-tmf~ar22_a1
    */

    navigateToDeepAppViewLogic();

    function navigateToDeepAppViewLogic() {
      function artistSlugStateUpdateLogic() {
        if (artistSlug) {
          let slugToUse = artistSlug;

          if (albumId) {
            slugToUse = `${artistSlug}~${albumId}`;
          }

          setFeaturedArtistDeepLinkSlug(slugToUse);
        }
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
            delete currentParams["view"];

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
            delete currentParams["view"];

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
            delete currentParams["view"];

            currentParams["campaign"] = artistCampaignCode;

            setSearchParams(currentParams);
            setCampaignCodeFilter(artistCampaignCode);
            artistSlugStateUpdateLogic();
          }

          setTimeout(() => {
            setHomeMode(`campaigns-wsb-${new Date().getTime()}`);
          }, 100);
        } else if (artistCampaignCode === "wir") {
          setTimeout(() => {
            setHomeMode(`campaigns-wir-${new Date().getTime()}`);
          }, 100);
        }
      } else {
        if (artistSlug) {
          const currentParams = Object.fromEntries(searchParams.entries());
          delete currentParams["section"];
          delete currentParams["view"];
          let slugToUse = artistSlug;

          if (albumId) {
            slugToUse = `${artistSlug}~${albumId}`;
          }

          currentParams["artist"] = slugToUse;

          if (artistProfileTab) {
            currentParams["tab"] = artistProfileTab;
          }

          if (toAction) {
            currentParams["action"] = toAction;
          } else {
            delete currentParams["action"];
          }

          if (toTrackIdForDeepLink) {
            currentParams["alId"] = toTrackIdForDeepLink;
          } else {
            delete currentParams["alId"];
          }

          // setFeaturedArtistDeepLinkSlug(artistSlug); // removed this on 29 Sep as setSearchParams should do the work, not sure if it has any impact but seemed to now have any impact on the app
          setHomeMode(`artists-${new Date().getTime()}`);
          setSearchParams(currentParams);
        } else if (toSection) {
          const currentParams = Object.fromEntries(searchParams.entries());
          currentParams["section"] = toSection;

          if (toView) {
            currentParams["view"] = toView;
          } else {
            delete currentParams["view"];
          }

          setSearchParams(currentParams);
          setHomeMode(toSection + "-" + new Date().getTime());
        }
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
    delete currentParams["view"];
    delete currentParams["alId"];
    setSearchParams(currentParams);
  };

  return (
    <Web3AuthProvider>
      <SolContextProvider>
        <StoreProvider>
          <ThemeProvider defaultTheme="dark" storageKey="explorer-ui-theme">
            <Layout
              homeMode={homeMode}
              setHomeMode={(newHomeMode) => setHomeMode(newHomeMode)}
              removeDeepSectionParamsFromUrl={removeDeepSectionParamsFromUrl}
              navigateToDeepAppView={navigateToDeepAppView}>
              <Routes>
                <Route path={routeNames.login} element={<Login />} />
                <Route
                  path={routeNames.home}
                  element={
                    <HomeSection
                      homeMode={homeMode}
                      setHomeMode={setHomeMode}
                      triggerTogglePlaylistPlayback={triggerTogglePlaylistPlayback}
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
                <Route path={routeNames.mui} element={<MUI />} />
                <Route path="*" element={<PageNotFound />} />
              </Routes>
            </Layout>
          </ThemeProvider>
        </StoreProvider>
      </SolContextProvider>
    </Web3AuthProvider>
  );
};

export default App;
