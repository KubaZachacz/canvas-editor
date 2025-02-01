const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="mx-auto max-w-[1542px] px-4 box-content">{children}</div>
  );
};

export default Layout;
