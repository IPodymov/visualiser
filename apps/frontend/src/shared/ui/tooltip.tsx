import { useId, type ReactNode } from 'react';

export const Tooltip = ({ children, content }: { children: ReactNode; content: string }) => {
  const id = useId();
  return (
    <span className="tooltip-root">
      <span tabIndex={0} aria-describedby={id}>
        {children}
      </span>
      <span id={id} role="tooltip" className="tooltip-content">
        {content}
      </span>
    </span>
  );
};
