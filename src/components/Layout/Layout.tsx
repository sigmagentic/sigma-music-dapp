import React from "react";
import { Toaster } from "react-hot-toast";
import { Footer } from "./Footer";
import { Navbar } from "./Navbar";

export const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex flex-col flex-auto min-h-[100dvh]">
      <Navbar />
      <main className="flex flex-col flex-auto xl:mx-[1rem] md:mx-[1rem] base:mx-[1.5rem min-h-[80dvh] px-4 md:px-0">{children}</main>
      <Footer />
      <Toaster
        toastOptions={{
          // Default options for specific types
          error: {
            duration: 30000,
          },
        }}
      />
    </div>
  );
};
