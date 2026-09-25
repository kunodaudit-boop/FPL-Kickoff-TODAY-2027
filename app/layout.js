import './globals.css'
import './theme-v2.css'

export const metadata = {
  title: 'FPL Kickoff Today 2027',
  description: 'Private league dashboard, competitions, live FPL statistics, rules, finance and season gallery.'
}

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  )
}
