export interface Team {
  teamName: string;
  teamCode: string;
}

export const TEAMS: Record<string, Team[]> = {
  ind: [
    { teamName: "V-Unbeatables", teamCode: "vub" },
    { teamName: "Teen Zero Degree Crew", teamCode: "1" },
    { teamName: "Cell Slumz In Street Crew", teamCode: "2" },
    { teamName: "Open Team One Crew", teamCode: "3" },
  ],
  zaf: [
    { teamName: "Fuego Crew", teamCode: "fgc" },
    { teamName: "Devolution Dance Fam", teamCode: "5" },
    { teamName: "Obbf Dynamic", teamCode: "6" },
    { teamName: "CPC", teamCode: "7" },
    { teamName: "Da-Sturbin Da Peace", teamCode: "8" },
  ],
  nzw: [
    { teamName: "Opens Swagga", teamCode: "9" },
    { teamName: "Cell GFam", teamCode: "10" },
  ],
  phl: [
    { teamName: "Monster Rockwell", teamCode: "11" },
    { teamName: "Teen The Alive One", teamCode: "12" },
    { teamName: "Monster LCDC", teamCode: "12" },
    { teamName: "Teen Gboyz JRS", teamCode: "12" },
    { teamName: "Open AMK Rocknation", teamCode: "12" },
  ],
};
