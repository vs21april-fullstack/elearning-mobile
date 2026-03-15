import styles from "./Spinner.module.css";

/**
 * Reusable Spinner Component
 *
 * @param {string} size - Size of spinner: "xs" | "sm" | "md" | "lg"
 * @param {string} variant - Color variant: "primary" | "light" | "dark" | "white"
 * @param {boolean} fullPage - Display as full-page overlay
 * @param {string} text - Optional text to display next to spinner
 * @param {string} className - Additional CSS classes
 * @param {boolean} inline - Display inline (for buttons)
 */
export default function Spinner({
  size = "sm",
  variant = "dark",
  fullPage = false,
  text = "",
  className = "",
  inline = false,
}) {
  // Map size to CSS class
  const sizeClass =
    {
      xs: styles.spinnerXs,
      sm: styles.spinnerSm,
      md: styles.spinnerMd,
      lg: styles.spinnerLg,
    }[size] || styles.spinnerSm;

  // Map variant to CSS class
  const variantClass =
    {
      primary: styles.spinnerPrimary,
      light: styles.spinnerLight,
      dark: styles.spinnerDark,
      white: styles.spinnerWhite,
    }[variant] || styles.spinnerDark;

  const spinner = (
    <div
      className={`${styles.spinner} ${sizeClass} ${variantClass} ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className={styles.visuallyHidden}>Loading...</span>
    </div>
  );

  // Full page loading overlay
  if (fullPage) {
    return (
      <div className={styles.fullPageOverlay}>
        <div className={styles.fullPageContent}>
          {spinner}
          {text && <p className={styles.fullPageText}>{text}</p>}
        </div>
      </div>
    );
  }

  // Inline spinner with optional text (for buttons)
  if (inline || text) {
    return (
      <span className={styles.inlineWrapper}>
        {spinner}
        {text && <span className={styles.spinnerText}>{text}</span>}
      </span>
    );
  }

  return spinner;
}
