import React, { useRef } from 'react';

/**
 * Text input wrapper that renders a small circular clear (×) button on the
 * right side of the field whenever the current value is non-empty. The
 * button:
 *   - emits the same onChange({ target: { value: '' } }) as a normal user
 *     keystroke so external state stays in sync,
 *   - keeps the input focused after clearing so the user can keep typing,
 *   - adapts its colors to the active theme via .input-clear-btn in App.css.
 *
 * All other props (placeholder, onKeyDown, onBlur, aria-*, etc.) are passed
 * straight through to the underlying <input>.
 */
export type ClearableInputProps = React.ComponentPropsWithoutRef<'input'> & {
  /** Optional className applied to the wrapping <div>. */
  wrapperClassName?: string;
};

const ClearableInput = React.forwardRef<HTMLInputElement, ClearableInputProps>(
  ({ value, onChange, wrapperClassName, className, ...rest }, forwardedRef) => {
    const innerRef = useRef<HTMLInputElement | null>(null);
    // Compose forwarded ref with our internal ref so handleClear can focus().
    const setRefs = (el: HTMLInputElement | null) => {
      innerRef.current = el;
      if (typeof forwardedRef === 'function') forwardedRef(el);
      else if (forwardedRef) forwardedRef.current = el;
    };

    const handleClear = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (innerRef.current) {
        // Mirror React's native input change event shape so consumers that
        // read e.target.value keep working.
        const nativeEvent = new Event('input', { bubbles: true });
        const tracker = innerRef.current.value;
        innerRef.current.value = '';
        // Reuse React's onChange to update the controlled state.
        onChange?.({
          target: innerRef.current,
          currentTarget: innerRef.current,
        } as unknown as React.ChangeEvent<HTMLInputElement>);
        // Keep focus so the user can type again immediately.
        innerRef.current.focus();
        // Prevent unused-var warning from the linter.
        void nativeEvent;
        void tracker;
      }
    };

    const hasValue = value !== undefined && value !== null && String(value) !== '';

    return (
      <div className={`input-clearable${wrapperClassName ? ' ' + wrapperClassName : ''}`}>
        <input
          ref={setRefs}
          value={value}
          onChange={onChange}
          className={className}
          {...rest}
        />
        {hasValue && (
          <button
            type="button"
            className="input-clear-btn"
            aria-label="Clear input"
            title="Clear"
            onMouseDown={(e) => e.preventDefault() /* don't steal focus */}
            onClick={handleClear}
          >
            ✕
          </button>
        )}
      </div>
    );
  }
);

ClearableInput.displayName = 'ClearableInput';

export default ClearableInput;
