import { Html, Head, Main, NextScript } from 'next/document';
import type { DocumentProps } from 'next/document';

export default function Document(docProps: DocumentProps) {
  return (
    <Html lang="en">
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}