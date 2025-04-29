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
    { teamName: "Fuego Crew", teamCode: "4" },
    { teamName: "Devolution Dance Fam", teamCode: "5" },
    { teamName: "Obbf Dynamic", teamCode: "6" },
    { teamName: "CPC", teamCode: "7" },
    { teamName: "Da-Sturbin Da Peace", teamCode: "8" },
  ],
  nzw: [
    { teamName: "Kiwi Crew", teamCode: "9" },
    { teamName: "Pacific Warriors", teamCode: "10" },
  ],
  aus: [
    { teamName: "Outback Beats", teamCode: "11" },
    { teamName: "Sydney Swans", teamCode: "12" },
  ],
  usa: [
    { teamName: "NYC Breakers", teamCode: "13" },
    { teamName: "LA Movers", teamCode: "14" },
  ],
  gbr: [
    { teamName: "London Lights", teamCode: "15" },
    { teamName: "Manchester United", teamCode: "16" },
  ],
  can: [
    { teamName: "Maple Leafs", teamCode: "17" },
    { teamName: "Vancouver Vibes", teamCode: "18" },
  ],

  kor: [
    { teamName: "Seoul Stars", teamCode: "19" },
    { teamName: "Busan Beats", teamCode: "20" },
  ],
  deu: [
    { teamName: "Berlin Beats", teamCode: "21" },
    { teamName: "Munich Movers", teamCode: "22" },
  ],
  fra: [
    { teamName: "Paris Pulse", teamCode: "23" },
    { teamName: "Lyon Lights", teamCode: "24" },
  ],
};
