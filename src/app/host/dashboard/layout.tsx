import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import DashboardNav from './DashboardNav'

export const metadata: Metadata = {
  title: 'ICPG Quiz Dashboard',
  description: 'Manage your quizzes and games',
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex flex-1">
        <DashboardNav />
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  )
}
