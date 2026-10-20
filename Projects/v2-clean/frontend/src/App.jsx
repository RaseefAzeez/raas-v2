
import { useState } from 'react'
import './App.css'

const instances = [
  { id: 'i-0a12bc34de56f7890', name: 'raas-api-prod', type: 't3.medium', status: 'Running', zone: 'ap-south-1a' },
  { id: 'i-0b23cd45ef67a8901', name: 'worker-node-01', type: 't3.small', status: 'Running', zone: 'ap-south-1b' },
  { id: 'i-0c34de56fa78b9012', name: 'analytics-dev', type: 't3.micro', status: 'Stopped', zone: 'ap-south-1a' },
]

const initialJobs = [
  { id: 'job-1042', instance: 'raas-api-prod', action: 'Status check', status: 'Completed', time: '2 min ago' },
  { id: 'job-1041', instance: 'worker-node-01', action: 'Reboot', status: 'Completed', time: '8 min ago' },
  { id: 'job-1040', instance: 'analytics-dev', action: 'Status check', status: 'Failed', time: '14 min ago' },
]

function StatusBadge({ status }) {
  const styles = {
    Healthy: 'bg-emerald-400/10 text-emerald-400 ring-emerald-400/20',
    Running: 'bg-emerald-400/10 text-emerald-400 ring-emerald-400/20',
    Completed: 'bg-emerald-400/10 text-emerald-400 ring-emerald-400/20',
    Degraded: 'bg-amber-400/10 text-amber-300 ring-amber-400/20',
    Stopped: 'bg-slate-400/10 text-slate-300 ring-slate-400/20',
    Failed: 'bg-rose-400/10 text-rose-400 ring-rose-400/20',
    Simulated: 'bg-violet-400/10 text-violet-300 ring-violet-400/20',
  }

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${styles[status] || styles.Stopped}`}>
      <span className="mr-1.5">●</span>{status}
    </span>
  )
}

function MetricCard({ label, value, detail, icon, accent }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-slate-900/70 p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{label}</p>
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent}`}>
          {icon}
        </span>
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-white">{value}</p>
      <p className="mt-2 text-xs text-slate-500">{detail}</p>
    </div>
  )
}

