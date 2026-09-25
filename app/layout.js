import './globals.css'
import './theme-v3.css'

export const metadata = {
  title: 'FPL Kickoff Today 2027',
  description: 'Private FPL league dashboard, live statistics, competitions, rules, finance and season gallery.'
}

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  )
}
