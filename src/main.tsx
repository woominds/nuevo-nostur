import ReactDOM from "react-dom/client";

import App from "./App";

import "./index.css";

function createFallbackUuid(): `${string}-${string}-${string}-${string}-${string}` {
  const randomBytes = new Uint8Array(16);

  if (
    typeof crypto !== "undefined" &&
    typeof crypto.getRandomValues === "function"
  ) {
    crypto.getRandomValues(randomBytes);
  } else {
    for (
      let index = 0;
      index < randomBytes.length;
      index += 1
    ) {
      randomBytes[index] = Math.floor(
        Math.random() * 256
      );
    }
  }

  randomBytes[6] =
    (randomBytes[6] & 0x0f) | 0x40;

  randomBytes[8] =
    (randomBytes[8] & 0x3f) | 0x80;

  const hex = Array.from(
    randomBytes,
    (value) =>
      value
        .toString(16)
        .padStart(2, "0")
  );

  return [
    hex.slice(0, 4).join(""),
    hex.slice(4, 6).join(""),
    hex.slice(6, 8).join(""),
    hex.slice(8, 10).join(""),
    hex.slice(10, 16).join("")
  ].join(
    "-"
  ) as `${string}-${string}-${string}-${string}-${string}`;
}

function installRandomUuidFallback() {
  if (
    typeof crypto === "undefined" ||
    typeof crypto.randomUUID === "function"
  ) {
    return;
  }

  Object.defineProperty(
    crypto,
    "randomUUID",
    {
      configurable: true,
      value: createFallbackUuid
    }
  );
}

installRandomUuidFallback();

ReactDOM.createRoot(
  document.getElementById("root")!
).render(
  <App />
);
