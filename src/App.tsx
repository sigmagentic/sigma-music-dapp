import React from "react";
import { Route, Routes, BrowserRouter as Router } from "react-router-dom";
import { Layout } from "components";
import { MvxContextProvider } from "contexts/mvx/MvxContextProvider";
import { SolContextProvider } from "contexts/sol/SolContextProvider";
import { PageNotFound, Unlock } from "pages";
import { routes, routeNames } from "routes";
import { ThemeProvider } from "./contexts/ThemeProvider";
import { StoreProvider } from "./store/StoreProvider";

export const App = () => {
  return (
    <Router>
      <SolContextProvider>
        <MvxContextProvider>
          <StoreProvider>
            <ThemeProvider defaultTheme="system" storageKey="explorer-ui-theme">
              <Layout>
                <Routes>
                  <Route path={routeNames.unlock} element={<Unlock />} />
                  {routes.map((route, index) => (
                    <Route path={route.path} key={index} element={<route.component />} />
                  ))}
                  <Route path="*" element={<PageNotFound />} />
                </Routes>
              </Layout>
            </ThemeProvider>
          </StoreProvider>
        </MvxContextProvider>
      </SolContextProvider>
    </Router>
  );
};

export default App;