function App() {
  const [activeNav, setActiveNav] = useState('Overview')
  const [jobs, setJobs] = useState(initialJobs)
  const [notice, setNotice] = useState('')

  function simulateReboot(instance) {
    const id = `demo-${Date.now()}`
    setJobs(current => [
      {
        id,
        instance: instance.name,
        action: 'Simulated reboot',
        status: 'Completed',
        time: 'Just now',
      },
      ...current,
    ])
    setNotice(`Demo only: reboot request for ${instance.name} was not sent to AWS.`)
  }

  const navItems = [
    { label: 'Overview', icon: '◫' },
    { label: 'Instances', icon: '▦' },
    { label: 'Job history', icon: '≡' },
  ]

  return (
    <div className="min-h-screen bg-[#080d18] text-slate-200">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-white/[0.08] bg-[#0b1120] lg:flex">
        <div className="flex h-20 items-center gap-3 border-b border-white/[0.08] px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400 text-lg font-black text-slate-950">
            R
          </div>
          <div>
            <p className="font-semibold tracking-wide text-white">RaaS <span className="text-cyan-400">2.0</span></p>
            <p className="text-xs text-slate-500">Cloud operations</p>
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
                    : 'text-slate-400 hover:bg-white/[0.04] hover:text-white'
                  }`}
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
            <p className="mt-2 text-xs leading-5 text-slate-500">Actions use sample data. AWS operations are not enabled.</p>
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
            <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-violet-400/20 bg-violet-400/[0.07] px-4 py-3 text-sm text-violet-200">
              {notice}
              <button onClick={() => setNotice('')} className="text-violet-300 hover:text-white">Dismiss</button>
            </div>
          )}

          {activeNav === 'Overview' && (
            <>
              <section className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
                <div>
                  <p className="text-sm text-slate-400">Your infrastructure at a glance</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">Operations overview<span className="text-cyan-400">.</span></h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">Monitor service health, review operations, and manage instance workflows from one place.</p>
                </div>
                <span className="w-fit rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-400">Environment: <span className="font-medium text-white">Local · Mock data</span></span>
              </section>

              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard label="Total instances" value="12" detail="Sample inventory" icon="▦" accent="bg-cyan-400/10 text-cyan-300" />
                <MetricCard label="Running" value="9" detail="Sample inventory" icon="↗" accent="bg-emerald-400/10 text-emerald-300" />
                <MetricCard label="Operations today" value={jobs.length + 24} detail="Demo activity only" icon="ϟ" accent="bg-violet-400/10 text-violet-300" />
                <MetricCard label="Failed operations" value="1" detail="Sample history" icon="!" accent="bg-rose-400/10 text-rose-300" />
              </section>

              <section>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-white">Service health</h3>
                    <p className="mt-1 text-xs text-slate-500">Illustrative status — not connected to Kubernetes yet</p>
                  </div>
                  <span className="text-xs text-slate-500">3 components</span>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    { name: 'API service', desc: 'REST endpoints · Port 3000', status: 'Healthy', icon: '⌘' },
                    { name: 'Redis queue', desc: 'BullMQ · Port 6379', status: 'Healthy', icon: '▤' },
                    { name: 'Worker service', desc: 'Background job processor', status: 'Healthy', icon: '⚙' },
                  ].map(service => (
                    <div key={service.name} className="rounded-2xl border border-white/[0.08] bg-slate-900/60 p-5">
                      <div className="flex items-start justify-between">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-lg text-cyan-300">{service.icon}</span>
                        <StatusBadge status={service.status} />
                      </div>
                      <h4 className="mt-5 font-medium text-white">{service.name}</h4>
                      <p className="mt-1 text-xs text-slate-500">{service.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              <InstanceTable instances={instances.slice(0, 3)} onReboot={simulateReboot} />
              <JobTable jobs={jobs.slice(0, 4)} />
            </>
          )}

          {activeNav === 'Instances' && (
            <section>
              <div className="mb-5">
                <h2 className="text-xl font-semibold text-white">Instance inventory</h2>
                <p className="mt-1 text-sm text-slate-500">Sample instances for UI development. No AWS account is connected.</p>
              </div>
              <InstanceTable instances={instances} onReboot={simulateReboot} />
            </section>
          )}

          {activeNav === 'Job history' && (
            <section>
              <div className="mb-5">
                <h2 className="text-xl font-semibold text-white">Operation history</h2>
                <p className="mt-1 text-sm text-slate-500">Locally generated demo records, not retrieved from BullMQ.</p>
              </div>
              <JobTable jobs={jobs} />
            </section>
          )}

          <footer className="flex flex-col justify-between gap-2 border-t border-white/[0.08] pt-5 text-xs text-slate-600 sm:flex-row">
            <p>RaaS 2.0 · Reboot as a Service</p>
            <p>Frontend prototype · AWS actions disabled</p>
          </footer>
        </div>
      </main>
    </div>
  )
}

function InstanceTable({ instances, onReboot }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-slate-900/60">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] p-5">
        <div>
          <h3 className="font-semibold text-white">Instance inventory</h3>
          <p className="mt-1 text-xs text-slate-500">Sample EC2-style records</p>
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
                    disabled={instance.status !== 'Running'}
                    onClick={() => onReboot(instance)}
                    className="rounded-lg border border-cyan-400/20 px-3 py-2 text-xs font-medium text-cyan-300 transition hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    Simulate reboot
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
          <p className="mt-1 text-xs text-slate-500">Example job records</p>
        </div>
        <span className="text-xs text-slate-500">{jobs.length} jobs</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[580px] text-left text-sm">
          <thead className="bg-white/[0.02] text-xs text-slate-500">
            <tr>
              <th className="px-5 py-3 font-medium">Job ID</th>
              <th className="px-5 py-3 font-medium">Instance</th>
              <th className="px-5 py-3 font-medium">Action</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {jobs.map(job => (
              <tr key={job.id} className="hover:bg-white/[0.02]">
                <td className="px-5 py-4 font-mono text-xs text-slate-400">{job.id}</td>
                <td className="px-5 py-4 text-slate-300">{job.instance}</td>
                <td className="px-5 py-4 text-slate-400">{job.action}</td>
                <td className="px-5 py-4"><StatusBadge status={job.status} /></td>
                <td className="px-5 py-4 text-xs text-slate-500">{job.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default App
