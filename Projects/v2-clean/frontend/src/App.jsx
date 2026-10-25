import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'

const sampleInstances = [
  { id: 'i-0a12bc34de56f7890', name: 'raas-api-prod', type: 't3.medium', status: 'Running', zone: 'ap-south-1a', team: 'Platform' },
  { id: 'i-0c34de56fa78b9012', name: 'analytics-dev', type: 't3.micro', status: 'Stopped', zone: 'ap-south-1a', team: 'Analytics' },
]

function StatusBadge({ status }) {
  const styles = {
    Healthy: 'bg-emerald-400/10 text-emerald-400 ring-emerald-400/20',
    Running: 'bg-emerald-400/10 text-emerald-400 ring-emerald-400/20',
    Completed: 'bg-emerald-400/10 text-emerald-400 ring-emerald-400/20',
    ready: 'bg-emerald-400/10 text-emerald-400 ring-emerald-400/20',
    active: 'bg-cyan-400/10 text-cyan-300 ring-cyan-400/20',
    waiting: 'bg-amber-400/10 text-amber-300 ring-amber-400/20',
    'waiting-children': 'bg-amber-400/10 text-amber-300 ring-amber-400/20',
    Degraded: 'bg-amber-400/10 text-amber-300 ring-amber-400/20',
    Checking: 'bg-amber-400/10 text-amber-300 ring-amber-400/20',
    Stopped: 'bg-slate-400/10 text-slate-300 ring-slate-400/20',
    Failed: 'bg-rose-400/10 text-rose-400 ring-rose-400/20',
    failed: 'bg-rose-400/10 text-rose-400 ring-rose-400/20',
    Unavailable: 'bg-rose-400/10 text-rose-400 ring-rose-400/20',
    'not found': 'bg-rose-400/10 text-rose-400 ring-rose-400/20',
    'Not monitored': 'bg-slate-400/10 text-slate-300 ring-slate-400/20',
  }
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${styles[status] || 'bg-slate-400/10 text-slate-300 ring-slate-400/20'}`}><span className="mr-1.5">●</span>{status === 'ready' ? 'Ready' : status}</span>
}

function MetricCard({ label, value, detail, icon, accent }) {
  return <div className="rounded-2xl border border-white/[0.08] bg-slate-900/70 p-5"><div className="flex items-center justify-between"><p className="text-sm text-slate-400">{label}</p><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent}`}>{icon}</span></div><p className="mt-4 text-3xl font-semibold tracking-tight text-white">{value}</p><p className="mt-2 text-xs text-slate-500">{detail}</p></div>
}

