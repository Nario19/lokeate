import * as React from "react";

export interface LokeateInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const LokeateInput = React.forwardRef<HTMLInputElement, LokeateInputProps>(
  ({ label, error, helperText, id, className = "", ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="space-y-1">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[11px] font-extrabold uppercase tracking-wider text-[#20231f]"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-[#20231f] bg-white transition-all placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:bg-slate-50 disabled:text-slate-400 ${
            error
              ? "border-rose-300 focus:border-rose-500 focus:ring-rose-200"
              : "border-[#e1e4df] focus:border-[#e35b44] focus:ring-[#e35b44]/20"
          } ${className}`}
          {...props}
        />
        {error && <p className="text-[11px] text-rose-600 font-semibold">{error}</p>}
        {helperText && !error && (
          <p className="text-[11px] text-[#7d817c]">{helperText}</p>
        )}
      </div>
    );
  }
);

LokeateInput.displayName = "LokeateInput";

export interface LokeateSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: { value: string; label: string }[];
}

export const LokeateSelect = React.forwardRef<HTMLSelectElement, LokeateSelectProps>(
  ({ label, error, helperText, id, options, children, className = "", ...props }, ref) => {
    const selectId = id || props.name;

    return (
      <div className="space-y-1">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-[11px] font-extrabold uppercase tracking-wider text-[#20231f]"
          >
            {label}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-[#20231f] bg-white transition-all focus:outline-none focus:ring-2 disabled:bg-slate-50 disabled:text-slate-400 ${
            error
              ? "border-rose-300 focus:border-rose-500 focus:ring-rose-200"
              : "border-[#e1e4df] focus:border-[#e35b44] focus:ring-[#e35b44]/20"
          } ${className}`}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        {error && <p className="text-[11px] text-rose-600 font-semibold">{error}</p>}
        {helperText && !error && (
          <p className="text-[11px] text-[#7d817c]">{helperText}</p>
        )}
      </div>
    );
  }
);

LokeateSelect.displayName = "LokeateSelect";

export interface LokeateTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const LokeateTextarea = React.forwardRef<HTMLTextAreaElement, LokeateTextareaProps>(
  ({ label, error, helperText, id, className = "", ...props }, ref) => {
    const textareaId = id || props.name;

    return (
      <div className="space-y-1">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-[11px] font-extrabold uppercase tracking-wider text-[#20231f]"
          >
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-[#20231f] bg-white transition-all placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:bg-slate-50 disabled:text-slate-400 ${
            error
              ? "border-rose-300 focus:border-rose-500 focus:ring-rose-200"
              : "border-[#e1e4df] focus:border-[#e35b44] focus:ring-[#e35b44]/20"
          } ${className}`}
          {...props}
        />
        {error && <p className="text-[11px] text-rose-600 font-semibold">{error}</p>}
        {helperText && !error && (
          <p className="text-[11px] text-[#7d817c]">{helperText}</p>
        )}
      </div>
    );
  }
);

LokeateTextarea.displayName = "LokeateTextarea";
