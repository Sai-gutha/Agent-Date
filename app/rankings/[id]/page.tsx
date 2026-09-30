import RankingsView from "@/components/RankingsView";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <RankingsView id={(await params).id} />;
}
