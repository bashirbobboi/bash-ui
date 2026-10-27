import { Home, GraduationCap, Briefcase, FolderGit2, Award, Code2 } from "lucide-react";
import type { RadialNavItem } from "./radial-nav";
export const items: RadialNavItem[] = [
  {id:1,label:"Home",icon:Home,angle:0},
  {id:2,label:"Education",icon:GraduationCap,angle:60},
  {id:3,label:"Experience",icon:Briefcase,angle:120},
  {id:4,label:"Projects",icon:FolderGit2,angle:180},
  {id:5,label:"Certifications",icon:Award,angle:240},
  {id:6,label:"Skills",icon:Code2,angle:300},
];
