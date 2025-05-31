export const PageContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-full w-full flex-col p-4 md:p-4">{children}</div>
  );
};

export const PageHeader = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex w-full items-center justify-between pb-4">
      {children}
    </div>
  );
};

export const PageHeaderContent = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return <div className="w-full space-y-1">{children}</div>;
};

export const PageTitle = ({ children }: { children: React.ReactNode }) => {
  return <h1 className="text-2xl font-bold">{children}</h1>;
};

export const PageDescription = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return <p className="text-muted-foreground text-sm">{children}</p>;
};

export const PageActions = ({ children }: { children: React.ReactNode }) => {
  return <div className="flex items-center gap-2">{children}</div>;
};

export const PageContent = ({ children }: { children: React.ReactNode }) => {
  return <div className="w-full flex-1">{children}</div>;
};
