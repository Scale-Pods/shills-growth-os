import "./globals.css";

export const metadata = {
  title: "Shills Growth OS",
  description: "Enterprise operating system for multi-channel beauty brands.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="light">
      <body>{children}</body>
    </html>
  );
}

