export interface Team {
  teamName: string;
  teamCode: string;
}

export const TEAMS: Record<string, Team[]> = {
  ind: [
    { teamName: "vMax Dancers", teamCode: "vmx" },
    { teamName: "Bollywood Stars", teamCode: "bws" },
    { teamName: "Desi Beats", teamCode: "dbt" },
  ],
  nzw: [
    { teamName: "Kiwi Crew", teamCode: "kwc" },
    { teamName: "Pacific Warriors", teamCode: "pwr" },
  ],
  aus: [
    { teamName: "Outback Beats", teamCode: "obb" },
    { teamName: "Sydney Swans", teamCode: "sys" },
  ],
  usa: [
    { teamName: "NYC Breakers", teamCode: "nyb" },
    { teamName: "LA Movers", teamCode: "lam" },
  ],
  gbr: [
    { teamName: "London Lights", teamCode: "llt" },
    { teamName: "Manchester United", teamCode: "mun" },
  ],
  can: [
    { teamName: "Maple Leafs", teamCode: "mlf" },
    { teamName: "Vancouver Vibes", teamCode: "vvb" },
  ],
  jpn: [
    { teamName: "Tokyo Titans", teamCode: "tkt" },
    { teamName: "Osaka Originals", teamCode: "oso" },
  ],
  kor: [
    { teamName: "Seoul Stars", teamCode: "sst" },
    { teamName: "Busan Beats", teamCode: "bsb" },
  ],
  deu: [
    { teamName: "Berlin Beats", teamCode: "brb" },
    { teamName: "Munich Movers", teamCode: "mnm" },
  ],
  fra: [
    { teamName: "Paris Pulse", teamCode: "ppl" },
    { teamName: "Lyon Lights", teamCode: "lyl" },
  ],
};
