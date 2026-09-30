import ProfileView from "@/components/ProfileView";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <ProfileView id={(await params).id} />;
}
