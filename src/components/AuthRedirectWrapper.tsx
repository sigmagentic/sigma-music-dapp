import React, { PropsWithChildren, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { routeNames } from "routes";

export const AuthRedirectWrapper = ({ children }: PropsWithChildren) => {
  const navigate = useNavigate();

  // useEffect(() => {
  //   if (isLoggedIn) {
  //     navigate(routeNames.home);
  //   }
  // }, [isLoggedIn]);

  return <>{children}</>;
};
