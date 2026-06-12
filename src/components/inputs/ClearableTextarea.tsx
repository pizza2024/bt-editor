import React, { useRef } from 'react';

/**
 * Textarea wrapper that renders a small circular clear (×) button in the
 * top-right corner whenever the textarea is non-empty. Same semantics as
 * ClearableInput — see that file for the rationale on the synthetic change
 * event and focus retention.
 */
export type ClearableTextareaProps = React.ComponentPropsWithoutRef<'textarea'> & {
  wrapperClassName?: string;
};

const ClearableTextarea = React.forwardRef<HTMLTextAreaElement, ClearableTextareaProps>(
  ({ value, onChange, wrapperClassName, className, ...rest }, forwardedRef) => {
    const innerRef = useRef<HTMLTextAreaElement | null>(null);
    const setRefs = (el: HTMLTextAreaElement | null) => {
      innerRef.current = el;
      if (typeof forwardedRef === 'function') forwardedRef(el);
      else if (forwardedRef) forwardedRef.current = el;
    };

    const handleClear = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (innerRef.current) {
        innerRef.current.value = '';
        onChange?.({
          target: innerRef.current,
          currentTarget: innerRef.current,
        } as unknown as React.ChangeEvent<HTMLTextAreaElement>);
        innerRef.current.focus();
      }
    };

    const hasValue = value !== undefined && value !== null && String(value) !== '';

    return (
      <div className={`input-clearable${wrapperClassName ? ' ' + wrapperClassName : ''}`}>
        <textarea
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
            aria-label="Clear text"
            title="Clear"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleClear}
          >
            ✕
          </button>
        )}
      </div>
    );
  }
);

ClearableTextarea.displayName = 'ClearableTextarea';

export default ClearableTextarea;
