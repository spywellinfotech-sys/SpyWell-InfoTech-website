import {
  Smartphone, Apple, Globe, AppWindow, Briefcase, Network, GraduationCap, Bot, Cloud,
  Boxes, LayoutDashboard, Layers, ShoppingBasket, BookOpen, BarChart3, HeartPulse, Truck,
  ShoppingCart, Factory, Rocket, MessageSquare, PenTool, Code2, ShieldCheck, Eye, Gem,
  Handshake, Lightbulb, Target, Languages, MessagesSquare, Zap, HelpCircle,
} from 'lucide-react';

// Only icons listed here are bundled (keeps the site fast). Add new ones here
// before using their names in src/data/content.js.
const icons = {
  Smartphone, Apple, Globe, AppWindow, Briefcase, Network, GraduationCap, Bot, Cloud,
  Boxes, LayoutDashboard, Layers, ShoppingBasket, BookOpen, BarChart3, HeartPulse, Truck,
  ShoppingCart, Factory, Rocket, MessageSquare, PenTool, Code2, ShieldCheck, Eye, Gem,
  Handshake, Lightbulb, Target, Languages, MessagesSquare, Zap,
};

export default function Icon({ name, ...props }) {
  const Cmp = icons[name] || HelpCircle;
  return <Cmp aria-hidden="true" {...props} />;
}
