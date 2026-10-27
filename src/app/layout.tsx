import type { Metadata } from "next";
import { DM_Sans, Geist, Geist_Mono, Instrument_Serif, Inter, Lato, Lora, Orbitron, Outfit, Playfair_Display, Roboto_Mono, Source_Serif_4, Viaoda_Libre } from "next/font/google";
import localFont from "next/font/local";
import { ThemeProvider } from "next-themes";
import { SiteHeader } from "@/components/site/site-header";
import { SiteSidebar } from "@/components/site/site-sidebar";
import { SITE_URL } from "@/lib/site";
import { SITE_THEME, THEMES, scopedThemeCss } from "@/themes";
import "./globals.css";

// Every theme's fonts are loaded here, so any theme can render on any page.
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const robotoMono = Roboto_Mono({ variable: "--font-roboto-mono", subsets: ["latin"] });
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const lato = Lato({ variable: "--font-lato", subsets: ["latin"], weight: ["300", "400", "700"] });
const lora = Lora({ variable: "--font-lora", subsets: ["latin"] });
const instrumentSerif = Instrument_Serif({ variable: "--font-instrument-serif", subsets: ["latin"], weight: "400" });
const viaodaLibre = Viaoda_Libre({ variable: "--font-viaoda-libre", subsets: ["latin"], weight: "400" });
const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"] });
const playfairDisplay = Playfair_Display({ variable: "--font-playfair-display", subsets: ["latin"], style: ["normal", "italic"] });
const outfit = Outfit({ variable: "--font-outfit", subsets: ["latin"] });
const orbitron = Orbitron({ variable: "--font-orbitron", subsets: ["latin"] });
const openRunde = localFont({
  src: [
    { path: "../../public/fonts/open-runde/OpenRunde-Regular.woff2", weight: "400" },
    { path: "../../public/fonts/open-runde/OpenRunde-Medium.woff2", weight: "500" },
    { path: "../../public/fonts/open-runde/OpenRunde-Semibold.woff2", weight: "600" },
    { path: "../../public/fonts/open-runde/OpenRunde-Bold.woff2", weight: "700" },
  ],
  variable: "--font-open-runde",
  display: "swap",
});

export const metadata: Metadata = {
  // Share images (app/opengraph-image.png) need an absolute origin.
  metadataBase: new URL(SITE_URL),
  title: { default: "bash-ui", template: "%s · bash-ui" },
  description: "Design systems and components collected from Bashir's projects.",
};

// Built from the theme files in this repo at build time; no user input reaches it.
const themeCss = THEMES.map(scopedThemeCss).join("\n");

const sourceSerif = Source_Serif_4({ variable: "--font-source-serif", subsets: ["latin"] });

const fontVars = [inter, robotoMono, geistSans, geistMono, lato, sourceSerif, lora, instrumentSerif, viaodaLibre, openRunde, dmSans, playfairDisplay, outfit, orbitron].map((font) => font.variable).join(" ");

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-theme={SITE_THEME} className={`${fontVars} h-full`} suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{ __html: themeCss }} />
      </head>
      <body className="min-h-full">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          <SiteHeader />
          {/*
           * No padding on the grid itself: the sidebar's sticky position is its
           * resting position (directly under the header), so it never shifts
           * when scrolling starts, and the grid ends exactly at the page's end,
           * so it is never pushed up on the last screen. Spacing lives inside
           * the sidebar and on <main> instead.
           */}
          <div className="mx-auto grid w-full max-w-[1240px] grid-cols-1 px-4 sm:px-6 min-[900px]:grid-cols-[200px_minmax(0,1fr)] min-[900px]:gap-x-14">
            <SiteSidebar />
            <main className="min-w-0 pt-6 pb-24 min-[900px]:pt-8">{children}</main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
