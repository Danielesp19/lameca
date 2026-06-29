import TableSessionMinter from "@/components/menu/TableSessionMinter";

// El QR físico de cada mesa apunta aquí (/t/<token>). Esta página canjea el
// token por una sesión corta y redirige al menú. El token NO queda en la URL
// del menú: cualquier link compartido del menú es público y sin sesión.
export default async function TableLandingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <TableSessionMinter token={token} />;
}
