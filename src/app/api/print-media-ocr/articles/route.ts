import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/config/api";

const BASE_URL = API_CONFIG.printMediaOcr.url;

// Pre-populated mock articles for demo
const mockArticles: any[] = [
  {
    id: 1,
    title: "Ekonomi Indonesia Tumbuh Positif di Tengah Ketidakpastian Global",
    author: "Ahmad Fauzi",
    category: "Ekonomi",
    page_number: 1,
    publication_date: "2024-01-15",
    newspaper_name: "Kompas",
    confidence_score: 0.87,
    sentiment_analysis: "positive",
    validated: true,
    created_at: "2024-01-15T08:00:00Z",
    content: "Ekonomi Indonesia menunjukkan pertumbuhan yang positif meskipun kondisi ekonomi dunia sedang tidak menentu. Pertumbuhan ini menunjukkan ketahanan ekonomi Indonesia di tengah ketidakpastian global.",
    source: 1,
    avatar_explanation: "Ekonomi Indonesia mengalami pertumbuhan yang positif meskipun kondisi ekonomi dunia sedang tidak menentu. Media Kompas memberitakan bahwa pertumbuhan ekonomi ini menunjukkan ketahanan ekonomi Indonesia di tengah ketidakpastian global. Sentimen artikel ini sangat positif dengan tingkat keyakinan 87%.",
    avatar_model: "MiniMax-M2.7-highspeed",
  },
  {
    id: 2,
    title: "Polusi Udara Jakarta Capai Tingkat Bahaya",
    author: "Siti Nurhaliza",
    category: "Lingkungan",
    page_number: 3,
    publication_date: "2024-01-14",
    newspaper_name: "Kompas",
    confidence_score: 0.92,
    sentiment_analysis: "negative",
    validated: true,
    created_at: "2024-01-14T09:30:00Z",
    content: "Kualitas udara di Jakarta mencapai tingkat yang berbahaya bagi kesehatan. Authorities diminta untuk mengambil langkah-langkah darurat dalam mengatasi masalah pencemaran udara di ibu kota.",
    source: 2,
    avatar_explanation: "Artikel ini menyoroti kondisi serius polusi udara di Jakarta yang mencapai tingkat berbahaya. berita ini menggambarkan krisis lingkungan yang memerlukan perhatian dan tindakan segera dari pemerintah dan masyarakat.",
    avatar_model: "MiniMax-M2.7-highspeed",
  },
  {
    id: 3,
    title: "Pemerintah Luncurkan Program Subsidi Listrik Baru",
    author: "Budi Santoso",
    category: "Politik",
    page_number: 5,
    publication_date: "2024-01-13",
    newspaper_name: "Republika",
    confidence_score: 0.78,
    sentiment_analysis: "neutral",
    validated: false,
    created_at: "2024-01-13T10:15:00Z",
    content: "Pemerintah mengumumkan program subsidi listrik terbaru untuk household berpenghasilan rendah. Program ini diharapkan dapat membantu masyarakat dalam menghadapi kenaikan biaya hidup.",
    source: 3,
    avatar_explanation: "Artikel ini menyampaikan informasi faktual tentang peluncuran program subsidi listrik oleh pemerintah. Meskipun موضوع subsidy bersifat positif bagi masyarakat, penyajian berita dilakukan secara netral dan objektif.",
    avatar_model: "MiniMax-M2.7-highspeed",
  },
  {
    id: 4,
    title: "Startup Teknologi Indonesia Raih Pendanaan Rp 500 Miliar",
    author: "Dewi Lestari",
    category: "Bisnis",
    page_number: 2,
    publication_date: "2024-01-12",
    newspaper_name: "Kompas",
    confidence_score: 0.91,
    sentiment_analysis: "positive",
    validated: true,
    created_at: "2024-01-12T11:00:00Z",
    content: "Startup teknologi lokal berhasil menarik minat investor dengan pendanaan sebesar Rp 500 miliar. Keberhasilan ini menunjukkan potensi besar ekosistem startup Indonesia di kancah global.",
    source: 4,
    avatar_explanation: "Kabar menggembirakan datang dari dunia startup teknologi Indonesia yang berhasil meraih pendanaan besar. Ini menunjukkan kepercayaan investor terhadap potensi dan inovasi yang dikembangkan oleh para startup tanah air.",
    avatar_model: "MiniMax-M2.7-highspeed",
  },
  {
    id: 5,
    title: "Gempa Bumi Guncang Sulawesi, Ratusan Rumah Rusak",
    author: "Ahmad Fauzi",
    category: "Sosial",
    page_number: 1,
    publication_date: "2024-01-11",
    newspaper_name: "Media Indonesia",
    confidence_score: 0.95,
    sentiment_analysis: "negative",
    validated: true,
    created_at: "2024-01-11T14:30:00Z",
    content: "Gempa bumi berkekuatan 6.2 magnitudo mengguncang wilayah Sulawesi menyebabkan kerusakan ratusan rumah. Tim rescue masih melakukan evakuasi dan pendataan korban di area terdampak.",
    source: 5,
    avatar_explanation: "Peristiwa gempa bumi di Sulawesi membawa dampak negatif yang signifikan terhadap masyarakat setempat. Berita ini menggambarkan situasi darurat yang memerlukan respons cepat dan bantuan dari berbagai pihak.",
    avatar_model: "MiniMax-M2.7-highspeed",
  },
  {
    id: 6,
    title: "Festival Budaya Nusantara Digelar di Jakarta",
    author: null,
    category: "Budaya",
    page_number: 8,
    publication_date: "2024-01-10",
    newspaper_name: "Republika",
    confidence_score: 0.85,
    sentiment_analysis: "positive",
    validated: true,
    created_at: "2024-01-10T08:45:00Z",
    content: "Festival budaya nusantara berhasil diselenggarakan di Jakarta dengan partisipasi berbagai daerah dari seluruh Indonesia. Acara ini menjadi wadah pelestarian dan promosi budaya Indonesia.",
    source: 6,
    avatar_explanation: "Festival budaya nusantara diselenggarakan dengan sukses, menampilkan keberagaman budaya Indonesia. Acara ini mendapat respons positif dan berhasil memperkenalkan budaya lokal kepada masyarakat luas.",
    avatar_model: "MiniMax-M2.7-highspeed",
  },
  {
    id: 7,
    title: "Kenaikan Harga BBM影响 Masyarakat Middle Class",
    author: "Budi Santoso",
    category: "Ekonomi",
    page_number: 4,
    publication_date: "2024-01-09",
    newspaper_name: "Kompas",
    confidence_score: 0.88,
    sentiment_analysis: "negative",
    validated: false,
    created_at: "2024-01-09T09:00:00Z",
    content: "Kenaikan harga BBM terbaru berdampak pada kehidupan masyarakat kelas menengah. Berbagai sektor mengalami efek domino dari kenaikan biaya transportasi hingga harga barang kebutuhan pokok.",
    source: 7,
    avatar_explanation: "Kenaikan harga BBM memberikan dampak negatif terhadap ekonomi household, terutama kelas menengah. Artikel ini mengulas bagaimana kebijakan kenaikan BBM berdampak pada biaya hidup masyarakat secara luas.",
    avatar_model: "MiniMax-M2.7-highspeed",
  },
  {
    id: 8,
    title: "Timnas Indonesia Lolos ke Putaran Final AFC Asian Cup",
    author: "Siti Nurhaliza",
    category: "Olahraga",
    page_number: 12,
    publication_date: "2024-01-08",
    newspaper_name: "Media Indonesia",
    confidence_score: 0.93,
    sentiment_analysis: "positive",
    validated: true,
    created_at: "2024-01-08T20:00:00Z",
    content: "Tim nasional sepak bola Indonesia berhasil lolos ke putaran final AFC Asian Cup setelah melewati babak kualifikasi dengan prestaifGemilang. Pencapaian ini menjadi sejarah baru untuk futebol Indonesia.",
    source: 8,
    avatar_explanation: "Prestasi membanggakan datang dari Timnas Indonesia yang berhasil melaju ke putaran final AFC Asian Cup. Berita ini membawa dampak positif bagi semangat sportsmanship dan kebanggaan nasional.",
    avatar_model: "MiniMax-M2.7-highspeed",
  },
];

