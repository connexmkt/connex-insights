import type { LucideIcon } from "lucide-react";
import {
  Users,
  Eye,
  BarChart3,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Play,
  MousePointerClick,
  Activity,
} from "lucide-react";

export type Tenant = {
  name: string;
  handle: string;
};

export const tenant: Tenant = {
  name: "Aurora Cosméticos",
  handle: "@auroracosmeticos",
};

export const currentUser = {
  name: "Marina Velloso",
  role: "Gerente de Marketing",
  email: "marina@auroracosmeticos.com",
  initials: "MV",
};

export type SocialNetwork = {
  id: string;
  name: string;
  handle: string;
  color: string;
  connected: boolean;
};

export const networks: SocialNetwork[] = [
  {
    id: "instagram",
    name: "Instagram",
    handle: "@auroracosmeticos",
    color: "#E1306C",
    connected: true,
  },
];

export type MetricCard = {
  id: string;
  label: string;
  value: string;
  change: number;
  icon: LucideIcon;
  spark: number[];
};

function spark(seed: number, points = 14): number[] {
  const out: number[] = [];
  let v = seed;
  for (let i = 0; i < points; i++) {
    v = Math.max(
      1,
      v + Math.sin(i * 1.3 + seed) * (seed * 0.05) + (i % 3) * (seed * 0.02),
    );
    out.push(Math.round(v));
  }
  return out;
}

export const metricCards: MetricCard[] = [
  {
    id: "followers",
    label: "Seguidores",
    value: "184.302",
    change: 4.8,
    icon: Users,
    spark: spark(120),
  },
  {
    id: "reach",
    label: "Alcance",
    value: "1.24M",
    change: 12.3,
    icon: Eye,
    spark: spark(90),
  },
  {
    id: "impressions",
    label: "Impressões",
    value: "2.86M",
    change: 8.1,
    icon: BarChart3,
    spark: spark(140),
  },
  {
    id: "engagement",
    label: "Engajamento",
    value: "6,9%",
    change: 1.4,
    icon: Activity,
    spark: spark(60),
  },
  {
    id: "likes",
    label: "Curtidas",
    value: "312.480",
    change: 9.6,
    icon: Heart,
    spark: spark(110),
  },
  {
    id: "comments",
    label: "Comentários",
    value: "28.914",
    change: 5.2,
    icon: MessageCircle,
    spark: spark(45),
  },
  {
    id: "shares",
    label: "Compartilhamentos",
    value: "19.207",
    change: 14.7,
    icon: Share2,
    spark: spark(35),
  },
  {
    id: "saves",
    label: "Salvamentos",
    value: "41.663",
    change: -2.3,
    icon: Bookmark,
    spark: spark(70),
  },
  {
    id: "views",
    label: "Visualizações",
    value: "4.12M",
    change: 18.9,
    icon: Play,
    spark: spark(160),
  },
  {
    id: "profile-clicks",
    label: "Cliques no Perfil",
    value: "52.118",
    change: 6.5,
    icon: MousePointerClick,
    spark: spark(55),
  },
];

export type RangeKey = "7d" | "30d" | "90d" | "12m";

export const rangeOptions: { key: RangeKey; label: string }[] = [
  { key: "7d", label: "7 dias" },
  { key: "30d", label: "30 dias" },
  { key: "90d", label: "90 dias" },
  { key: "12m", label: "12 meses" },
];

const months = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

function buildSeries(
  range: RangeKey,
  base: number,
  growth: number,
  noise: number,
) {
  const count =
    range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : 12;
  const data: { label: string; value: number }[] = [];
  let v = base;
  for (let i = 0; i < count; i++) {
    v = v + growth + Math.sin(i * 0.7) * noise + (i % 4) * (noise * 0.3);
    let label: string;
    if (range === "12m") label = months[i % 12];
    else if (range === "7d")
      label = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"][i % 7];
    else label = `${i + 1}`;
    data.push({ label, value: Math.round(v) });
  }
  return data;
}

export function followerGrowth(range: RangeKey) {
  return buildSeries(range, 172000, range === "12m" ? 1200 : 320, 280);
}

export function reachSeries(range: RangeKey) {
  return buildSeries(range, 38000, range === "12m" ? 2400 : 600, 5200).map(
    (d) => ({
      label: d.label,
      value: Math.max(0, d.value),
    }),
  );
}

export function engagementSeries(range: RangeKey) {
  const count =
    range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : 12;
  const data: { label: string; value: number }[] = [];
  for (let i = 0; i < count; i++) {
    let label: string;
    if (range === "12m") label = months[i % 12];
    else if (range === "7d")
      label = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"][i % 7];
    else label = `${i + 1}`;
    data.push({
      label,
      value: Math.round(40 + Math.abs(Math.sin(i * 0.9)) * 90 + (i % 5) * 8),
    });
  }
  return data;
}

export function impressionsSeries(range: RangeKey) {
  return buildSeries(range, 86000, range === "12m" ? 5200 : 1400, 9000).map(
    (d) => ({
      label: d.label,
      value: Math.max(0, d.value),
    }),
  );
}

export type Insight = {
  id: string;
  text: string;
  tone: "positive" | "neutral" | "warning";
};

