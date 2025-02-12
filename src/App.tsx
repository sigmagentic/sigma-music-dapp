import React from "react";
import { Route, Routes, BrowserRouter as Router } from "react-router-dom";
import { Layout } from "components";
import { SolContextProvider } from "contexts/sol/SolContextProvider";
import { PageNotFound, Login, Home } from "pages";
import { routeNames } from "routes";
import { ThemeProvider } from "./contexts/ThemeProvider";
import { StoreProvider } from "./store/StoreProvider";

export const App = () => {
  return (
    <Router>
      <SolContextProvider>
        <StoreProvider>
          <ThemeProvider defaultTheme="dark" storageKey="explorer-ui-theme">
            <Layout>
              <Routes>
                <Route path={routeNames.login} element={<Login />} />
                <Route path={routeNames.home} element={<Home />} />
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
