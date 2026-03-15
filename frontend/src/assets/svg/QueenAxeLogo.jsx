export default function QueenAxeLogo({
  width = 220,
  className = "",
  variant = "full",
}) {
  const logoSrc = "/queenaxe.png";

  return (
    <img
      className={className}
      src={logoSrc}
      alt="QueenAxe logo"
      width={width}
      loading="eager"
      data-variant={variant}
      style={{ height: "auto", objectFit: "contain", display: "block" }}
    />
  );
}
