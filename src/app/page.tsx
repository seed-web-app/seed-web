import HomeFeedPage from "@/app/home/page";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    model?: string;
  }>;
}

export default async function RootPage({ searchParams }: PageProps) {
  return <HomeFeedPage searchParams={searchParams} />;
}
