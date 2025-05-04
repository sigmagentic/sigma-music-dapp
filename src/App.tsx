import React, { useState } from "react";
import { Route, Routes, BrowserRouter as Router } from "react-router-dom";
import { Layout } from "components";
import { SolContextProvider } from "contexts/sol/SolContextProvider";
import { PageNotFound, Login, Home, PaymentSuccess, StatusBoard } from "pages";
import { routeNames } from "routes";
import { Web3AuthProvider } from "./contexts/sol/Web3AuthProvider";
import { ThemeProvider } from "./contexts/ThemeProvider";
import { StoreProvider } from "./store/StoreProvider";

export const App = () => {
  const [homeMode, setHomeMode] = useState<string>("home");
  const [triggerToggleRadioPlayback, setTriggerToggleRadioPlayback] = useState<string>("");

  return (
    <Router>
      <Web3AuthProvider>
        <SolContextProvider>
          <StoreProvider>
            <ThemeProvider defaultTheme="dark" storageKey="explorer-ui-theme">
              <Layout homeMode={homeMode} setHomeMode={(newHomeMode) => setHomeMode(newHomeMode)} setTriggerToggleRadioPlayback={setTriggerToggleRadioPlayback}>
                <Routes>
                  <Route path={routeNames.login} element={<Login />} />
                  <Route
                    path={routeNames.home}
                    element={
                      <Home
                        homeMode={homeMode}
                        setHomeMode={(newHomeMode) => setHomeMode(newHomeMode)}
                        triggerToggleRadioPlayback={triggerToggleRadioPlayback}
                      />
                    }
                  />
                  <Route path={routeNames.paymentSuccess} element={<PaymentSuccess />} />
                  <Route path={routeNames.statusBoard} element={<StatusBoard />} />
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
