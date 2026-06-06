import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Code2, Cpu, Wrench, Zap, ArrowRight, Bot } from 'lucide-react'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <main className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2 font-semibold text-lg">
          <Bot className="w-6 h-6 text-blue-600" />
          RoboLearn
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
            Sign in
          </Link>
          <Link href="/signup" className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-24 pb-20 text-center">
        <span className="inline-block text-xs font-medium bg-blue-50 text-blue-700 px-3 py-1 rounded-full mb-6">
          Free to learn · AI-powered
        </span>
        <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
          Learn robotics,<br />from the ground up
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
          Structured learning paths across software, mechanical, and electrical robotics — with an AI tutor that answers your questions in context.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/signup" className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors">
            Start learning free <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/learn" className="flex items-center gap-2 text-gray-600 px-6 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors font-medium">
            Browse tracks
          </Link>
        </div>
      </section>

      {/* Tracks */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <p className="text-sm font-medium text-gray-400 text-center mb-8 uppercase tracking-wider">Three learning tracks</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Code2, title: 'Software', desc: 'Python, ROS 2, simulation, and motion planning.', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
            { icon: Wrench, title: 'Mechanical', desc: 'Design, CAD, joints, materials, and mechanisms.', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
            { icon: Zap, title: 'Electrical', desc: 'Circuits, microcontrollers, sensors, and actuators.', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
          ].map(({ icon: Icon, title, desc, color, bg, border }) => (
            <div key={title} className={`rounded-2xl border ${border} ${bg} p-6`}>
              <div className={`w-10 h-10 rounded-xl bg-white flex items-center justify-center mb-4 shadow-sm`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* AI Tutor callout */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-10 text-center text-white">
          <Bot className="w-10 h-10 mx-auto mb-4 opacity-90" />
          <h2 className="text-2xl font-bold mb-3">Built-in AI tutor</h2>
          <p className="text-blue-100 max-w-xl mx-auto leading-relaxed">
            Ask anything, at any point in a lesson. The AI tutor knows exactly what you're studying and gives answers tailored to your current level.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 text-center space-y-1">
        <p className="text-sm text-gray-400">
          Questions or feedback?{' '}
          <a href="mailto:0nepost@zohomail.com" className="text-blue-600 hover:underline">
            0nepost@zohomail.com
          </a>
        </p>
        <p className="text-xs text-gray-300">Free to learn · No credit card required</p>
      </footer>
    </main>
  )
}