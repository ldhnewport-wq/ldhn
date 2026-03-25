import { motion } from "framer-motion";

interface ProgressBarProps {
  duration: number;
  currentSection: number;
  totalSections: number;
  sectionNames: string[];
}

const ProgressBar = ({ duration, currentSection, totalSections, sectionNames }: ProgressBarProps) => (
  <div className="fixed bottom-0 left-0 right-0 z-50 px-8 pb-4">
    <div className="flex items-center gap-2 max-w-4xl mx-auto">
      {Array.from({ length: totalSections }).map((_, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <span className={`text-[10px] font-display tracking-wider uppercase ${i === currentSection ? 'text-neon' : 'text-muted-foreground/50'}`}>
            {sectionNames[i]}
          </span>
          <div className="w-full h-1 rounded-full bg-arena-surface-light overflow-hidden">
            {i === currentSection ? (
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: duration / 1000, ease: "linear" }}
                key={currentSection}
              />
            ) : i < currentSection ? (
              <div className="h-full bg-primary/40 rounded-full w-full" />
            ) : null}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default ProgressBar;
