import React, { useState } from "react";
import { Route, Routes, BrowserRouter as Router } from "react-router-dom";
import { Layout } from "components";
import { SolContextProvider } from "contexts/sol/SolContextProvider";
import { PageNotFound, Login, Home, Remix } from "pages";
import { routeNames } from "routes";
import { ThemeProvider } from "./contexts/ThemeProvider";
import { StoreProvider } from "./store/StoreProvider";

export const App = () => {
  const [homeMode, setHomeMode] = useState<"home" | "artists" | "radio" | "wallet">("home");

  return (
    <Router>
      <SolContextProvider>
        <StoreProvider>
          <ThemeProvider defaultTheme="dark" storageKey="explorer-ui-theme">
            <Layout homeMode={homeMode} setHomeMode={(newHomeMode) => setHomeMode(newHomeMode as "home" | "artists" | "radio" | "wallet")}>
              <Routes>
                <Route path={routeNames.login} element={<Login />} />
                <Route
                  path={routeNames.home}
                  element={<Home homeMode={homeMode} setHomeMode={(newHomeMode) => setHomeMode(newHomeMode as "home" | "artists" | "radio" | "wallet")} />}
                />
                <Route path={routeNames.remix} element={<Remix />} />
                <Route path="*" element={<PageNotFound />} />
              </Routes>
            </Layout>
          </ThemeProvider>
        </StoreProvider>
      </SolContextProvider>
    </Router>
  );
};

export default App;
