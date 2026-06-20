import type { Database } from "../types";

// ============================================================
// Seed data — gives you a fully-populated demo memorial on first
// run, so the public site, admin dashboard, and tribute wall all
// have something to show immediately.
//
// Demo admin login:  email `admin@memorial.demo`  password `demo1234`
// ============================================================

export const seedData: Database = {
  tenants: [
    {
      id: "tenant-demo",
      email: "admin@memorial.demo",
      name: "The Johnson Family",
      createdAt: "2024-09-01T10:00:00.000Z",
      tier: "premium",
      // sha-256 of "demo1234" (see lib/auth.ts:hashPassword)
      passwordHash:
        "0ead2060b65992dca4769af601a1b3a35ef38cfad2c2c465bb160ea764157c5d",
    },
  ],
  memorials: [
    {
      id: "mem-mary-johnson",
      tenantId: "tenant-demo",
      slug: "mary-johnson",
      deceasedName: "Mary Elizabeth Johnson",
      birthDate: "1948-03-14",
      passingDate: "2024-08-22",
      tagline: "Beloved mother, grandmother, and friend. Her warmth lives on in everyone she touched.",
      heroImage:
        "https://images.unsplash.com/photo-1500282725795-64349808d5d6?auto=format&fit=crop&w=1920&q=80",
      portraitImage:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80",
      bio: "Mary Elizabeth Johnson was born in spring of 1948 in a small coastal town. A devoted teacher for over thirty years, she believed every child deserved to feel seen. She is remembered for her boundless kindness, her famous lemon cake, and the way she could turn an ordinary afternoon into a memory. She is survived by her husband of 52 years, three children, and seven grandchildren who were the light of her life.",
      customSections: [
        {
          id: "sec-favorite",
          title: "A Life in Her Words",
          body: "“Tell the people you love that you love them, loudly and often. There is no such thing as too much kindness in this world.” — Mary, on her 70th birthday.",
        },
        {
          id: "sec-charity",
          title: "In Lieu of Flowers",
          body: "The family kindly requests that, in place of flowers, donations be made to the Coastal Literacy Foundation, an organisation close to Mary's heart.",
        },
      ],
      serviceInfo: {
        date: "2024-09-02",
        time: "11:00",
        location: "St. Andrew's Chapel, 24 Harbour Lane, Seabrook",
        notes: "A reception will follow in the chapel hall. All are welcome.",
      },
      livestreamUrl: "",
      theme: "ivory",
      published: true,
      createdAt: "2024-09-01T10:00:00.000Z",
      updatedAt: "2024-09-01T10:00:00.000Z",
    },
  ],
  media: [
    {
      id: "med-1",
      memorialId: "mem-mary-johnson",
      url: "https://images.unsplash.com/photo-1499955085172-a104c9463ece?auto=format&fit=crop&w=900&q=80",
      caption: "Mary, summer 1972",
      createdAt: "2024-09-01T10:00:00.000Z",
    },
    {
      id: "med-2",
      memorialId: "mem-mary-johnson",
      url: "https://images.unsplash.com/photo-1492821867733-5dbfca7a0c4e?auto=format&fit=crop&w=900&q=80",
      caption: "Family reunion, 1989",
      createdAt: "2024-09-01T10:00:00.000Z",
    },
    {
      id: "med-3",
      memorialId: "mem-mary-johnson",
      url: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=900&q=80",
      caption: "In her garden",
      createdAt: "2024-09-01T10:00:00.000Z",
    },
    {
      id: "med-4",
      memorialId: "mem-mary-johnson",
      url: "https://images.unsplash.com/photo-1418065460487-3e41a6c84dc5?auto=format&fit=crop&w=900&q=80",
      caption: "Walking the shore",
      createdAt: "2024-09-01T10:00:00.000Z",
    },
    {
      id: "med-5",
      memorialId: "mem-mary-johnson",
      url: "https://images.unsplash.com/photo-1444930694458-01babe71870e?auto=format&fit=crop&w=900&q=80",
      caption: "Teaching, 1995",
      createdAt: "2024-09-01T10:00:00.000Z",
    },
    {
      id: "med-6",
      memorialId: "mem-mary-johnson",
      url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=900&q=80",
      caption: "Her favourite view",
      createdAt: "2024-09-01T10:00:00.000Z",
    },
  ],
  tributes: [
    {
      id: "trib-1",
      memorialId: "mem-mary-johnson",
      type: "message",
      authorName: "Sarah M.",
      message:
        "Mrs. Johnson was my third-grade teacher and I never forgot her. She made me feel like I mattered. My deepest condolences to the whole family.",
      status: "approved",
      createdAt: "2024-09-02T14:00:00.000Z",
    },
    {
      id: "trib-2",
      memorialId: "mem-mary-johnson",
      type: "candle",
      authorName: "The Alvarez Family",
      message: "Lighting a candle for a beautiful soul. Rest in peace.",
      status: "approved",
      createdAt: "2024-09-02T15:30:00.000Z",
    },
    {
      id: "trib-3",
      memorialId: "mem-mary-johnson",
      type: "message",
      authorName: "David R.",
      message: "Thinking of you all during this difficult time.",
      status: "pending",
      createdAt: "2024-09-03T09:00:00.000Z",
    },
  ],
  sessions: {},
};
