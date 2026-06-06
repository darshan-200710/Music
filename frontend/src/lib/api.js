import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export async function analyzeMedia(file) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await axios.post(`${API}/analyze`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 120000,
  });
  return res.data;
}

export async function fetchHistory(limit = 12) {
  const res = await axios.get(`${API}/history?limit=${limit}`);
  return res.data;
}

export function spotifySearchUrl(title, artist) {
  const q = encodeURIComponent(`${title} ${artist}`);
  return `https://open.spotify.com/search/${q}`;
}

export async function getSpotifyPreview(title, artist, index = 0) {
  const res = await axios.get(`${API}/spotify/preview`, {
    params: { title, artist, index }
  });
  return res.data;
}
