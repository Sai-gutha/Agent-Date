import DateView from "@/components/DateView";
export default async function Page({ params }: { params: Promise<{ a: string; b: string }> }) {
  const { a, b } = await params;
  return <DateView aId={a} bId={b} />;
}
