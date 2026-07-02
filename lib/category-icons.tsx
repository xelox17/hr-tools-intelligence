import {
  BarChart3,
  Bot,
  Clock,
  Database,
  GraduationCap,
  HeartPulse,
  MessagesSquare,
  Plane,
  UserPlus,
  UserSearch,
  Wallet,
  Wrench,
} from "lucide-react";

export function CategoryIcon({
  category,
  className,
}: {
  category: string;
  className?: string;
}) {
  switch (category) {
    case "HRIS":
      return <Database className={className} />;
    case "Recruitment":
      return <UserSearch className={className} />;
    case "Learning":
      return <GraduationCap className={className} />;
    case "Payroll":
      return <Wallet className={className} />;
    case "Communication":
      return <MessagesSquare className={className} />;
    case "Time & Attendance":
      return <Clock className={className} />;
    case "Onboarding":
      return <UserPlus className={className} />;
    case "Wellness":
      return <HeartPulse className={className} />;
    case "Mobility":
      return <Plane className={className} />;
    case "HR Support":
      return <Bot className={className} />;
    case "Analytics":
      return <BarChart3 className={className} />;
    default:
      return <Wrench className={className} />;
  }
}
