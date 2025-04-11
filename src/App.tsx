import React, { useEffect, useState } from "react";
import { Route, Routes, BrowserRouter as Router } from "react-router-dom";
import { Layout } from "components";
import { SolContextProvider } from "contexts/sol/SolContextProvider";
import { PageNotFound, Login, Home, Remix, PaymentSuccess } from "pages";
import { routeNames } from "routes";
import { Web3AuthProvider } from "./contexts/sol/Web3AuthProvider";
import { ThemeProvider } from "./contexts/ThemeProvider";
import { StoreProvider } from "./store/StoreProvider";

export const App = () => {
  const [homeMode, setHomeMode] = useState<string>("home");

  useEffect(() => {
    console.log("APP MODE +++++++ A ", routeNames);
  }, [routeNames]);

  return (
    <Router>
      <Web3AuthProvider>
        <SolContextProvider>
          <StoreProvider>
            <ThemeProvider defaultTheme="dark" storageKey="explorer-ui-theme">
              <Layout homeMode={homeMode} setHomeMode={(newHomeMode) => setHomeMode(newHomeMode)}>
                <Routes>
                  <Route path={routeNames.login} element={<Login />} />
                  <Route path={routeNames.home} element={<Home homeMode={homeMode} setHomeMode={(newHomeMode) => setHomeMode(newHomeMode)} />} />
                  <Route path={routeNames.remix} element={<Remix />} />
                  <Route path={routeNames.paymentSuccess} element={<PaymentSuccess />} />
                  <Route path="*" element={<PageNotFound />} />
                </Routes>
              </Layout>
            </ThemeProvider>
          </StoreProvider>
        </SolContextProvider>
      </Web3AuthProvider>
    </Router>
  );
};

export default App;
