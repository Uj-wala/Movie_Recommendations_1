import { Component } from 'react';
import { FiRefreshCw } from 'react-icons/fi';

export class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Application error boundary caught an error', error, info);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <main className="min-h-screen bg-[#050713] text-white grid place-items-center px-6">
        <section className="max-w-md rounded-2xl border border-cyan-300/20 bg-white/10 p-8 text-center shadow-[0_0_80px_rgba(34,211,238,0.2)] backdrop-blur-2xl">
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-200">System interruption</p>
          <h1 className="mt-3 text-3xl font-black">The projector glitched.</h1>
          <p className="mt-4 text-sm leading-6 text-slate-300">
            Reload the experience and CineVerse will rebuild the interface from a clean frame.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-cyan-300 px-5 py-3 font-bold text-slate-950 shadow-[0_0_28px_rgba(34,211,238,0.45)]"
          >
            <FiRefreshCw />
            Reload
          </button>
        </section>
      </main>
    );
  }
}
