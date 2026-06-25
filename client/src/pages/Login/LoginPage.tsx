import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Boxes, Mail, Lock, ArrowRight, ShieldCheck, BarChart3, QrCode } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';

const DEMO_ACCOUNTS = [
  { label: 'Super Admin', email: 'admin@eams.io' },
  { label: 'Asset Manager', email: 'asset.manager@eams.io' },
  { label: 'Auditor', email: 'auditor@eams.io' },
];

const HIGHLIGHTS = [
  { icon: Boxes, title: 'Full lifecycle', text: 'Register, assign, maintain & retire every asset.' },
  { icon: ShieldCheck, title: 'RBAC & audit', text: 'Granular permissions with an immutable trail.' },
  { icon: BarChart3, title: 'Live analytics', text: 'KPIs, utilization & depreciation in real time.' },
  { icon: QrCode, title: 'QR / barcode', text: 'Scan-ready tracking for instant verification.' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const status = useAuthStore((s) => s.status);
  const [email, setEmail] = useState('admin@eams.io');
  const [password, setPassword] = useState('Admin@123');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      toast.success('Welcome back');
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Invalid credentials');
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand / showcase side */}
      <div className="relative hidden overflow-hidden bg-ink-900 lg:block">
        <div className="absolute inset-0 bg-mesh opacity-90" />
        <div className="absolute -left-24 top-1/4 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl animate-float" />
        <div className="absolute -right-16 bottom-1/4 h-80 w-80 rounded-full bg-violet-500/20 blur-3xl animate-float" style={{ animationDelay: '2s' }} />

        <div className="relative flex h-full flex-col justify-between p-12">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-brand shadow-glow">
              <Boxes className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-lg font-bold text-white">EAMS</p>
              <p className="text-[11px] uppercase tracking-widest text-slate-400">Enterprise Asset Management</p>
            </div>
          </div>

          <div>
            <motion.h1
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
              className="max-w-md text-4xl font-bold leading-tight text-white"
            >
              Manage the full lifecycle of every <span className="gradient-text">enterprise asset</span>.
            </motion.h1>
            <p className="mt-4 max-w-md text-slate-400">
              A unified platform for IT and non-IT assets — procurement, assignment, maintenance, compliance and analytics.
            </p>

            <div className="mt-10 grid max-w-md grid-cols-2 gap-4">
              {HIGHLIGHTS.map((h, i) => (
                <motion.div
                  key={h.title}
                  initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                  className="card p-4"
                >
                  <h.icon className="mb-2 h-5 w-5 text-brand-300" />
                  <p className="text-sm font-semibold text-white">{h.title}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{h.text}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <p className="text-xs text-slate-500">© {new Date().getFullYear()} EAMS · Built for multinational operations.</p>
        </div>
      </div>

      {/* Form side */}
      <div className="flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="mb-8 lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-brand shadow-glow">
              <Boxes className="h-6 w-6 text-white" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white">Sign in to your workspace</h2>
          <p className="mt-1 text-sm text-slate-400">Enter your credentials to access the platform.</p>

          <form onSubmit={submit} className="mt-8 space-y-5">
            <div>
              <label className="label">Email address</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input className="input pl-11" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input className="input pl-11" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
              </div>
            </div>

            <Button type="submit" loading={status === 'loading'} className="w-full" icon={<ArrowRight className="h-4 w-4" />}>
              Sign in
            </Button>
          </form>

          <div className="mt-8">
            <p className="mb-3 text-center text-xs uppercase tracking-widest text-slate-500">Quick demo access</p>
            <div className="flex flex-wrap justify-center gap-2">
              {DEMO_ACCOUNTS.map((a) => (
                <button
                  key={a.email}
                  onClick={() => { setEmail(a.email); setPassword('Admin@123'); }}
                  className="chip bg-white/5 text-slate-300 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white"
                >
                  {a.label}
                </button>
              ))}
            </div>
            <p className="mt-3 text-center text-xs text-slate-500">All demo accounts use password <span className="font-mono text-slate-400">Admin@123</span></p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
