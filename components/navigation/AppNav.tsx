"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CheckSquare,
  Dumbbell,
  Leaf,
  Zap,
  BarChart2,
  LogOut,
} from "lucide-react";
import { signOut } from "@/app/actions/auth";

const navItems = [
  { href: "/dashboard", label: "Dashboard",   icon: LayoutDashboard },
  { href: "/checkin",   label: "Check-In",    icon: CheckSquare },
  { href: "/training",  label: "Training",    icon: Dumbbell },
  { href: "/nutrition", label: "Nutrition",   icon: Leaf },
  { href: "/brief",     label: "Daily Brief", icon: Zap },
  { href: "/reports",   label: "Reports",     icon: BarChart2 },
];

export default function AppNav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-zinc-800 bg-zinc-950">
        <div className="flex h-16 items-center border-b border-zinc-800 px-6">
          <span className="font-semibold tracking-tight text-white">
            CALIBRATE <span className="text-emerald-400">OS</span>
          </span>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive(href)
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:bg-zinc-800/60 hover:text-white"
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 ${isActive(href) ? "text-emerald-400" : ""}`}
              />
              {label}
            </Link>
          ))}
        </nav>

        {/* Sign out — desktop only */}
        <div className="border-t border-zinc-800 p-3">
          <form action={signOut}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800/60 hover:text-white"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Bottom tab bar — mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-50 flex border-t border-zinc-800 bg-zinc-950 md:hidden">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors ${
              isActive(href) ? "text-emerald-400" : "text-zinc-500"
            }`}
          >
            <Icon className="h-5 w-5" />
            <span>{label.split(" ")[0]}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
