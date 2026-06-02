import {
  Home,
  Sunrise,
  Dumbbell,
  CalendarCheck,
  Utensils,
  GraduationCap,
  Users,
  Target,
  Plane,
  Wallet,
  PiggyBank,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const navItems: NavItem[] = [
  { href: "/command", label: "Command", icon: Sunrise },
  { href: "/", label: "Overview", icon: Home },
  { href: "/training", label: "Training", icon: Dumbbell },
  { href: "/program", label: "Program", icon: CalendarCheck },
  { href: "/nutrition", label: "Nutrition", icon: Utensils },
  { href: "/academics", label: "School", icon: GraduationCap },
  { href: "/network", label: "Network", icon: Users },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/trips", label: "Trips", icon: Plane },
  { href: "/finance", label: "Finance", icon: Wallet },
  { href: "/money", label: "Money", icon: PiggyBank },
];
