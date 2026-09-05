import "./globals.css";

export const metadata = {
  title: "MedLens — Clinical Information Intelligence",
  description:
    "Turns patient intake and lab reports into a structured, traceable, human-reviewable record. Not a diagnostic tool.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
