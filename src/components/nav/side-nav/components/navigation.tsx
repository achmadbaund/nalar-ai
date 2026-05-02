"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { navigations } from "@/config/site";
import { cn } from "@/lib/utils";

export default function Navigation() {
  const pathname = usePathname();
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());

  const visibleNavigations = navigations
    .filter((n) => !n.hidden)
    .map((n) =>
      n.children
        ? { ...n, children: n.children.filter((c) => !c.hidden) }
        : n,
    )
    .filter((n) => !n.children || n.children.length > 0);

  // Auto-expand menu if any child is active
  useEffect(() => {
    setExpandedMenus((prev) => {
      const newExpanded = new Set(prev);
      visibleNavigations.forEach((navigation) => {
        if (navigation.children) {
          const hasActiveChild = navigation.children.some(
            (child) => child.href && pathname === child.href,
          );
          if (hasActiveChild) {
            newExpanded.add(navigation.name);
          }
        }
      });
      return newExpanded;
    });
  }, [pathname]);

  const toggleMenu = (menuName: string) => {
    const newExpanded = new Set(expandedMenus);
    if (newExpanded.has(menuName)) {
      newExpanded.delete(menuName);
    } else {
      newExpanded.add(menuName);
    }
    setExpandedMenus(newExpanded);
  };

  const isMenuActive = (navigation: (typeof visibleNavigations)[0]) => {
    if (navigation.href && pathname === navigation.href) return true;
    if (navigation.children) {
      return navigation.children.some((child) => pathname === child.href);
    }
    return false;
  };

  const isChildActive = (href?: string) => {
    return href && pathname === href;
  };

  return (
    <nav className="flex flex-grow flex-col gap-y-1 p-2">
      {visibleNavigations.map((navigation) => {
        const Icon = navigation.icon;
        const hasChildren = navigation.children && navigation.children.length > 0;
        const isExpanded = expandedMenus.has(navigation.name);
        const isActive = isMenuActive(navigation);

        if (hasChildren) {
          return (
            <div key={navigation.name}>
              <button
                onClick={() => toggleMenu(navigation.name)}
                className={cn(
                  "flex w-full items-center justify-between rounded-md px-2 py-1.5 hover:bg-slate-200 dark:hover:bg-slate-800",
                  isActive && "bg-slate-200 dark:bg-slate-800",
                )}
              >
                <div className="flex items-center">
                  <Icon
                    size={16}
                    className="mr-2 text-slate-800 dark:text-slate-200"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    {navigation.name}
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronDown size={14} className="text-slate-600 dark:text-slate-400" />
                ) : (
                  <ChevronRight size={14} className="text-slate-600 dark:text-slate-400" />
                )}
              </button>
              {isExpanded && (
                <div className="ml-4 mt-1 space-y-1 border-l border-slate-300 dark:border-slate-700 pl-2">
                  {navigation.children!.map((child) => {
                    const ChildIcon = child.icon;
                    const childIsActive = isChildActive(child.href);
                    return (
                      <Link
                        key={child.name}
                        href={child.href || "#"}
                        className={cn(
                          "flex items-center rounded-md px-2 py-1.5 hover:bg-slate-200 dark:hover:bg-slate-800",
                          childIsActive
                            ? "bg-slate-200 dark:bg-slate-800"
                            : "bg-transparent",
                        )}
                      >
                        <ChildIcon
                          size={14}
                          className="mr-2 text-slate-700 dark:text-slate-300"
                        />
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {child.name}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }

        return (
          <Link
            key={navigation.name}
            href={navigation.href || "#"}
            className={cn(
              "flex items-center rounded-md px-2 py-1.5 hover:bg-slate-200 dark:hover:bg-slate-800",
              pathname === navigation.href
                ? "bg-slate-200 dark:bg-slate-800"
                : "bg-transparent",
            )}
          >
            <Icon
              size={16}
              className="mr-2 text-slate-800 dark:text-slate-200"
            />
            <span className="text-sm text-slate-700 dark:text-slate-300">
              {navigation.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
