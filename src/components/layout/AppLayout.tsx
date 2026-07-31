type AppLayoutProps = {
  children?: React.ReactNode;
};

export function AppLayout({ children }: AppLayoutProps) {
  return <div className="app-layout">{children}</div>;
}
