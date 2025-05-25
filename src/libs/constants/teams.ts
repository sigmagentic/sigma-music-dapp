export interface Team {
  teamName: string;
  teamCode: string;
}

export const TEAMS: Record<string, Team[]> = {
  phl: [
    { teamName: "ROCK*WELLPH", teamCode: "mrw" },
    { teamName: "GBOYZ JUNIORS", teamCode: "gbj" },
    { teamName: "Teen The Alive One", teamCode: "12" },
    { teamName: "Monster LCDC", teamCode: "13" },
    { teamName: "Open AMK Rocknation", teamCode: "15" },
  ],
  zaf: [
    { teamName: "XO Kiddzz Elite", teamCode: "opn" },
    { teamName: "Devolution Dance Fam", teamCode: "5" },
    { teamName: "Obbf Dynamic", teamCode: "6" },
    { teamName: "CPC", teamCode: "7" },
    { teamName: "Da-Sturbin Da Peace", teamCode: "8" },
  ],
  ind: [
    { teamName: "V-Unbeatable", teamCode: "vub" },
    { teamName: "Teen Zero Degree Crew", teamCode: "1" },
    { teamName: "Cell Slumz In Street Crew", teamCode: "2" },
    { teamName: "Open Team One Crew", teamCode: "3" },
  ],
  nzw: [
    { teamName: "Opens Swagga", teamCode: "9" },
    { teamName: "Cell GFam", teamCode: "10" },
  ],
  sin: [],
  aus: [],
  ida: [],
};
