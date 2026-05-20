import { motion, useScroll, useTransform } from 'framer-motion';

export const CinematicBackground = () => {
  const { scrollYProgress } = useScroll();
  const yNear = useTransform(scrollYProgress, [0, 1], [0, -140]);
  const yFar = useTransform(scrollYProgress, [0, 1], [0, -60]);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[radial-gradient(circle_at_50%_0%,rgba(125,92,255,0.26),transparent_33%),linear-gradient(135deg,#050713_0%,#0b1024_46%,#050713_100%)]">
      <motion.div
        style={{ y: yFar }}
        className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(34,211,238,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.12)_1px,transparent_1px)] [background-size:70px_70px]"
      />
      <motion.div
        style={{ y: yNear }}
        className="absolute -left-24 top-12 h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl"
        animate={{ x: [0, 38, 0], scale: [1, 1.12, 1] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        style={{ y: yFar }}
        className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-fuchsia-500/20 blur-3xl"
        animate={{ x: [0, -55, 0], y: [0, 35, 0] }}
        transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-0 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-indigo-500/20 blur-3xl"
        animate={{ opacity: [0.28, 0.55, 0.28] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(5,7,19,0.35)_58%,rgba(5,7,19,0.92)_100%)]" />
      <div className="absolute inset-0 opacity-[0.08] [background-image:repeating-linear-gradient(0deg,#fff_0,#fff_1px,transparent_1px,transparent_4px)]" />
    </div>
  );
};
