"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string; icon: string };

export function Nav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const items: Item[] = [
    { href: "/dashboard", label: "Acasă", icon: "◈" },
    { href: "/angels", label: "Îngeri", icon: "✦" },
    { href: "/evocations", label: "Evocări", icon: "☽" },
    ...(isAdmin ? [{ href: "/admin", label: "Admin", icon: "⚙" }] : []),
  ];

  const active = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      {/* Desktop: în bara de sus */}
      <nav className="hidden items-center gap-1 md:flex" aria-label="Navigare principală">
        {items.map((i) => (
          <Link
            key={i.href}
            href={i.href}
            aria-current={active(i.href) ? "page" : undefined}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              active(i.href) ? "bg-primary-soft text-primary" : "text-muted hover:bg-surface-2 hover:text-text"
            }`}
          >
            {i.label}
          </Link>
        ))}
      </nav>

      {/* Mobil: bară fixă jos */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 backdrop-blur md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Navigare principală"
      >
        <ul className="mx-auto flex max-w-xl">
          {items.map((i) => (
            <li key={i.href} className="flex-1">
              <Link
                href={i.href}
                aria-current={active(i.href) ? "page" : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
                  active(i.href) ? "text-primary" : "text-muted"
                }`}
              >
                <span aria-hidden className="text-lg leading-none">
                  {i.icon}
                </span>
                {i.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
