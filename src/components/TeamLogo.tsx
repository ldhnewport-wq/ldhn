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
 */
const TeamLogo = ({ logoUrl, abbr, color, name, className = "", textClassName = "" }: TeamLogoProps) => {
  return (
    <div
      className={`flex items-center justify-center overflow-hidden border-2 ${className}`}
      style={{ borderColor: color }}
    >
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={name || abbr}
          className="w-full h-full object-contain p-1"
        />
      ) : (
        <span className={`font-bold ${textClassName}`} style={{ color }}>
          {abbr}
        </span>
      )}
    </div>
  );
};

export default TeamLogo;
