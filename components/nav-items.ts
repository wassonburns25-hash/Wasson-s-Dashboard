import {
  Home,
  Dumbbell,
  GraduationCap,
  Target,
  Plane,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const navItems: NavItem[] = [
  { href: "/", label: "Overview", icon: Home },
  { href: "/training", label: "Training", icon: Dumbbell },
  { href: "/academics", label: "Academics", icon: GraduationCap },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/trips", label: "Trips", icon: Plane },
  { href: "/finance", label: "Finance", icon: Wallet },
];
