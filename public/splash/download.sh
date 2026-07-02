#!/bin/bash
cd "$(dirname "$0")"
urls=(
  "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Khazix_0.jpg"
  "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Aatrox_0.jpg"
  "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Darius_0.jpg"
  "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Katarina_0.jpg"
  "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Ambessa_0.jpg"
  "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Swain_0.jpg"
  "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Sett_0.jpg"
  "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Yasuo_0.jpg"
  "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Yone_0.jpg"
  "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Irelia_0.jpg"
)
for url in "${urls[@]}"; do
  name=$(basename "$url")
  echo "Downloading $name..."
  curl -sL "$url" -o "$name"
done
echo "Done!"
