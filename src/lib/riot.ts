const KEY = process.env.RIOT_API_KEY || "";

interface Summoner {
  puuid: string;
  gameName: string;
  tagLine: string;
  profileIconId: number;
  summonerLevel: number;
}

interface MatchSummary {
  matchId: string;
  champion: string;
  championIcon: string;
  kda: { k: number; d: number; a: number };
  win: boolean;
  gameMode: string;
  duration: number;
  timestamp: number;
}

// Get PUUID from Riot ID
export async function getPUUID(gameName: string, tagLine: string): Promise<{ puuid: string; gameName: string; tagLine: string } | null> {
  const res = await fetch(
    `https://asia.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
    { headers: { "X-Riot-Token": KEY } }
  );
  if (!res.ok) return null;
  return await res.json();
}

// Get match IDs
export async function getMatchIds(puuid: string, count = 20): Promise<string[]> {
  const res = await fetch(
    `https://asia.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=${count}`,
    { headers: { "X-Riot-Token": KEY } }
  );
  if (!res.ok) return [];
  return await res.json();
}

// Get match detail
export async function getMatchDetail(matchId: string, puuid: string): Promise<MatchSummary | null> {
  const res = await fetch(
    `https://asia.api.riotgames.com/lol/match/v5/matches/${matchId}`,
    { headers: { "X-Riot-Token": KEY } }
  );
  if (!res.ok) return null;
  const m = await res.json();
  const me = m.info.participants.find((p: any) => p.puuid === puuid);
  if (!me) return null;
  return {
    matchId,
    champion: me.championName,
    championIcon: `https://ddragon.leagueoflegends.com/cdn/14.8.1/img/champion/${me.championName}.png`,
    kda: { k: me.kills, d: me.deaths, a: me.assists },
    win: me.win,
    gameMode: m.info.gameMode,
    duration: Math.round(m.info.gameDuration / 60),
    timestamp: m.info.gameCreation,
  };
}

// Get summoner level/profile info
export async function getSummonerInfo(puuid: string): Promise<Summoner | null> {
  // Try KR platform first (most common for CN players)
  const platforms = ["kr", "jp", "sg", "ph", "tw"];
  for (const plat of platforms) {
    const res = await fetch(
      `https://${plat}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`,
      { headers: { "X-Riot-Token": KEY } }
    );
    if (res.ok) {
      const s = await res.json();
      // Get account info
      const accRes = await fetch(
        `https://asia.api.riotgames.com/riot/account/v1/accounts/by-puuid/${puuid}`,
        { headers: { "X-Riot-Token": KEY } }
      );
      const acc = accRes.ok ? await accRes.json() : null;
      return {
        puuid,
        gameName: acc?.gameName || "",
        tagLine: acc?.tagLine || "",
        profileIconId: s.profileIconId,
        summonerLevel: s.summonerLevel,
      };
    }
  }
  return null;
}
