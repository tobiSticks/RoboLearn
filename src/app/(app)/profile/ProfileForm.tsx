'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Save, GitBranch, AtSign, MessageCircle, Users } from 'lucide-react'

type Props = { profile: any; email: string }

export default function ProfileForm({ profile, email }: Props) {
  const supabase = createClient()
  const [fullName,         setFullName]         = useState(profile?.full_name ?? '')
  const [bio,              setBio]              = useState(profile?.bio_updated ?? '')
  const [discord,          setDiscord]          = useState(profile?.discord_handle ?? '')
  const [twitter,          setTwitter]          = useState(profile?.twitter_handle ?? '')
  const [github,           setGithub]           = useState(profile?.github_handle ?? '')
  const [showInDirectory,  setShowInDirectory]  = useState(profile?.show_in_directory ?? false)
  const [saving,           setSaving]           = useState(false)
  const [saved,            setSaved]            = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await supabase.from('profiles').update({
      full_name:          fullName,
      bio_updated:        bio,
      discord_handle:     discord || null,
      twitter_handle:     twitter || null,
      github_handle:      github  || null,
      show_in_directory:  showInDirectory,
    }).eq('id', profile.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const inputClass = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Basic info */}
      <div className="bg-white border border-gray-100 rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Basic info</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
          <input value={fullName} onChange={e => setFullName(e.target.value)} className={inputClass} placeholder="Your name" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
          <input value={email} disabled className={`${inputClass} bg-gray-50 text-gray-400 cursor-not-allowed`} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio <span className="text-gray-400 font-normal">(optional)</span></label>
          <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
            className={inputClass} placeholder="Tell other learners a bit about yourself..." />
        </div>
      </div>

      {/* Social handles */}
      <div className="bg-white border border-gray-100 rounded-xl p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-gray-900">Connect with learners</h2>
          <p className="text-sm text-gray-400 mt-0.5">Share your handles so other learners can find you.</p>
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
            <MessageCircle className="w-4 h-4 text-indigo-400" /> Discord
          </label>
          <input value={discord} onChange={e => setDiscord(e.target.value)} className={inputClass}
            placeholder="e.g. yourname#1234 or yourname" />
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
            <AtSign className="w-4 h-4 text-sky-400" /> X / Twitter
          </label>
          <input value={twitter} onChange={e => setTwitter(e.target.value)} className={inputClass}
            placeholder="e.g. @yourhandle" />
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
            <GitBranch className="w-4 h-4 text-gray-600" /> GitHub
          </label>
          <input value={github} onChange={e => setGithub(e.target.value)} className={inputClass}
            placeholder="e.g. yourusername" />
        </div>

        {/* Directory opt-in */}
        <div className="flex items-start gap-3 pt-2 border-t border-gray-100">
          <button type="button" onClick={() => setShowInDirectory(!showInDirectory)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${showInDirectory ? 'bg-blue-600' : 'bg-gray-300'}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${showInDirectory ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-900">Show me in the Learners directory</span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Your name, bio, and any social handles you add above will be visible to other RoboLearn users.
            </p>
          </div>
        </div>
      </div>

      <button type="submit" disabled={saving}
        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saved ? 'Saved!' : saving ? 'Saving...' : 'Save changes'}
      </button>
    </form>
  )
}
