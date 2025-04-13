import React from "react";
import { ExternalLink } from "lucide-react";
import { APP_NETWORK } from "config";

export const Footer = () => {
  const appVersion = import.meta.env.VITE_APP_VERSION ? `v${import.meta.env.VITE_APP_VERSION}` : "version number unknown";

  return (
    <footer className="mx-[1rem] md:mx-[1rem] h-full flex flex-col justify-center items-center md:items-start text-[10px] opacity-20">
      <small>
        {appVersion + " "}
        {APP_NETWORK.toUpperCase()}
      </small>
    </footer>
  );
};
