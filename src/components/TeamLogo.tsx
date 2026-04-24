interface TeamLogoProps {
  logoUrl?: string | null;
  abbr: string;
  color: string;
  name?: string;
  className?: string;
  textClassName?: string;
}

/**
 * Affiche le logo de l'équipe s'il existe, sinon retombe sur l'abréviation colorée.
 * Le conteneur (taille, forme, bordure) est passé via `className`.
 * Fond blanc pour faire ressortir les logos et bordure colorée à la couleur de l'équipe.
 */
const TeamLogo = ({ logoUrl, abbr, color, name, className = "", textClassName = "" }: TeamLogoProps) => {
  if (logoUrl) {
    return (
      <div
        className={`flex items-center justify-center overflow-hidden bg-white shadow-lg ring-2 ring-offset-2 ring-offset-background ${className}`}
        style={{
          // @ts-expect-error CSS var
          "--tw-ring-color": color,
          boxShadow: `0 4px 14px ${color}66, 0 0 0 1px ${color}`,
        }}
      >
        <img
          src={logoUrl}
          alt={name || abbr}
          className="w-[88%] h-[88%] object-contain"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center overflow-hidden border-2 bg-white shadow-md ${className}`}
      style={{
        borderColor: color,
        boxShadow: `0 4px 12px ${color}55`,
      }}
    >
      <span className={`font-bold ${textClassName}`} style={{ color }}>
        {abbr}
      </span>
    </div>
  );
};

export default TeamLogo;
