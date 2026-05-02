import {
  AverageTicketsCreated,
  Conversions,
  CustomerSatisfication,
  Metrics,
  Posts,
  SentimentStatistics,
  TicketByChannels,
  AspectSentimentStats,
  EmotionDetectionStats,
  // TrendAnalyzerStats,
  ModelManagementStats,
} from "@/components/chart-blocks";
import Container from "@/components/container";

export default function Home() {
  return (
    <div>
      <div className="grid grid-cols-1 divide-y border-b border-border laptop:grid-cols-2 laptop:divide-x laptop:divide-y-0 laptop:divide-border">
        <Container className="py-4 laptop:col-span-1">
          <Posts />
        </Container>
        <Container className="py-4 laptop:col-span-1">
          <AspectSentimentStats />
        </Container>
      </div>
      <div className="grid grid-cols-1 divide-y border-b border-border laptop:grid-cols-2 laptop:divide-x laptop:divide-y-0 laptop:divide-border">
        <Container className="py-4 laptop:col-span-1">
          <EmotionDetectionStats />
        </Container>
      </div>
      <Container className="border-b border-border py-4">
        <SentimentStatistics />
      </Container>
      {/* <Container className="border-b border-border py-4">
        <TrendAnalyzerStats />
      </Container> */}
      {/* <Container className="border-b border-border py-4">
        <ModelManagementStats />
      </Container> */}
      {/* <Metrics /> */}
      {/* <div className="grid grid-cols-1 divide-y border-b border-border laptop:grid-cols-3 laptop:divide-x laptop:divide-y-0 laptop:divide-border">
        <Container className="py-4 laptop:col-span-2">
          <AverageTicketsCreated />
        </Container>
        <Container className="py-4 laptop:col-span-1">
          <Conversions />
        </Container>
      </div> */}
      {/* <div className="grid grid-cols-1 divide-y border-b border-border laptop:grid-cols-2 laptop:divide-x laptop:divide-y-0 laptop:divide-border">
        <Container className="py-4 laptop:col-span-1">
          <TicketByChannels />
        </Container>
        <Container className="py-4 laptop:col-span-1">
          <CustomerSatisfication />
        </Container>
      </div> */}
    </div>
  );
}
