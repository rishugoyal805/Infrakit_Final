import {
  Boxes, Gauge, ShieldCheck, FileText, FileCode, HeartPulse, ListOrdered, Database,
  GitBranch, Zap, Network, LayoutDashboard, Box,
  Monitor, Smartphone, MonitorSmartphone, Radio, Router, Globe, ShieldAlert,
  DoorOpen, Repeat, Lock, Server, Package, Layers, Cog, Clock, Cpu, HardDrive,
  Folder, Landmark, Droplet, Search, Share2, TrendingUp, Workflow, Waves,
  Bell, Webhook, KeyRound, Fingerprint, Key, Activity, Route, BellRing,
  CreditCard, Mail, MessageSquare, Users, GitMerge, Settings, ToggleLeft,
  Brain,
} from "lucide-react";

const ICONS = {
  Boxes, Gauge, ShieldCheck, FileText, FileCode, HeartPulse, ListOrdered, Database,
  GitBranch, Zap, Network, LayoutDashboard, Box,
  Monitor, Smartphone, MonitorSmartphone, Radio, Router, Globe, ShieldAlert,
  DoorOpen, Repeat, Lock, Server, Package, Layers, Cog, Clock, Cpu, HardDrive,
  Folder, Landmark, Droplet, Search, Share2, TrendingUp, Workflow, Waves,
  Bell, Webhook, KeyRound, Fingerprint, Key, Activity, Route, BellRing,
  CreditCard, Mail, MessageSquare, Users, GitMerge, Settings, ToggleLeft,
  Brain,
};

export default function Icon({ name, ...props }) {
  const Cmp = ICONS[name] || Box;
  return <Cmp {...props} />;
}

// import {
//   Boxes, Gauge, ShieldCheck, FileText, HeartPulse, ListOrdered, Database,
//   GitBranch, Zap, Network, LayoutDashboard, Box,
//   // system-design catalog icons — every name here was checked against the
//   // real installed lucide-react package file list, not assumed
//   Monitor, Smartphone, MonitorSmartphone, Radio, Router, Globe, ShieldAlert,
//   DoorOpen, Repeat, Lock, Server, Package, Layers, Cog, Clock, Cpu, HardDrive,
//   Folder, Landmark, Droplet, Search, Share2, TrendingUp, Workflow, Waves,
//   Bell, Webhook, KeyRound, Fingerprint, Key, Activity, Route, BellRing,
//   CreditCard, Mail, MessageSquare, Users, GitMerge, Settings, ToggleLeft,
//   Brain,
// } from "lucide-react";

// const ICONS = {
//   Boxes, Gauge, ShieldCheck, FileText, HeartPulse, ListOrdered, Database,
//   GitBranch, Zap, Network, LayoutDashboard, Box,
//   Monitor, Smartphone, MonitorSmartphone, Radio, Router, Globe, ShieldAlert,
//   DoorOpen, Repeat, Lock, Server, Package, Layers, Cog, Clock, Cpu, HardDrive,
//   Folder, Landmark, Droplet, Search, Share2, TrendingUp, Workflow, Waves,
//   Bell, Webhook, KeyRound, Fingerprint, Key, Activity, Route, BellRing,
//   CreditCard, Mail, MessageSquare, Users, GitMerge, Settings, ToggleLeft,
//   Brain,
// };

// export default function Icon({ name, ...props }) {
//   const Cmp = ICONS[name] || Box;
//   return <Cmp {...props} />;
// }
