"use client";
import React from "react";
import { Settings, ChevronDown } from "lucide-react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import dynamic from "next/dynamic";
import { Icons } from "@/components/icons";
import { siteConfig } from "@/config/site";
import { MainNav } from "@/components/main-nav";
import safe_img from "@/assets/safe.png";

const WalletMultiButtonDynamic = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-black/20 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <img
          src={safe_img.src}
          alt="M3M3"
          className="h-10 w-10 rounded-full bg-amber-500"
        />
        <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent text-3xl font-bold tracking-wider">S3F3</span>
        {/* <div className="flex text-white ml-4">
          <MainNav items={siteConfig.mainNav} />
        </div> */}
      </div>
      <div className="flex items-center gap-2">
        <Link
          href="https://x.com/S3F3_io"
          target="_blank"
          rel="noreferrer"
          className={buttonVariants({
            size: "icon",
            variant: "ghost",
          })}
        >
          <Icons.twitter className="text-amber-500 h-7 w-7 fill-current" />
          <span className="sr-only">Twitter</span>
        </Link>
        <Link
          href="https://t.me/S3F3_io"
          target="_blank"
          rel="noreferrer"
          className={buttonVariants({
            size: "icon",
            variant: "ghost",
          })}
        >
          <Icons.telegram className="text-amber-500 h-7 w-7 fill-current" />
          <span className="sr-only">Telegram</span>
        </Link>
        <WalletMultiButtonDynamic />
      </div>
    </header>
  );
}
