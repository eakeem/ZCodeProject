import { notFound } from "next/navigation";
import {
  getMemorialBySlug,
  getMediaByMemorial,
  getApprovedTributes,
} from "@/lib/repo";
import MemorialNavbar from "@/components/memorial/MemorialNavbar";
import Hero from "@/components/memorial/Hero";
import Gallery from "@/components/memorial/Gallery";
import LifeStory from "@/components/memorial/LifeStory";
import ServiceInfo from "@/components/memorial/ServiceInfo";
import TributeSection from "@/components/memorial/TributeSection";
import SiteFooter from "@/components/SiteFooter";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const memorial = await getMemorialBySlug(slug);
  if (!memorial) return { title: "Memorial" };
  return {
    title: `In memory of ${memorial.deceasedName}`,
    description: memorial.tagline || memorial.bio?.slice(0, 150),
  };
}

export default async function MemorialPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const memorial = await getMemorialBySlug(slug);
  if (!memorial || !memorial.published) notFound();

  const media = await getMediaByMemorial(memorial.id);
  const approved = await getApprovedTributes(memorial.id);
  const messages = approved.filter((t) => t.type === "message");
  const candles = approved.filter((t) => t.type === "candle");

  return (
    <>
      <MemorialNavbar name={memorial.deceasedName} />
      <main>
        <Hero memorial={memorial} />
        <Gallery items={media} />
        <LifeStory memorial={memorial} portrait={media[0]} />
        <ServiceInfo memorial={memorial} />
        <TributeSection
          memorialId={memorial.id}
          initialTributes={messages}
          initialCandles={candles}
        />
      </main>
      <SiteFooter />
    </>
  );
}