export const insights: Insight[] = [
  {
    id: "1",
    text: "Seu engajamento aumentou 18% nesta semana em comparação à anterior.",
    tone: "positive",
  },
  {
    id: "2",
    text: "O melhor horário para publicar foi às 19h, com pico de alcance orgânico.",
    tone: "neutral",
  },
  {
    id: "3",
    text: "Os Reels tiveram desempenho 42% superior aos posts estáticos.",
    tone: "positive",
  },
  {
    id: "4",
    text: "Seus seguidores cresceram principalmente entre 25 e 34 anos.",
    tone: "neutral",
  },
  {
    id: "5",
    text: "O alcance orgânico caiu 7% nos últimos sete dias — considere novos formatos.",
    tone: "warning",
  },
];

export type Post = {
  id: string;
  title: string;
  type: "Reel" | "Carrossel" | "Imagem" | "Story";
  date: string;
  reach: string;
  likes: string;
  comments: string;
  shares: string;
  engagement: string;
  thumb: string;
};

export const topPosts: Post[] = [
  {
    id: "1",
    title: "Rotina de skincare noturna em 4 passos",
    type: "Reel",
    date: "12 jun 2026",
    reach: "248.910",
    likes: "31.204",
    comments: "2.418",
    shares: "4.092",
    engagement: "9,8%",
    thumb: "/posts/skincare-routine.png",
  },
  {
    id: "2",
    title: "Lançamento: Sérum de Vitamina C",
    type: "Carrossel",
    date: "09 jun 2026",
    reach: "186.430",
    likes: "22.870",
    comments: "1.903",
    shares: "2.640",
    engagement: "8,1%",
    thumb: "/posts/vitamin-c-serum.png",
  },
  {
    id: "3",
    title: "Antes e depois: 30 dias de uso",
    type: "Reel",
    date: "05 jun 2026",
    reach: "162.087",
    likes: "19.540",
    comments: "3.112",
    shares: "1.870",
    engagement: "7,6%",
    thumb: "/posts/before-after.png",
  },
  {
    id: "4",
    title: "Dicas para pele oleosa no verão",
    type: "Imagem",
    date: "02 jun 2026",
    reach: "98.220",
    likes: "11.305",
    comments: "842",
    shares: "1.204",
    engagement: "5,4%",
    thumb: "/posts/oily-skin-tips.png",
  },
  {
    id: "5",
    title: "Bastidores da nova campanha",
    type: "Carrossel",
    date: "28 mai 2026",
    reach: "74.560",
    likes: "8.940",
    comments: "612",
    shares: "788",
    engagement: "4,9%",
    thumb: "/posts/campaign-bts.png",
  },
];

export const ageData = [
  { label: "13-17", value: 4 },
  { label: "18-24", value: 22 },
  { label: "25-34", value: 38 },
  { label: "35-44", value: 21 },
  { label: "45-54", value: 10 },
  { label: "55+", value: 5 },
];

export const genderData = [
  { label: "Feminino", value: 68 },
  { label: "Masculino", value: 29 },
  { label: "Outro", value: 3 },
];

export const cityData = [
  { label: "São Paulo", value: 28 },
  { label: "Rio de Janeiro", value: 17 },
  { label: "Belo Horizonte", value: 11 },
  { label: "Curitiba", value: 8 },
  { label: "Porto Alegre", value: 7 },
];

export const countryData = [
  { label: "Brasil", value: 82 },
  { label: "Portugal", value: 7 },
  { label: "EUA", value: 5 },
  { label: "Argentina", value: 3 },
  { label: "Outros", value: 3 },
];

export const reports = [
  {
    id: "monthly",
    name: "Resumo Mensal",
    description:
      "Visão consolidada de seguidores, alcance e engajamento do mês.",
    period: "Mensal",
    frequency: "Todo dia 1º",
    status: "Agendado",
  },
  {
    id: "campaign",
    name: "Análise de Campanha",
    description:
      "Desempenho detalhado de posts e stories de uma campanha específica.",
    period: "Sob demanda",
    frequency: "Manual",
    status: "Pronto",
  },
  {
    id: "audience",
    name: "Perfil de Público",
    description: "Demografia, localização e horários de pico da sua audiência.",
    period: "Trimestral",
    frequency: "A cada 90 dias",
    status: "Agendado",
  },
  {
    id: "competitor",
    name: "Benchmark Concorrência",
    description:
      "Comparativo de crescimento frente aos principais concorrentes.",
    period: "Mensal",
    frequency: "Todo dia 5",
    status: "Pronto",
  },
  {
    id: "stories",
    name: "Performance de Stories",
    description: "Taxa de retenção, saídas e respostas dos stories publicados.",
    period: "Semanal",
    frequency: "Toda segunda",
    status: "Agendado",
  },
  {
    id: "executive",
    name: "Relatório Executivo",
    description: "Resumo de alto nível com KPIs e recomendações da IA.",
    period: "Mensal",
    frequency: "Manual",
    status: "Pronto",
  },
];

// Calendar publication frequency: value = number of posts that day (0-3)
export function publicationDays(): { day: number; posts: number }[] {
  const days: { day: number; posts: number }[] = [];
  for (let d = 1; d <= 30; d++) {
    const posts = [0, 0, 1, 0, 2, 1, 0, 3, 1, 0][d % 10];
    days.push({ day: d, posts });
  }
  return days;
}
