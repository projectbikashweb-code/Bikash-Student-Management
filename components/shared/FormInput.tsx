'use client'

import React, { forwardRef } from 'react'

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean
}

/**
 * FormInput — isolated, controlled input component for the login form.
 *
 * Design goals:
 * - Explicit color control (no inheritance from parent opacity/blur containers)
 * - Solid background to defeat webkit autofill overrides
 * - Visible caret at all times
 * - Full autofill compatibility via box-shadow inset trick
 * - Zero dependency on Tailwind opacity modifiers (bg-white/8 bug)
 */
export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ hasError, className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        {...props}
        data-form-input
        style={{
          /* ── Reset ── */
          all: 'unset' as React.CSSProperties['all'],
          boxSizing: 'border-box',

          /* ── Layout ── */
          display: 'block',
          width: '100%',
          padding: '13px 16px',
          paddingRight: props.type === 'password' ? '44px' : '16px',
          borderRadius: '12px',

          /* ── Explicit Colors (defeat inheritance + autofill) ── */
          background: '#1e2a3a',
          color: '#ffffff',
          WebkitTextFillColor: '#ffffff',
          caretColor: '#ffffff',

          /* ── Border ── */
          border: hasError
            ? '1px solid rgba(251,113,133,0.6)'
            : '1px solid rgba(255,255,255,0.12)',

          /* ── Typography ── */
          fontSize: '14px',
          lineHeight: '1.5',
          fontFamily: 'inherit',
          letterSpacing: props.type === 'password' ? '0.1em' : 'normal',

          /* ── Interactions ── */
          outline: 'none',
          transition: 'border-color 150ms ease, box-shadow 150ms ease',

          /* ── Ensure visibility regardless of parent blend ── */
          isolation: 'isolate',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = '#ECFC3A'
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(236,252,58,0.15)'
          props.onFocus?.(e)
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = hasError
            ? 'rgba(251,113,133,0.6)'
            : 'rgba(255,255,255,0.12)'
          e.currentTarget.style.boxShadow = 'none'
          props.onBlur?.(e)
        }}
      />
    )
  }
)

FormInput.displayName = 'FormInput'
