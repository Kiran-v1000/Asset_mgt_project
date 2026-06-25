import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Boxes, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-brand shadow-glow">
        <Boxes className="h-8 w-8 text-white" />
      </motion.div>
      <h1 className="mt-6 text-6xl font-bold gradient-text">404</h1>
      <p className="mt-2 text-lg font-semibold text-white">Page not found</p>
      <p className="mt-1 max-w-sm text-sm text-slate-400">The page you're looking for doesn't exist or has been moved.</p>
      <Link to="/dashboard" className="btn-primary mt-6">
        <Home className="h-4 w-4" /> Back to dashboard
      </Link>
    </div>
  );
}
