
import type React from 'react';

interface PageHeaderProps {
  title: string | React.ReactNode; // Allow ReactNode for title for Skeletons
  description?: string | React.ReactNode; // Allow ReactNode for description for Skeletons
  children?: React.ReactNode; // For actions like buttons
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="mb-6 md:flex md:items-center md:justify-between">
      <div className="flex-1 min-w-0">
        <h1 className="text-3xl font-bold leading-tight text-foreground font-headline">{title}</h1>
        {description && (
          <div className="mt-1 text-sm text-muted-foreground">{description}</div>
        )}
      </div>
      {children && <div className="mt-4 flex md:mt-0 md:ml-4">{children}</div>}
    </div>
  );
}
