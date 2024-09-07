import "./global.css";
import { defaultCode } from "../src/content";

export default function RootLayout(props) {
  const { children } = props;

  const languageCode = null;

  return (
    <html lang={languageCode ?? defaultCode}>
      <body>{children}</body>
    </html>
  );
}
