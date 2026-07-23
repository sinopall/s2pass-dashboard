export const IconPhone = ({
  className = "h-4 w-4",
}: {
  className?: string;
}) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M6.5 3.5h2.2c.7 0 1.3.5 1.4 1.2l.5 2.6c.1.6-.2 1.2-.8 1.5l-1.3.7c.9 1.9 2.5 3.5 4.4 4.4l.7-1.3c.3-.6.9-.9 1.5-.8l2.6.5c.7.1 1.2.7 1.2 1.4v2.2c0 .8-.6 1.4-1.4 1.5-8.1.6-14.6-5.9-14-14 .1-.8.7-1.4 1.5-1.4Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  </svg>
);

export const IconReset = ({
  className = "h-4 w-4",
}: {
  className?: string;
}) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M20 12a8 8 0 1 1-2.3-5.6"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path
      d="M20 4v6h-6"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
