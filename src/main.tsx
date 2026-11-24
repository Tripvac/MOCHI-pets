import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./style.css";
import "./merged.css";
import "./room.css";
import "./retro.css";
import "./life.css";
import "./polish.css";
import "./companions.css";
import { initPetArt } from "./art";
import { installAudio } from "./audio";
installAudio();
void initPetArt().finally(() =>
  createRoot(document.getElementById("root")!).render(<App />),
);
