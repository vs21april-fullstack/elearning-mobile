import { Controller } from "react-hook-form";
import styles from "./FormField.module.css";

// Helper function to get nested error from path
const getNestedError = (errors, path) => {
  if (!errors || !path) return undefined;
  const keys = path.split(/[.[\]]+/).filter(Boolean);
  return keys.reduce((acc, key) => acc?.[key], errors);
};

// Shared styles
export const labelStyle = {
  display: "block",
};

export const inputStyle = {
  width: "100%",
};

export const textareaStyle = {
  ...inputStyle,
};

export const errorStyle = {
  color: "#dc3545",
};

// FormField Component
export function FormField({
  label,
  name,
  control,
  errors,
  type = "text",
  placeholder,
  required = false,
  ...props
}) {
  const error = getNestedError(errors, name);

  return (
    <div className={styles.fieldWrapper}>
      {label && (
        <label className={styles.label}>
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <input
            {...field}
            {...props}
            type={type}
            className={`${styles.inputBase} ${error ? styles.inputError : ""}`}
            placeholder={placeholder}
          />
        )}
      />
      {error && <div className={styles.error}>{error.message}</div>}
    </div>
  );
}

// TextareaField Component
export function TextareaField({
  label,
  name,
  control,
  errors,
  placeholder,
  required = false,
  rows = 3,
  ...props
}) {
  const error = getNestedError(errors, name);

  return (
    <div className={styles.fieldWrapper}>
      {label && (
        <label className={styles.label}>
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <textarea
            {...field}
            {...props}
            className={`${styles.inputBase} ${styles.textarea} ${error ? styles.inputError : ""}`}
            placeholder={placeholder}
          />
        )}
      />
      {error && <div className={styles.error}>{error.message}</div>}
    </div>
  );
}

// PasswordField Component
export function PasswordField({
  label,
  name,
  control,
  errors,
  placeholder,
  showPassword,
  onTogglePassword,
  PasswordIcon = null,
  required = false,
  ...props
}) {
  const error = getNestedError(errors, name);

  return (
    <div className={styles.fieldWrapper}>
      {label && (
        <label className={styles.label}>
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}
      <div className={styles.passwordWrap}>
        <Controller
          name={name}
          control={control}
          render={({ field }) => (
            <input
              {...field}
              {...props}
              type={showPassword ? "text" : "password"}
              className={`${styles.inputBase} ${styles.passwordInput} ${error ? styles.inputError : ""}`}
              placeholder={placeholder}
            />
          )}
        />
        <button
          type="button"
          className={styles.passwordToggle}
          onClick={onTogglePassword}
        >
          {PasswordIcon}
        </button>
      </div>
      {error && <div className={styles.error}>{error.message}</div>}
    </div>
  );
}

// SelectField Component (for react-select)
export function SelectField({
  label,
  name,
  control,
  errors,
  options,
  placeholder,
  isClearable = true,
  isMulti = false,
  SelectComponent,
  required = false,
  selectStyles,
  ...props
}) {
  const error = getNestedError(errors, name);

  return (
    <div className={styles.fieldWrapper}>
      {label && (
        <label className={styles.label}>
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}
      <Controller
        name={name}
        control={control}
        render={({ field }) =>
          SelectComponent ? (
            <SelectComponent
              {...field}
              {...props}
              options={options}
              value={field.value}
              onChange={(option) =>
                field.onChange(isMulti ? option : option?.value || "")
              }
              isClearable={isClearable}
              isMulti={isMulti}
              placeholder={placeholder}
              styles={selectStyles}
              error={!!error}
            />
          ) : (
            <select
              {...field}
              {...props}
              className={`${styles.inputBase} ${error ? styles.inputError : ""}`}
            >
              {placeholder && (
                <option value="" disabled>
                  {placeholder}
                </option>
              )}
              {options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )
        }
      />
      {error && <div className={styles.error}>{error.message}</div>}
    </div>
  );
}

// Simple Input Component (for non-form inputs like filters)
export function Input({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  id,
  className = "",
  ...props
}) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
      )}
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`${styles.inputBase} ${className}`}
        {...props}
      />
    </div>
  );
}
