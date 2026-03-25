import { motion } from "framer-motion";

interface SectionTitleProps {
  title: string;
  subtitle?: string;
}

const SectionTitle = ({ title, subtitle }: SectionTitleProps) => (
  <motion.div
    className="mb-8 text-center"
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <h2 className="font-display text-5xl md:text-6xl font-bold tracking-wider text-neon uppercase">
      {title}
    </h2>
    {subtitle && (
      <p className="mt-2 text-lg text-muted-foreground tracking-widest uppercase">{subtitle}</p>
    )}
    <div className="mt-4 mx-auto w-32 h-1 bg-primary rounded-full glow-neon" />
  </motion.div>
);

export default SectionTitle;
