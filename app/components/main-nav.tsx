"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuLink } from "@/components/ui/navigation-menu"

interface NavItem {
    title: string
    href?: string
    disabled?: boolean
    external?: boolean
}

interface MainNavProps {
    items?: NavItem[]
}

export function MainNav({ items }: MainNavProps) {
    const pathname = usePathname()

    return (
        <NavigationMenu>
            <NavigationMenuList className="flex items-center gap-2 md:gap-4">
                {items?.map((item, index) =>
                    item.href ? (
                        <NavigationMenuItem key={index}>
                            <NavigationMenuLink asChild>
                                <Link
                                    href={item.href}
                                    className={cn(
                                        "flex items-center text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-primary hover:bg-accent rounded-md p-2",
                                        pathname === item.href && "text-primary font-bold"
                                    )}
                                >
                                    {item.title}
                                </Link>
                            </NavigationMenuLink>
                        </NavigationMenuItem>
                    ) : null
                )}
            </NavigationMenuList>
        </NavigationMenu>
    )
}