function App() {
  const [showLogin, setShowLogin] = useState(true)
  const [activeNav, setActiveNav] = useState('My instances')
  const [jobs, setJobs] = useState([])
  const [readiness, setReadiness] = useState({ state: 'Checking', redis: 'unknown' })
  const [notice, setNotice] = useState('')
  const [submitting, setSubmitting] = useState('')
  const [search, setSearch] = useState('')

  const refreshReadiness = useCallback(async () => {
    try {
      const response = await fetch('/api/health/ready')
      const data = await response.json()
      if (!response.ok) {
        setReadiness({ state: 'Degraded', redis: data.redis || 'unknown' })
        return
      }
      setReadiness({ state: data.status === 'ready' ? 'Healthy' : 'Degraded', redis: data.redis || 'unknown' })
    } catch {
      setReadiness({ state: 'Unavailable', redis: 'unknown' })
    }
  }, [])

  const refreshJobs = useCallback(async () => {
    try {
      const response = await fetch('/api/jobs')

      if (!response.ok) {
        throw new Error(`Job history request failed (${response.status})`)
      }

      const data = await response.json()

      const history = (data.jobs || []).map(job => ({
        id: String(job.jobId),
        instance: job.instanceId || 'Unknown instance',
        action: job.action === 'REBOOT'
          ? 'Simulated restart'
          : job.action || 'Operation',
        status: job.status,
        time: job.timestamp
          ? new Date(job.timestamp).toLocaleTimeString()
          : '—',
        result: job.result,
        error: job.error
      }))

      setJobs(history)
    } catch (error) {
      console.error('Failed to refresh job history:', error.message)
    }
  }, [])

  useEffect(() => {
    refreshReadiness()
    const interval = setInterval(refreshReadiness, 10000)
    return () => clearInterval(interval)
  }, [refreshReadiness])

  useEffect(() => {
    refreshJobs()

    const interval = setInterval(refreshJobs, 3000)
    return () => clearInterval(interval)
  }, [refreshJobs])

  async function submitReboot(instance) {
    if (submitting) return

    setSubmitting(instance.id)
    setNotice('Submitting simulated restart job…')

    try {
      const response = await fetch('/api/reboot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceId: instance.id }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Request failed (${response.status})`)
      }

      setNotice(
        `Job ${data.jobId} accepted for ${data.instanceId || instance.id}. This is a mock operation; no AWS instance is restarted.`
      )

      await refreshJobs()
    } catch (error) {
      setNotice(`Failed to submit restart job: ${error.message}`)
    } finally {
      setSubmitting('')
    }
  }

  const navItems = [
    { label: 'My instances', icon: '▦', group: 'User portal' },
    { label: 'Admin overview', icon: '◫', group: 'Operations' },
    { label: 'Job history', icon: '≡', group: 'Operations' },
  ]
  const filteredInstances = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return sampleInstances
    return sampleInstances.filter(instance => [instance.name, instance.id, instance.type, instance.status, instance.zone, instance.team].some(value => value.toLowerCase().includes(query)))
  }, [search])
  const redisHealthy = readiness.redis === 'available'
  if (showLogin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080d18] px-5 text-slate-200">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0b1120] p-8 shadow-2xl">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-400 text-xl font-black text-slate-950">
              R
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white">
                RaaS <span className="text-cyan-400">2.0</span>
              </h1>
              <p className="text-sm text-slate-400">Reboot as a Service</p>
            </div>
          </div>

          <h2 className="text-2xl font-semibold text-white">Welcome back</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Self-service cloud operations, simplified.
          </p>

          <div className="mt-6 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4">
            <p className="text-sm font-medium text-amber-300">
              Demo environment
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              Secure authentication is not configured yet. Demo access does not
              verify your identity.
            </p>
          </div>

          <button
            onClick={() => setShowLogin(false)}
            className="mt-6 w-full rounded-xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            Continue to demo
          </button>

          <p className="mt-5 text-center text-xs text-slate-500">
            AWS Cognito integration pending
          </p>
        </div>
      </div>
    )
  }

  return <div className="min-h-screen bg-[#080d18] text-slate-200">
    <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-white/[0.08] bg-[#0b1120] lg:flex">
      <div className="flex h-20 items-center gap-3 border-b border-white/[0.08] px-6"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400 text-lg font-black text-slate-950">R</div><div><p className="font-semibold tracking-wide text-white">RaaS <span className="text-cyan-400">2.0</span></p><p className="text-xs text-slate-500">Reboot as a Service</p></div></div>
      <div className="px-4 pt-7">{['User portal', 'Operations'].map(group => <div key={group} className="mb-5"><p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-600">{group}</p><nav className="space-y-1">{navItems.filter(item => item.group === group).map(item => <button key={item.label} onClick={() => setActiveNav(item.label)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${activeNav === item.label ? 'bg-cyan-400/10 font-medium text-cyan-300 ring-1 ring-cyan-400/20' : 'text-slate-400 hover:bg-white/[0.04] hover:text-white'}`}><span className="w-5 text-center text-lg">{item.icon}</span>{item.label}</button>)}</nav></div>)}</div>
      <div className="mt-auto border-t border-white/[0.08] p-5"><div className="rounded-xl border border-violet-400/20 bg-violet-400/[0.06] p-3"><div className="flex items-center gap-2 text-xs font-semibold text-violet-300">◈ DEMO ENVIRONMENT</div><p className="mt-2 text-xs leading-5 text-slate-500">Sample inventory and simulated operations. Authentication and AWS actions are not configured.</p></div></div>
    </aside>

    <main className="lg:ml-64">
      <header className="flex min-h-20 flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] px-5 py-4 sm:px-8"><div><p className="text-xs text-slate-500">RaaS workspace / {activeNav}</p><h1 className="mt-1 text-xl font-semibold text-white">{activeNav}</h1></div><div className="flex items-center gap-3"><span className="flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/[0.06] px-3 py-2 text-xs text-amber-300"><span className="h-2 w-2 rounded-full bg-amber-400" />Local development</span><div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-slate-800 text-sm font-semibold text-white">R</div></div></header>
      <div className="space-y-8 p-5 sm:p-8">
        {notice && <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cyan-400/20 bg-cyan-400/[0.06] px-4 py-3 text-sm text-cyan-100"><span>{notice}</span><button onClick={() => setNotice('')} className="shrink-0 text-cyan-300 hover:text-white">Dismiss</button></div>}

        {activeNav === 'My instances' && <>
          <section className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end"><div><p className="text-sm text-slate-400">Self-service infrastructure</p><h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">Your instances<span className="text-cyan-400">.</span></h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">View sample instances and submit a simulated restart request. Real team authorization and AWS inventory are not connected yet.</p></div><span className="w-fit rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-400">Inventory: <span className="font-medium text-white">Sample data</span></span></section>
          <section className="grid gap-4 sm:grid-cols-3"><MetricCard label="Visible instances" value={sampleInstances.length} detail="Sample inventory" icon="▦" accent="bg-cyan-400/10 text-cyan-300" /><MetricCard label="Running" value={sampleInstances.filter(instance => instance.status === 'Running').length} detail="Sample state" icon="●" accent="bg-emerald-400/10 text-emerald-300" /><MetricCard label="Stopped" value={sampleInstances.filter(instance => instance.status === 'Stopped').length} detail="Sample state" icon="Ⅱ" accent="bg-slate-400/10 text-slate-300" /></section>
          <InstanceTable instances={filteredInstances} search={search} onSearch={setSearch} onReboot={submitReboot} submitting={submitting} />
          <JobTable jobs={jobs.slice(0, 5)} />
        </>}

        {activeNav === 'Admin overview' && <>
          <section><p className="text-sm text-slate-400">RaaS service observability</p><h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">Operations overview<span className="text-cyan-400">.</span></h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Monitor API readiness and API-reported Redis connectivity. Worker health is not independently exposed yet.</p></section>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Tracked jobs" value={jobs.length} detail="Jobs returned by the API" icon="▦" accent="bg-cyan-400/10 text-cyan-300" /><MetricCard label="Completed" value={jobs.filter(job => job.status === 'completed').length} detail="Reported by BullMQ API" icon="↗" accent="bg-emerald-400/10 text-emerald-300" /><MetricCard label="In progress" value={jobs.filter(job => ['waiting', 'active', 'delayed', 'waiting-children'].includes(job.status)).length} detail="Reported by BullMQ API" icon="ϟ" accent="bg-violet-400/10 text-violet-300" /><MetricCard label="Failed / missing" value={jobs.filter(job => ['failed', 'not found'].includes(job.status)).length} detail="Reported by API" icon="!" accent="bg-rose-400/10 text-rose-300" /></section>
          <section><div className="mb-4 flex items-center justify-between"><div><h3 className="font-semibold text-white">Service health</h3><p className="mt-1 text-xs text-slate-500">Live API readiness endpoint; Redis status is inferred from its response.</p></div><button onClick={refreshReadiness} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/[0.04]">Refresh health</button></div><div className="grid gap-4 md:grid-cols-3">{[{ name: 'API readiness', desc: 'GET /api/health/ready', status: readiness.state }, { name: 'Redis dependency', desc: 'API-reported connectivity', status: redisHealthy ? 'Healthy' : readiness.state === 'Checking' ? 'Checking' : 'Degraded' }, { name: 'Worker service', desc: 'No dedicated health endpoint yet', status: 'Not monitored' }].map(service => <div key={service.name} className="rounded-2xl border border-white/[0.08] bg-slate-900/60 p-5"><div className="flex items-start justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-lg text-cyan-300">◈</span><StatusBadge status={service.status} /></div><h4 className="mt-5 font-medium text-white">{service.name}</h4><p className="mt-1 text-xs text-slate-500">{service.desc}</p></div>)}</div></section>
          <JobTable jobs={jobs.slice(0, 8)} />
        </>}

        {activeNav === 'Job history' && <section><div className="mb-5"><h2 className="text-xl font-semibold text-white">Shared job history</h2><p className="mt-1 text-sm text-slate-500">Job history retrieved from the shared BullMQ queue while job records remain available.</p></div><JobTable jobs={jobs} /></section>}
        <footer className="flex flex-col justify-between gap-2 border-t border-white/[0.08] pt-5 text-xs text-slate-600 sm:flex-row"><p>RaaS 2.0 · Reboot as a Service</p><p>Real API/queue workflow · Mock inventory/operations · No authentication configured</p></footer>
      </div>
    </main>
  </div>
}

function InstanceTable({ instances, search, onSearch, onReboot, submitting }) {
  return <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-slate-900/60">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] p-5"><div><h3 className="font-semibold text-white">Instance inventory</h3><p className="mt-1 text-xs text-slate-500">Sample EC2-style records · restart is simulated</p></div><span className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-400">{instances.length} records</span></div>
    <div className="border-b border-white/[0.06] p-4"><label className="block"><span className="sr-only">Search instances</span><input value={search} onChange={event => onSearch(event.target.value)} placeholder="Search by name, ID, type, team or status…" className="w-full rounded-xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-cyan-400/40 sm:max-w-md" /></label></div>
    <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-white/[0.02] text-xs text-slate-500"><tr><th className="px-5 py-3 font-medium">Instance</th><th className="px-5 py-3 font-medium">Instance ID</th><th className="px-5 py-3 font-medium">Type</th><th className="px-5 py-3 font-medium">Status</th><th className="px-5 py-3 font-medium">Team</th><th className="px-5 py-3 font-medium">Actions</th></tr></thead><tbody className="divide-y divide-white/[0.06]">{instances.map(instance => <tr key={instance.id} className="transition hover:bg-white/[0.02]"><td className="px-5 py-4"><p className="font-medium text-white">{instance.name}</p><p className="mt-1 text-xs text-slate-500">{instance.zone}</p></td><td className="px-5 py-4 font-mono text-xs text-slate-400">{instance.id}</td><td className="px-5 py-4 text-slate-400">{instance.type}</td><td className="px-5 py-4"><StatusBadge status={instance.status} /></td><td className="px-5 py-4 text-slate-400">{instance.team}</td><td className="px-5 py-4"><div className="flex items-center gap-2"><button disabled title="Start is not implemented in the current backend" className="rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-slate-400 opacity-40">Start</button><button disabled={instance.status !== 'Running' || Boolean(submitting)} onClick={() => onReboot(instance)} title="Submits a simulated restart job through the existing API" className="rounded-lg border border-cyan-400/20 px-3 py-2 text-xs font-medium text-cyan-300 transition hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-30">{submitting === instance.id ? 'Submitting…' : 'Restart'}</button></div></td></tr>)}{instances.length === 0 && <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-slate-500">No instances match your search.</td></tr>}</tbody></table></div>
    <p className="border-t border-white/[0.06] px-5 py-3 text-xs text-slate-600">Demo note: team labels are illustrative only. Backend team authorization and real AWS operations are not implemented.</p>
  </section>
}

function JobTable({ jobs }) {
  return <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-slate-900/60"><div className="flex items-center justify-between border-b border-white/[0.08] p-5"><div><h3 className="font-semibold text-white">Recent operations</h3><p className="mt-1 text-xs text-slate-500">Statuses retrieved from the API</p></div><span className="text-xs text-slate-500">{jobs.length} jobs</span></div>{jobs.length === 0 ? <p className="p-5 text-sm text-slate-500">No jobs found in the queue.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[580px] text-left text-sm"><thead className="bg-white/[0.02] text-xs text-slate-500"><tr><th className="px-5 py-3 font-medium">Job ID</th><th className="px-5 py-3 font-medium">Instance</th><th className="px-5 py-3 font-medium">Action</th><th className="px-5 py-3 font-medium">Status</th><th className="px-5 py-3 font-medium">Time submitted</th></tr></thead><tbody className="divide-y divide-white/[0.06]">{jobs.map(job => <tr key={job.id} className="hover:bg-white/[0.02]"><td className="px-5 py-4 font-mono text-xs text-slate-400">{job.id}</td><td className="px-5 py-4 text-slate-300">{job.instance}</td><td className="px-5 py-4 text-slate-400">{job.action}</td><td className="px-5 py-4"><StatusBadge status={job.status === 'completed' ? 'Completed' : job.status === 'failed' ? 'Failed' : job.status} />{job.error && <p className="mt-1 max-w-xs text-xs text-rose-300">{job.error}</p>}</td><td className="px-5 py-4 text-xs text-slate-500">{job.time}</td></tr>)}</tbody></table></div>}</section>
}

export default App
