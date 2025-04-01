import React, { useEffect, useState } from "react";
import { Route, Routes, BrowserRouter as Router } from "react-router-dom";
import { Layout } from "components";
import { SolContextProvider } from "contexts/sol/SolContextProvider";
import { PageNotFound, Login, Home, Remix } from "pages";
import { routeNames } from "routes";
import { Web3AuthProvider } from "./contexts/sol/Web3AuthProvider";
import { ThemeProvider } from "./contexts/ThemeProvider";
import { StoreProvider } from "./store/StoreProvider";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import StripeCheckoutForm from "./contexts/StripeCheckoutForm";
import { getApiWeb2Apps } from "libs/utils/misc";
const stripePromise = loadStripe("pk_test_51R8eAICGV8oT8ge4mqzlo1nBtHr9Rl9ZaTkEGzcpEf43O8NHXe6h9DA7m1VuKFKy5rpilIoFUjawTMKp7PdDGJYn008VNxfKvj");

export const App = () => {
  const [homeMode, setHomeMode] = useState<"home" | "artists" | "radio" | "wallet">("home");
  const [clientSecret, setClientSecret] = useState("");

  useEffect(() => {
    // Fetch payment intent clientSecret from your backend
    fetch(`${getApiWeb2Apps()}/sigma/paymentCreateIntent`, { method: "POST" })
      .then((res) => res.json())
      .then((data) => setClientSecret(data.clientSecret));
  }, []);

  return (
    <Router>
      <Web3AuthProvider>
        <SolContextProvider>
          <StoreProvider>
            <Elements stripe={stripePromise}>
              {clientSecret && <StripeCheckoutForm clientSecret={clientSecret} />}
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
            </Elements>
          </StoreProvider>
        </SolContextProvider>
      </Web3AuthProvider>
    </Router>
  );
};

export default App;
