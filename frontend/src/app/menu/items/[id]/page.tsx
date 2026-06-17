export const dynamic = "force-dynamic";

import { getItem } from "@/lib/menu-api";
import { notFound } from "next/navigation";
import ItemDetail from "@/components/menu/ItemDetail";

export default async function ItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getItem(Number(id)).catch(() => null);

  if (!item) notFound();

  return <ItemDetail item={item} />;
}
