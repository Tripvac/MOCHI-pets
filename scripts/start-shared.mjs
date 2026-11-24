import { spawn } from "node:child_process";
import os from "node:os";
const port = process.env.MOCHI_PORT || process.env.PORT || 3000;
await import("../server.mjs");
console.log("Open on this computer: http://localhost:" + port);
if (process.env.MOCHI_HOST === "0.0.0.0") {
  for (const addresses of Object.values(os.networkInterfaces()))
    for (const address of addresses || [])
      if (address.family === "IPv4" && !address.internal)
        console.log("Same Wi-Fi: http://" + address.address + ":" + port);
}
if (process.platform === "win32") {
  const child = spawn("cmd", ["/c", "start", "", "http://localhost:" + port], {
    windowsHide: true,
    stdio: "ignore",
  });
  child.on("error", () => {});
}
