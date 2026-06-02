import {
  Home,
  Dumbbell,
  CalendarCheck,
  Utensils,
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
  { href: "/program", label: "Program", icon: CalendarCheck },
  { href: "/nutrition", label: "Nutrition", icon: Utensils },
  { href: "/academics", label: "School", icon: GraduationCap },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/trips", label: "Trips", icon: Plane },
  { href: "/finance", label: "Finance", icon: Wallet },
];
