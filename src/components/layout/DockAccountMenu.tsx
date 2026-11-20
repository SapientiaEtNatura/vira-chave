"use client";

import Link from "next/link";
import {
  EllipsisVertical,
  LogOut,
  Pin,
  PinOff,
  Shield,
  UserRound,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/cn";

export interface DockAccountMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isExpanded: boolean;
  initials: string;
  userName?: string;
  subtitle: string;
  homeHref: string;
  pinned: boolean;
  onPinnedChange: (next: boolean) => void;
  isAdmin: boolean;
  signOutAction: () => Promise<void>;
}

export function DockAccountMenu({
  open,
  onOpenChange,
  isExpanded,
  initials,
  userName,
  subtitle,
  homeHref,
  pinned,
  onPinnedChange,
  isAdmin,
  signOutAction,
}: DockAccountMenuProps) {
  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Opções da conta"
          className={cn(
            "flex w-full cursor-pointer items-center rounded-full py-2 transition-colors duration-150 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
            isExpanded
              ? "justify-between gap-2.5 px-2.5"
              : "justify-center px-1",
          )}
        >
          <span className="flex min-w-0 items-center gap-2.5">
            <span
              aria-hidden="true"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-semibold text-white"
            >
              {initials}
            </span>
            {isExpanded ? (
              <span className="min-w-0 text-left">
                <span className="block truncate text-xs font-semibold text-white">
                  {userName || subtitle}
                </span>
                <span className="block truncate text-[11px] text-white/75">
                  {subtitle}
                </span>
              </span>
            ) : null}
          </span>
          {isExpanded ? (
            <EllipsisVertical
              size={18}
              className="shrink-0 text-white/80"
              aria-hidden="true"
            />
          ) : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="right">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Opções</DropdownMenuLabel>

          {homeHref === "/app" ? (
            <DropdownMenuItem asChild>
              <Link href="/app/conta">
                <UserRound />
                Minha conta
              </Link>
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuCheckboxItem
            checked={pinned}
            onCheckedChange={(checked) => onPinnedChange(Boolean(checked))}
          >
            {pinned ? (
              <PinOff
                className="h-[18px] w-[18px] shrink-0"
                aria-hidden="true"
              />
            ) : (
              <Pin
                className="h-[18px] w-[18px] shrink-0"
                aria-hidden="true"
              />
            )}
            {pinned ? "Desafixar menu" : "Fixar menu"}
          </DropdownMenuCheckboxItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />

        {isAdmin && (
          <DropdownMenuItem asChild>
            <Link href="/admin" aria-label="Ir para o painel Admin">
              <Shield />
              <span>Painel Admin</span>
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuGroup>
          <DropdownMenuItem
            variant="destructive"
            onSelect={async () => {
              await signOutAction();
            }}
          >
            <LogOut />
            Sair da conta
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
