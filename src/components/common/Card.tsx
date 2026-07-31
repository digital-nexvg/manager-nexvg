type CardProps = {
  title?: string;
  children?: React.ReactNode;
};

export function Card({ title, children }: CardProps) {
  return (
    <section>
      {title ? <h2>{title}</h2> : null}
      {children}
    </section>
  );
}
