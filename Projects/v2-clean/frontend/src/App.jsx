
import { useCallback, useEffect, useState } from 'react'
import './App.css'

const sampleInstances = [
  { id: 'i-0a12bc34de56f7890', name: 'raas-api-prod', type: 't3.medium', status: 'Running', zone: 'ap-south-1a' },
  { id: 'i-0c34de56fa78b9012', name: 'analytics-dev', type: 't3.micro', status: 'Stopped', zone: 'ap-south-1a' },
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
    Stopped: 'bg-slate-400/10 text-slate-300 ring-slate-400/20',
    Failed: 'bg-rose-400/10 text-rose-400 ring-rose-400/20',
    failed: 'bg-rose-400/10 text-rose-400 ring-rose-400/20',
    'not ready': 'bg-rose-400/10 text-rose-400 ring-rose-400/20',
    Simulated: 'bg-violet-400/10 text-violet-300 ring-violet-400/20',
  }

  const label = status === 'ready' ? 'Ready' : status

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${styles[status] || 'bg-slate-400/10 text-slate-300 ring-slate-400/20'}`}>
      <span className="mr-1.5">●</span>{label}
    </span>
  )
}

function MetricCard({ label, value, detail, icon, accent }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-slate-900/70 p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{label}</p>
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent}`}>{icon}</span>
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-white">{value}</p>
      <p className="mt-2 text-xs text-slate-500">{detail}</p>
    </div>
  )
}

