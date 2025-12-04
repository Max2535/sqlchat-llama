import "./globals.css";

export const metadata = {
  title: 'Dynamic SQL Chat - Llama + MSSQL',
  description: 'AI-powered SQL chat assistant using Llama and MSSQL',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  )
}
