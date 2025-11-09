export const metadata = {
  title: 'Coolify Button Backend',
  description: 'Backend API for Coolify Button Dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
