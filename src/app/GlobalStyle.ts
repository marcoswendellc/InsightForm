import { createGlobalStyle } from "styled-components";

export const GlobalStyle = createGlobalStyle`
  * { box-sizing: border-box; }
  html, body { height: 100%; }
  body {
    margin: 0;
    font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;
    background: #0b0f1a;
    color: #0b0f1a;
  }
  a { color: inherit; text-decoration: none; }
  button, input, textarea { font: inherit; }
`;