function App() {
  const [activeNav, setActiveNav] = useState('Overview')
  const [jobs, setJobs] = useState([])
  const [readiness, setReadiness] = useState({ state: 'Checking', redis: 'unknown' })
  const [notice, setNotice] = useState('')
  const [submitting, setSubmitting] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  const refreshReadiness = useCallback(async () => {
    try {
      const response = await fetch('/api/health/ready')
      const data = await response.json()

      if (!response.ok) {
        setReadiness({
          state: 'Degraded',
          redis: data.redis || 'unknown',
        })
        return
      }

      setReadiness({
        state: data.status === 'ready' ? 'Healthy' : 'Degraded',
        redis: data.redis || 'unknown',
      })
    } catch {
      setReadiness({ state: 'Unavailable', redis: 'unknown' })
    }
  }, [])

  useEffect(() => {
    refreshReadiness()
    const interval = setInterval(refreshReadiness, 10000)
    return () => clearInterval(interval)
  }, [refreshReadiness])

  async function submitReboot(instance) {
    if (submitting) return

    setSubmitting(instance.id)
    setNotice('Submitting simulated reboot job…')

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

      const newJob = {
        id: String(data.jobId),
        instance: data.instanceId || instance.id,
        action: 'Simulated reboot',
        status: 'waiting',
        time: new Date().toLocaleTimeString(),
      }

      setJobs(current => [
        newJob,
        ...current.filter(job => job.id !== newJob.id),
      ])
      setNotice(`Job ${data.jobId} accepted for ${data.instanceId}. This is a mock operation; no AWS instance is rebooted.`)
      setRefreshKey(key => key + 1)
    } catch (error) {
      setNotice(`Could not submit job: ${error.message}`)
    } finally {
      setSubmitting('')
      refreshReadiness()
    }
  }

  useEffect(() => {
    const activeJobs = jobs.filter(job =>
      !['completed', 'failed'].includes(job.status),
    )

    if (!activeJobs.length) return undefined

    let cancelled = false

    async function pollJobs() {
      const results = await Promise.all(
        activeJobs.map(async job => {
          try {
            const response = await fetch(
              `/api/jobs/${encodeURIComponent(job.id)}`,
            )
            const data = await response.json()

            if (!response.ok) {
              return response.status === 404
                ? { id: job.id, status: 'not found' }
                : null
            }

            return {
              id: job.id,
              status: data.status,
              result: data.result,
              error: data.error,
            }
          } catch {
            return null
          }
        }),
      )

      if (cancelled) return

      setJobs(current =>
        current.map(job => {
          const result = results.find(item => item?.id === job.id)
          return result ? { ...job, ...result } : job
        }),
      )
    }

    pollJobs()
    const interval = setInterval(pollJobs, 2000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [jobs, refreshKey])

  const navItems = [
    { label: 'Overview', icon: '◫' },
    { label: 'Instances', icon: '▦' },
    { label: 'Job history', icon: '≡' },
  ]

  const redisHealthy = readiness.redis === 'available'
  const apiHealthy = readiness.state === 'Healthy'

  return (
    <div className="min-h-screen bg-[#080d18] text-slate-200">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-white/[0.08] bg-[#0b1120] lg:flex">
        <div className="flex h-20 items-center gap-3 border-b border-white/[0.08] px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400 text-lg font-black text-slate-950">R</div>
          <div>
            <p className="font-semibold tracking-wide text-white">RaaS <span className="text-cyan-400">2.0</span></p>
            <p className="text-xs text-slate-500">Reboot as a Service</p>
          </div>
        </div>

        <div className="px-4 pt-7">
          <p className="px-3 pb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600">Workspace</p>
          <nav className="space-y-1">
            {navItems.map(item => (
              <button
                key={item.label}
                onClick={() => setActiveNav(item.label)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${activeNav === item.label
                  ? 'bg-cyan-400/10 font-medium text-cyan-300 ring-1 ring-cyan-400/20'
                  : 'text-slate-400 hover:bg-white/[0.04] hover:text-white'}`}
              >
                <span className="w-5 text-center text-lg">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto border-t border-white/[0.08] p-5">
          <div className="rounded-xl border border-violet-400/20 bg-violet-400/[0.06] p-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-violet-300">
              <span>◈</span> DEMO ENVIRONMENT
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500">Jobs run through the real API and queue. Operations are simulated; AWS actions are disabled.</p>
          </div>
        </div>
      </aside>

      <main className="lg:ml-64">
        <header className="flex min-h-20 flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] px-5 py-4 sm:px-8">
          <div>
            <p className="text-xs text-slate-500">Workspace / {activeNav}</p>
            <h1 className="mt-1 text-xl font-semibold text-white">{activeNav}</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/[0.06] px-3 py-2 text-xs text-amber-300">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              Local development
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-slate-800 text-sm font-semibold text-white">R</div>
          </div>
        </header>

        <div className="space-y-8 p-5 sm:p-8">
          {notice && (
            <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cyan-400/20 bg-cyan-400/[0.06] px-4 py-3 text-sm text-cyan-100">
              <span>{notice}</span>
              <button onClick={() => setNotice('')} className="shrink-0 text-cyan-300 hover:text-white">Dismiss</button>
            </div>
          )}

          {activeNav === 'Overview' && (
            <>
              <section className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
                <div>
                  <p className="text-sm text-slate-400">infrastructure at a glance</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">RaaS Operations overview<span className="text-cyan-400">.</span></h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">Monitor API readiness and Redis availability, then track queued operations.</p>
                </div>
                <span className="w-fit rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-400">Environment: <span className="font-medium text-white">Local · Mock operations</span></span>
              </section>

              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard label="Tracked jobs" value={jobs.length} detail="Submitted in this session" icon="▦" accent="bg-cyan-400/10 text-cyan-300" />
                <MetricCard label="Completed" value={jobs.filter(job => job.status === 'completed').length} detail="Reported by BullMQ" icon="↗" accent="bg-emerald-400/10 text-emerald-300" />
                <MetricCard label="In progress" value={jobs.filter(job => ['waiting', 'active', 'delayed', 'waiting-children'].includes(job.status)).length} detail="Reported by BullMQ" icon="ϟ" accent="bg-violet-400/10 text-violet-300" />
                <MetricCard label="Failed" value={jobs.filter(job => ['failed', 'not found'].includes(job.status)).length} detail="Reported by API" icon="!" accent="bg-rose-400/10 text-rose-300" />
              </section>

              <section>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-white">Service health</h3>
                    <p className="mt-1 text-xs text-slate-500">Live API readiness endpoint; worker status is not directly exposed.</p>
                  </div>
                  <button onClick={refreshReadiness} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/[0.04]">Refresh</button>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    { name: 'API readiness', desc: 'GET /health/ready', status: readiness.state },
                    { name: 'Redis queue', desc: 'API-reported Redis connectivity', status: redisHealthy ? 'Healthy' : readiness.state === 'Checking' ? 'Checking' : 'Degraded' },
                    { name: 'Worker service', desc: 'Not independently exposed by API', status: 'Not monitored' },
                  ].map(service => (
                    <div key={service.name} className="rounded-2xl border border-white/[0.08] bg-slate-900/60 p-5">
                      <div className="flex items-start justify-between">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-lg text-cyan-300">◈</span>
                        <StatusBadge status={service.status} />
                      </div>
                      <h4 className="mt-5 font-medium text-white">{service.name}</h4>
                      <p className="mt-1 text-xs text-slate-500">{service.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              <InstanceTable instances={sampleInstances} onReboot={submitReboot} submitting={submitting} />
              <JobTable jobs={jobs.slice(0, 5)} />
            </>
          )}

          {activeNav === 'Instances' && (
            <section>
              <div className="mb-5">
                <h2 className="text-xl font-semibold text-white">Sample instance inventory</h2>
                <p className="mt-1 text-sm text-slate-500">Test IDs only. The backend does not yet expose a real AWS instance inventory.</p>
              </div>
              <InstanceTable instances={sampleInstances} onReboot={submitReboot} submitting={submitting} />
            </section>
          )}

          {activeNav === 'Job history' && (
            <section>
              <div className="mb-5">
                <h2 className="text-xl font-semibold text-white">Session job history</h2>
                <p className="mt-1 text-sm text-slate-500">Actual API/BullMQ statuses for jobs submitted in this browser session. History is not persisted by the frontend.</p>
              </div>
              <JobTable jobs={jobs} />
            </section>
          )}

          <footer className="flex flex-col justify-between gap-2 border-t border-white/[0.08] pt-5 text-xs text-slate-600 sm:flex-row">
            <p>RaaS 2.0 · Reboot as a Service</p>
            <p>Real queue workflow · Mock operations · AWS actions disabled</p>
          </footer>
        </div>
      </main>
    </div>
  )
}

function InstanceTable({ instances, onReboot, submitting }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-slate-900/60">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] p-5">
        <div>
          <h3 className="font-semibold text-white">Instance inventory</h3>
          <p className="mt-1 text-xs text-slate-500">Sample EC2-style records · mock operation target</p>
        </div>
        <span className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-400">{instances.length} records</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-white/[0.02] text-xs text-slate-500">
            <tr>
              <th className="px-5 py-3 font-medium">Instance</th>
              <th className="px-5 py-3 font-medium">Instance ID</th>
              <th className="px-5 py-3 font-medium">Type</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {instances.map(instance => (
              <tr key={instance.id} className="transition hover:bg-white/[0.02]">
                <td className="px-5 py-4">
                  <p className="font-medium text-white">{instance.name}</p>
                  <p className="mt-1 text-xs text-slate-500">{instance.zone}</p>
                </td>
                <td className="px-5 py-4 font-mono text-xs text-slate-400">{instance.id}</td>
                <td className="px-5 py-4 text-slate-400">{instance.type}</td>
                <td className="px-5 py-4"><StatusBadge status={instance.status} /></td>
                <td className="px-5 py-4">
                  <button
                    disabled={instance.status !== 'Running' || Boolean(submitting)}
                    onClick={() => onReboot(instance)}
                    className="rounded-lg border border-cyan-400/20 px-3 py-2 text-xs font-medium text-cyan-300 transition hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    {submitting === instance.id ? 'Submitting…' : 'Queue mock reboot'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function JobTable({ jobs }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-slate-900/60">
      <div className="flex items-center justify-between border-b border-white/[0.08] p-5">
        <div>
          <h3 className="font-semibold text-white">Recent operations</h3>
          <p className="mt-1 text-xs text-slate-500">Statuses retrieved from the API</p>
        </div>
        <span className="text-xs text-slate-500">{jobs.length} jobs</span>
      </div>
      {jobs.length === 0 ? (
        <p className="p-5 text-sm text-slate-500">No jobs submitted in this session yet. Queue a mock reboot above to see its lifecycle.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[580px] text-left text-sm">
            <thead className="bg-white/[0.02] text-xs text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Job ID</th>
                <th className="px-5 py-3 font-medium">Instance</th>
                <th className="px-5 py-3 font-medium">Action</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Time submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {jobs.map(job => (
                <tr key={job.id} className="hover:bg-white/[0.02]">
                  <td className="px-5 py-4 font-mono text-xs text-slate-400">{job.id}</td>
                  <td className="px-5 py-4 text-slate-300">{job.instance}</td>
                  <td className="px-5 py-4 text-slate-400">{job.action}</td>
                  <td className="px-5 py-4">
                    <StatusBadge status={job.status === 'completed' ? 'Completed' : job.status === 'failed' ? 'Failed' : job.status} />
                    {job.error && <p className="mt-1 max-w-xs text-xs text-rose-300">{job.error}</p>}
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-500">{job.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export default App
