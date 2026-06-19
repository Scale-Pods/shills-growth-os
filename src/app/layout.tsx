import React from "react";
import "./globals.css";
import { ClientWrapper } from "./ClientWrapper";

export const metadata = {
  title: "Shills Growth OS",
  description: "Enterprise operating system for multi-channel beauty brands.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <body>
        <ClientWrapper>
          {children}
        </ClientWrapper>
      </body>
    </html>
  );
}
