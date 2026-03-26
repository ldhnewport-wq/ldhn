import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, X, Eye, Lock, Unlock } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

interface ArenaAdminPanelProps {
  sections: { name: string }[];
  enabledSections: boolean[];
  onToggleSection: (index: number) => void;
  forcedSection: number | null;
  onForceSection: (index: number | null) => void;
}

const ArenaAdminPanel = ({
  sections,
  enabledSections,
  onToggleSection,
  forcedSection,
  onForceSection,
}: ArenaAdminPanelProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating trigger - visible on hover in top-right */}
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 right-4 z-50 opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity duration-300 p-2 rounded-full bg-secondary/80 backdrop-blur-sm border border-border"
        title="Admin Panel"
      >
        <Settings className="w-5 h-5 text-muted-foreground" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 320, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-0 right-0 z-50 h-screen w-80 bg-card/95 backdrop-blur-md border-l border-border shadow-2xl flex flex-col"
            style={{ cursor: "default" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-display text-lg font-bold text-neon tracking-wide">
                ADMIN
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-sm hover:bg-secondary transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Sections control */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              <div>
                <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3 font-display">
                  Sections affichées
                </h3>
                <div className="space-y-2">
                  {sections.map((section, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border"
                    >
                      <span className="text-sm font-medium text-foreground">
                        {section.name}
                      </span>
                      <Switch
                        checked={enabledSections[i]}
                        onCheckedChange={() => onToggleSection(i)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Force section */}
              <div>
                <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3 font-display">
                  Forcer une vue
                </h3>
                {forcedSection !== null && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mb-3 border-arena-red text-arena-red hover:bg-destructive/10"
                    style={{ borderColor: "hsl(var(--arena-red))", color: "hsl(var(--arena-red))" }}
                    onClick={() => onForceSection(null)}
                  >
                    <Unlock className="w-4 h-4 mr-2" />
                    Libérer la rotation
                  </Button>
                )}
                <div className="space-y-1.5">
                  {sections.map((section, i) => {
                    const isForced = forcedSection === i;
                    return (
                      <button
                        key={i}
                        onClick={() => onForceSection(isForced ? null : i)}
                        className={`w-full flex items-center gap-2 p-2.5 rounded-lg text-sm transition-all text-left ${
                          isForced
                            ? "bg-primary/15 border border-primary/50 text-primary"
                            : "bg-secondary/30 border border-transparent hover:border-border hover:bg-secondary/60 text-foreground"
                        }`}
                      >
                        {isForced ? (
                          <Lock className="w-3.5 h-3.5 shrink-0" />
                        ) : (
                          <Eye className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                        )}
                        <span>{section.name}</span>
                        {isForced && (
                          <span className="ml-auto text-[10px] uppercase tracking-wider font-display text-primary">
                            Forcé
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                LDHN Arena Control
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ArenaAdminPanel;