// GET /api/print-media-ocr/articles - List all articles with pagination
export async function GET(request: NextRequest) {
  try {
    // If backend URL is not configured or is localhost, return mock data + uploaded
    if (!BASE_URL || BASE_URL.includes("localhost") || BASE_URL.includes("undefined") || BASE_URL.startsWith("/")) {
      const uploadArticles = (global as any).uploadArticles || [];
      // Combine mock data with uploaded articles
      const allArticles = [...mockArticles, ...uploadArticles].sort((a, b) =>
        new Date(b.publication_date).getTime() - new Date(a.publication_date).getTime()
      );
      return NextResponse.json({
        count: allArticles.length,
        next: null,
        previous: null,
        page_size: 10,
        current_page: 1,
        total_pages: 1,
        page_size_options: [10, 25, 50, 100],
        results: allArticles,
      });
    }

    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    const url = `${BASE_URL}/articles/${queryString ? `?${queryString}` : ""}`;

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Backend error: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error fetching articles:", error);
    // Return mock data on error
    return NextResponse.json({
      count: mockArticles.length,
      next: null,
      previous: null,
      page_size: 10,
      current_page: 1,
      total_pages: 1,
      page_size_options: [10, 25, 50, 100],
      results: mockArticles,
    });
  }
}

// POST /api/print-media-ocr/articles - Create a new article
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const response = await fetch(`${BASE_URL}/articles/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Backend error: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error creating article:", error);
    return NextResponse.json(
      {
        error: "Failed to create article",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
