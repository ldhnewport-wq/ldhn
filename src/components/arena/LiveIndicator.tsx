import { motion } from "framer-motion";

const LiveIndicator = () => (
  <motion.div
    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-arena-red/20 border border-arena-red/50"
    animate={{ opacity: [1, 0.4, 1] }}
    transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
  >
    <div className="w-2.5 h-2.5 rounded-full bg-arena-red" />
    <span className="font-display text-sm font-bold tracking-widest text-arena-red">EN DIRECT</span>
  </motion.div>
);

export default LiveIndicator;
